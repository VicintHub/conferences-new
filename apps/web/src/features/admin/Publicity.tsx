"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button, Input } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { venueStamp } from "@/lib/time";
import { admin, json } from "./api";
import type { PublicityMeta, PublicityRow } from "./types";
import { Card, Loading, PageHeader, Problem, Tag } from "./ui";

const MAX_MB = 500;
const venueInstant = (local: string) => `${local}:00+01:00`;
const SINGULAR: Record<string, string> = { flyer: "Flyer", status: "Status", video: "Video", design: "Design", logo: "Logo" };
const STATUS = { published: ["success", "Published"], scheduled: ["cobalt", "Scheduled"], draft: ["neutral", "Draft"] } as const;

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "rounded-full border-[1.5px] px-4 py-2 text-sm font-bold leading-none",
        on ? "border-cobalt-950 bg-cobalt-950 text-cream-50" : "border-ink-200 bg-white text-ink-700",
      )}
    >
      {label}
    </button>
  );
}

/** Publicity kit (design 15a): what's out there and how it's doing, plus the upload form. */
export function Publicity() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "publicity"],
    queryFn: () => admin<{ data: PublicityRow[]; meta: PublicityMeta }>("publicity"),
  });

  const file = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("flyer");
  const [sizes, setSizes] = useState<string[]>(["square", "status"]);
  const [caption, setCaption] = useState("");
  const [when, setWhen] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const reset = () => {
    setPicked(null);
    setTitle("");
    setCaption("");
    setWhen("");
    if (file.current) file.current.value = "";
  };

  const upload = useMutation({
    mutationFn: (publish: "now" | "schedule" | "draft") => {
      const form = new FormData();
      form.set("title", title.trim());
      form.set("type", type);
      form.set("caption", caption.trim());
      sizes.forEach((s) => form.append("sizes[]", s));
      form.set("publish", publish);
      if (publish === "schedule") form.set("publish_at", venueInstant(when));
      if (picked) form.set("file", picked);
      return admin<{ data: PublicityRow }>("publicity", { method: "POST", body: form });
    },
    onSuccess: (r) => {
      setNotice(`${r.data.title} is ${r.data.status === "published" ? "live in the app" : r.data.status}.`);
      setErrors({});
      reset();
      void qc.invalidateQueries({ queryKey: ["admin", "publicity"] });
    },
    onError: (e: ApiError) => setErrors(e.status === 422 ? { ...e.fieldErrors, form: "" } : { form: e.message }),
  });
  const change = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) => admin(`publicity/${id}`, json("PATCH", body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "publicity"] }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => admin(`publicity/${id}`, json("DELETE")),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "publicity"] }),
  });

  const choose = (f: File | undefined) => {
    setNotice(null);
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) return setErrors({ file: `That file is over ${MAX_MB} MB.` });
    setErrors({});
    setPicked(f);
    setTitle((t) => t || f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
  };

  const validate = (publish: "now" | "schedule" | "draft") => {
    const next: Record<string, string> = {};
    if (!picked) next.file = "Choose a file to upload.";
    if (title.trim().length < 2) next.title = "Give it a title.";
    if (caption.trim().length < 2) next.caption = "Add a caption people can copy.";
    if (publish === "schedule" && !when) next.publish_at = "Pick when it should go live.";
    setErrors(next);
    if (Object.keys(next).length === 0) upload.mutate(publish);
  };

  if (q.isPending) return <Loading rows={4} />;
  if (q.isError) return <Problem error={q.error} onRetry={() => q.refetch()} />;
  const { meta } = q.data;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Publicity kit"
        actions={
          <span className="text-sm font-bold text-ink-600">{`${meta.shares.toLocaleString("en-NG")} shares · ${meta.downloads.toLocaleString("en-NG")} downloads`}</span>
        }
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-ink-50 text-xs uppercase tracking-[0.08em] text-ink-500">
                {["Item", "Status", "Downloads", "Shares"].map((h) => (
                  <th key={h} scope="col" className="px-5 py-3.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-[15px]">
              {q.data.data.map((i) => (
                <tr key={i.id} className="border-t border-ink-50 align-middle">
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-3">
                      <span className="flex size-[52px] flex-none items-center justify-center overflow-hidden rounded-lg bg-ink-50 text-[10px] text-ink-400">
                        {i.preview ? (
                          // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded previews
                          <img src={i.preview} alt="" className="size-full object-cover" />
                        ) : (
                          "No preview"
                        )}
                      </span>
                      <span className="flex flex-col">
                        <span className="font-bold text-ink-900">{i.title}</span>
                        <span className="text-sm text-ink-500">{[meta.types[i.type] ?? i.type, i.meta].filter(Boolean).join(" · ")}</span>
                        <span className="mt-1 flex gap-3 text-xs font-bold">
                          {i.status === "published" ? (
                            <button
                              type="button"
                              onClick={() => change.mutate({ id: i.id, body: { publish: "draft" } })}
                              className="text-cobalt-700"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => change.mutate({ id: i.id, body: { publish: "now" } })}
                              className="text-cobalt-700"
                            >
                              Publish now
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => window.confirm(`Delete “${i.title}” and its files?`) && remove.mutate(i.id)}
                            className="text-brick-600"
                          >
                            Delete
                          </button>
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Tag tone={STATUS[i.status][0]}>
                      {i.status === "scheduled" && i.published_at ? `Scheduled ${venueStamp(i.published_at)}` : STATUS[i.status][1]}
                    </Tag>
                  </td>
                  <td className="px-5 py-3.5 font-bold">{i.status === "published" ? i.downloads.toLocaleString("en-NG") : "—"}</td>
                  <td className="px-5 py-3.5 font-bold">{i.status === "published" ? i.shares.toLocaleString("en-NG") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {q.data.data.length === 0 && <p className="px-5 py-10 text-center text-sm text-ink-400">Nothing uploaded yet.</p>}
        </Card>

        <Card className="flex flex-col gap-4 p-6">
          <h2 className="text-lg font-bold text-ink-900">Upload content</h2>
          <button
            type="button"
            onClick={() => file.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              choose(e.dataTransfer.files?.[0]);
            }}
            className="flex flex-col items-center gap-2 rounded-[20px] border-2 border-dashed border-cobalt-300 bg-cobalt-50 px-4 py-8 text-center focus-visible:outline-none focus-visible:shadow-[var(--ring)]"
          >
            <Upload size={26} className="text-cobalt-700" aria-hidden />
            <span className="font-bold text-ink-900">{picked ? picked.name : "Drop videos, designs or files"}</span>
            <span className="text-xs text-ink-500">JPG, PNG, PDF, MP4 · up to {MAX_MB} MB</span>
          </button>
          <input
            ref={file}
            type="file"
            aria-label="File"
            accept=".jpg,.jpeg,.png,.webp,.pdf,.mp4"
            className="sr-only"
            onChange={(e) => choose(e.target.files?.[0])}
          />
          {errors.file && (
            <p role="alert" className="text-sm text-brick-600">
              {errors.file}
            </p>
          )}

          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Countdown · 3 days"
            error={errors.title}
          />
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-600">Type</span>
            <div role="group" aria-label="Type" className="flex flex-wrap gap-2">
              {Object.entries(meta.types).map(([key, label]) => (
                <Chip key={key} label={SINGULAR[key] ?? label} on={type === key} onClick={() => setType(key)} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-600">Sizes included</span>
            <div role="group" aria-label="Sizes" className="flex flex-wrap gap-2">
              {meta.sizes.map((s) => (
                <Chip
                  key={s.key}
                  label={`${s.label} ${s.dims}`}
                  on={sizes.includes(s.key)}
                  onClick={() => setSizes((cur) => (cur.includes(s.key) ? cur.filter((k) => k !== s.key) : [...cur, s.key]))}
                />
              ))}
            </div>
            <p className="text-xs text-ink-500">Images are cropped to each size automatically. Videos and PDFs are offered as uploaded.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pk-caption" className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-600">
              Suggested caption
            </label>
            <textarea
              id="pk-caption"
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Shown with a Copy button in the app"
              aria-invalid={!!errors.caption}
              className="resize-none rounded-[var(--radius-input)] border-[1.5px] border-ink-200 p-3 text-[15px] outline-none placeholder:text-ink-300 focus:border-cobalt-500 focus:shadow-[var(--ring)]"
            />
            {errors.caption && <span className="text-sm text-brick-600">{errors.caption}</span>}
          </div>
          <label className="flex items-center justify-between gap-3 text-sm font-semibold text-ink-700">
            Go live at (Ibadan time)
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm"
            />
          </label>
          {errors.publish_at && (
            <p role="alert" className="text-sm text-brick-600">
              {errors.publish_at}
            </p>
          )}
          {errors.form && (
            <p role="alert" className="text-sm text-brick-600">
              {errors.form}
            </p>
          )}
          {notice && (
            <p role="status" className="rounded-xl bg-success-100 px-4 py-3 text-sm font-semibold text-success-600">
              {notice}
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="outline" fullWidth disabled={upload.isPending} onClick={() => validate("schedule")}>
              Schedule
            </Button>
            <Button fullWidth disabled={upload.isPending} onClick={() => validate("now")}>
              {upload.isPending ? "Uploading…" : "Publish"}
            </Button>
          </div>
          <button
            type="button"
            disabled={upload.isPending}
            onClick={() => validate("draft")}
            className="text-sm font-semibold text-ink-500"
          >
            Save as draft
          </button>
        </Card>
      </div>
    </div>
  );
}
