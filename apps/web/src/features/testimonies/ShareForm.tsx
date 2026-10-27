"use client";

import { useMutation } from "@tanstack/react-query";
import { Mic, PenLine, Video } from "lucide-react";
import { useRef, useState } from "react";
import { Button, Chip, Input, Switch } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { submitTestimony } from "./api";

export const TAGS = ["Healing", "Ministry", "Family", "Provision", "Salvation"];
const MAX = 600;
const formats = [
  { value: "write", label: "Write", Icon: PenLine },
  { value: "voice", label: "Voice", Icon: Mic },
  { value: "video", label: "Video", Icon: Video },
] as const;
type Format = (typeof formats)[number]["value"];
const MAX_MB = 50;

type Props = {
  /** panel = compact desktop card (design 14a); full = phone form with formats and tags (design 13b). */
  variant: "panel" | "full";
  /** Signed-in attendees don't retype their name; guests on the public pages do. */
  signedIn: boolean;
  onDone: () => void;
};

export function ShareForm({ variant, signedIn, onDone }: Props) {
  const full = variant === "full";
  const [format, setFormat] = useState<Format>("write");
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showName, setShowName] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const send = useMutation({
    mutationFn: (form: FormData) => submitTestimony(form),
    onSuccess: onDone,
    onError: (e: ApiError) =>
      setErrors(
        e.status === 422 ? e.fieldErrors : { form: e.status === 429 ? "You’ve shared a few already. Please try again later." : e.message },
      ),
  });

  const effectiveType: Format = !full && file ? "video" : format;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!signedIn && name.trim().length < 2) next.name = "Enter your name";
    if (effectiveType === "write" && body.trim().length < 10) next.body = "Tell us a little more (at least 10 characters)";
    if (effectiveType !== "write" && !file)
      next.media = effectiveType === "voice" ? "Record or choose a voice note" : "Record or choose a video";
    if (file && file.size > MAX_MB * 1024 * 1024) next.media = `That file is over ${MAX_MB} MB`;
    setErrors(next);
    if (Object.keys(next).length) return;

    const form = new FormData();
    form.set("type", effectiveType);
    if (!signedIn) form.set("name", name.trim());
    if (place.trim()) form.set("place", place.trim());
    if (body.trim()) form.set("body", body.trim());
    tags.forEach((t) => form.append("tags[]", t));
    form.set("show_name", showName ? "1" : "0");
    if (file) form.set("media", file);
    send.mutate(form);
  };

  const toggleTag = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : cur.length < 3 ? [...cur, t] : cur));
  const err = (k: string) => errors[k] ?? errors[`${k}.0`];

  const textarea = (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="testimony-body"
        className={full ? "text-[15px] font-bold text-ink-900" : "text-xs font-semibold uppercase tracking-[0.06em] text-ink-600"}
      >
        {full ? (format === "write" ? "What happened?" : "Add a few words (optional)") : "Your testimony"}
      </label>
      <textarea
        id="testimony-body"
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, MAX))}
        placeholder={full ? "" : "What did God do?"}
        aria-invalid={!!err("body")}
        className={cn(
          "w-full resize-none text-[15px] leading-[1.55] text-ink-800 outline-none placeholder:text-ink-400",
          full
            ? "min-h-[170px] rounded-[18px] bg-ink-50 p-4 focus:shadow-[var(--ring)]"
            : "h-[140px] rounded-[var(--radius-input)] border-[1.5px] border-ink-200 p-3.5 focus:border-cobalt-500 focus:shadow-[var(--ring)]",
        )}
      />
      {full && (
        <span className="self-end text-xs text-ink-400">
          {body.length} / {MAX}
        </span>
      )}
      {err("body") && (
        <span role="alert" className="text-sm text-brick-600">
          {err("body")}
        </span>
      )}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className={cn("flex flex-col", full ? "gap-[18px]" : "gap-4")}>
      {full && (
        <div role="radiogroup" aria-label="How to share" className="grid grid-cols-3 gap-2.5">
          {formats.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={format === value}
              onClick={() => {
                setFormat(value);
                setFile(null);
                setErrors({});
              }}
              className={cn(
                "flex flex-col items-center gap-2 rounded-[18px] py-4",
                format === value
                  ? "border-2 border-cobalt-600 bg-cobalt-50 text-cobalt-700"
                  : "border border-ink-100 bg-white text-ink-500",
              )}
            >
              <Icon size={22} strokeWidth={2} />
              <span className="text-[13px] font-bold text-ink-900">{label}</span>
            </button>
          ))}
        </div>
      )}

      {!signedIn && (
        <>
          <Input
            label="Your name"
            placeholder="Adebayo Ogunleye"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={err("name")}
          />
          <Input
            label="City / church"
            placeholder="Ibadan · Christ Life Assembly"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            error={err("place")}
          />
        </>
      )}

      {(format === "write" || !full) && textarea}
      {full && format !== "write" && (
        <>
          <MediaPicker format={format} file={file} onPick={setFile} inputRef={fileRef} error={err("media")} />
          {textarea}
        </>
      )}
      {!full && (
        <>
          <MediaPicker format="video" file={file} onPick={setFile} inputRef={fileRef} error={err("media")} compact />
        </>
      )}

      {full && (
        <div className="flex flex-col gap-2">
          <span className="text-[15px] font-bold text-ink-900">It’s about</span>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <Chip key={t} selected={tags.includes(t)} onClick={() => toggleTag(t)}>
                {t}
              </Chip>
            ))}
          </div>
          {err("tags") && (
            <span role="alert" className="text-sm text-brick-600">
              {err("tags")}
            </span>
          )}
        </div>
      )}

      {full && (
        <div className="flex flex-col gap-1.5">
          <Switch label="Show my name" checked={showName} onChange={setShowName} />
          <span className="px-1 text-xs text-ink-400">Off shows “A delegate from {place.trim() || "your place"}”</span>
        </div>
      )}

      {errors.form && (
        <p role="alert" className="text-sm text-brick-600">
          {errors.form}
        </p>
      )}
      <Button type="submit" size="lg" fullWidth disabled={send.isPending}>
        {send.isPending ? (file ? "Uploading…" : "Sending…") : "Submit"}
      </Button>
      <span className={cn("text-ink-400", full ? "text-xs leading-[1.5]" : "text-[13px] leading-[1.5]")}>
        {full ? "The media team reviews each testimony before it appears." : "Reviewed by the media team before publishing."}
      </span>
    </form>
  );
}

function MediaPicker({
  format,
  file,
  onPick,
  inputRef,
  error,
  compact,
}: {
  format: Format;
  file: File | null;
  onPick: (f: File | null) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  error?: string;
  compact?: boolean;
}) {
  const video = format === "video";
  const Icon = video ? Video : Mic;
  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={video ? "video/*" : "audio/*"}
        capture={compact ? undefined : video ? "user" : undefined}
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        aria-label={video ? "Video file" : "Voice note file"}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-3 rounded-[14px] border-[1.5px] border-dashed border-ink-200 p-3.5 text-left text-sm font-semibold text-cobalt-700"
      >
        <Icon size={18} strokeWidth={2} />
        {file ? (
          <span className="min-w-0 flex-1 truncate">
            {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
          </span>
        ) : (
          <span>{compact ? "Add a short video (optional)" : video ? "Record or choose a video" : "Record or choose a voice note"}</span>
        )}
        {file && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Remove file"
            onClick={(e) => {
              e.stopPropagation();
              onPick(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            onKeyDown={(e) => e.key === "Enter" && onPick(null)}
            className="text-ink-400"
          >
            ✕
          </span>
        )}
      </button>
      {error && (
        <span role="alert" className="text-sm text-brick-600">
          {error}
        </span>
      )}
    </div>
  );
}
