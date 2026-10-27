"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button, Input } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { venueStamp } from "@/lib/time";
import { admin, json } from "./api";
import { useDebounced } from "./Registrants";
import type { BroadcastMeta, BroadcastRow } from "./types";
import { Card, Loading, PageHeader, Problem, Tag } from "./ui";

const MAX = 1000;
const STATUS_TONE = { scheduled: "warning", sending: "cobalt", sent: "success", cancelled: "neutral" } as const;

/** A "YYYY-MM-DDTHH:mm" from the picker, read as venue time (Ibadan), to an instant. */
const venueInstant = (local: string) => `${local}:00+01:00`;

/** Chip that can be toggled on, and can be shown as not available (with the reason on hover). */
function Chip({
  label,
  on,
  onClick,
  disabled,
  hint,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      title={hint}
      onClick={onClick}
      className={cn(
        "rounded-full border-[1.5px] px-5 py-2.5 text-[15px] font-bold leading-none focus-visible:outline-none focus-visible:shadow-[var(--ring)]",
        on ? "border-cobalt-950 bg-cobalt-950 text-cream-50" : "border-ink-200 bg-white text-ink-700",
        disabled && "cursor-not-allowed opacity-45",
      )}
    >
      {label}
    </button>
  );
}

/** New broadcast (design 15a) with the live preview, plus what has gone out. */
export function Broadcasts() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["admin", "broadcasts"],
    queryFn: () => admin<{ data: BroadcastRow[]; meta: BroadcastMeta }>("broadcasts"),
  });

  const [channels, setChannels] = useState<string[]>(["email"]);
  const [audience, setAudience] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [when, setWhen] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const debounced = useDebounced(audience, 250);
  const reach = useQuery({
    queryKey: ["admin", "reach", debounced],
    queryFn: async () => (await admin<{ data: { reach: number } }>("broadcasts/preview", json("POST", { audience: debounced }))).data.reach,
    enabled: debounced.length > 0,
  });

  const send = useMutation({
    mutationFn: () =>
      admin<{ data: BroadcastRow }>(
        "broadcasts",
        json("POST", { title, body, channels, audience, ...(when ? { scheduled_at: venueInstant(when) } : {}) }),
      ),
    onSuccess: (r) => {
      setNotice(
        r.data.status === "sent"
          ? `Sent to ${r.data.recipients_count.toLocaleString("en-NG")} people.`
          : `Scheduled for ${venueStamp(r.data.scheduled_at!)}.`,
      );
      setTitle("");
      setBody("");
      setWhen("");
      setErrors({});
      void qc.invalidateQueries({ queryKey: ["admin", "broadcasts"] });
    },
    onError: (e: ApiError) => setErrors(e.status === 422 ? { ...e.fieldErrors, form: e.fieldErrors.channels ?? "" } : { form: e.message }),
  });
  const test = useMutation({
    mutationFn: () => admin<{ message: string }>("broadcasts/test", json("POST", { title, body })),
    onSuccess: (r) => setNotice(r.message),
    onError: (e: ApiError) => setErrors({ form: e.message }),
  });
  const cancel = useMutation({
    mutationFn: (id: number) => admin(`broadcasts/${id}/cancel`, json("POST")),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "broadcasts"] }),
  });

  // Clear the confirmation as soon as they start the next message.
  useEffect(() => {
    if (title || body) setNotice(null);
  }, [title, body]);

  if (list.isPending) return <Loading rows={4} />;
  if (list.isError) return <Problem error={list.error} onRetry={() => list.refetch()} />;

  const { channels: channelOptions, audiences } = list.data.meta;
  const toggle = (set: (f: (v: string[]) => string[]) => void, key: string) =>
    set((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));
  const ready = title.trim().length >= 2 && body.trim().length >= 2 && channels.length > 0 && audience.length > 0;
  const shown = when ? new Date(venueInstant(when)) : new Date();

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-5">
          <PageHeader title="New broadcast" />
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 font-bold text-ink-900">Send via</legend>
            <div className="flex flex-wrap gap-3">
              {channelOptions.map((c) => (
                <Chip
                  key={c.key}
                  label={c.label}
                  on={channels.includes(c.key)}
                  disabled={!c.available}
                  hint={c.available ? undefined : "Not connected yet"}
                  onClick={() => toggle(setChannels, c.key)}
                />
              ))}
            </div>
            <p className="text-sm text-ink-500">
              Only email is connected so far. Push, SMS and WhatsApp need their providers set up first.
            </p>
          </fieldset>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 font-bold text-ink-900">Audience</legend>
            <div className="flex flex-wrap gap-3">
              {audiences.map((a) => (
                <Chip key={a.key} label={a.label} on={audience.includes(a.key)} onClick={() => toggle(setAudience, a.key)} />
              ))}
            </div>
            <p role="status" className="text-sm text-ink-500">
              {audience.length === 0
                ? "Choose who should get it."
                : reach.data === undefined
                  ? "Counting…"
                  : `Reaches ${reach.data.toLocaleString("en-NG")} ${reach.data === 1 ? "person" : "people"}`}
            </p>
          </fieldset>

          <Input
            label="Title"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Gate B opens at 1:15 PM"
            error={errors.title}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bc-body" className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-600">
              Message
            </label>
            <textarea
              id="bc-body"
              value={body}
              maxLength={MAX}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              aria-invalid={!!errors.body}
              className="resize-y rounded-[var(--radius-input)] border-[1.5px] border-ink-200 bg-white p-3.5 text-base text-ink-900 outline-none focus:border-cobalt-500 focus:shadow-[var(--ring)]"
            />
            <span className="self-end text-xs text-ink-400">
              {body.length} / {MAX}
            </span>
            {errors.body && <span className="text-sm text-brick-600">{errors.body}</span>}
          </div>

          <label className="flex items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-white px-5 py-3.5">
            <span className="font-bold text-ink-900">Schedule</span>
            <span className="flex items-center gap-3">
              <input
                type="datetime-local"
                aria-label="Send at (Ibadan time)"
                value={when}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setWhen(e.target.value)}
                className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-semibold text-cobalt-800"
              />
              {when && (
                <button type="button" onClick={() => setWhen("")} className="text-sm font-semibold text-ink-500">
                  Clear
                </button>
              )}
            </span>
          </label>
          {!when && <p className="-mt-3 text-sm text-ink-500">Leave empty to send right away. Times are Ibadan time.</p>}

          {(errors.form || errors.scheduled_at || errors.audience || errors.channels) && (
            <p role="alert" className="text-sm text-brick-600">
              {errors.form || errors.scheduled_at || errors.audience || errors.channels}
            </p>
          )}
          {notice && (
            <p role="status" className="rounded-xl bg-success-100 px-4 py-3 text-sm font-semibold text-success-600">
              {notice}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              disabled={test.isPending || title.trim().length < 2 || body.trim().length < 2}
              onClick={() => test.mutate()}
            >
              Send test
            </Button>
            <Button disabled={!ready || send.isPending} onClick={() => (setErrors({}), send.mutate())}>
              {send.isPending ? "Sending…" : when ? "Schedule" : "Send now"}
            </Button>
          </div>
        </div>

        <aside aria-label="Preview" className="flex flex-col gap-3">
          <h2 className="font-bold text-ink-900">Preview</h2>
          <div className="flex min-h-[480px] flex-col rounded-[44px] bg-cobalt-950 p-5 text-white">
            <p className="mt-6 text-center font-display text-[52px] font-bold leading-none">
              {shown.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" })}
            </p>
            <p className="mt-2 text-center text-sm text-cobalt-100">
              {shown.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Lagos" })}
            </p>
            <div className="mt-8 flex gap-3 rounded-2xl bg-cream-50/95 p-3.5 text-ink-900">
              <Image
                src="/images/miv-logo.png"
                alt=""
                width={36}
                height={36}
                className="size-9 flex-none rounded-lg bg-cobalt-950 object-contain p-1"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{title || "Your title"}</p>
                <p className="line-clamp-2 text-[13px] leading-snug text-ink-700">{body || "Your message appears here."}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <section aria-label="Recent broadcasts" className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-ink-900">Recent</h2>
        {list.data.data.length === 0 && <p className="text-sm text-ink-500">Nothing sent yet.</p>}
        {list.data.data.map((b) => (
          <Card key={b.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate font-bold text-ink-900">{b.title}</span>
              <span className="text-sm text-ink-500">
                {b.author ?? "Staff"} · {b.channels.join(", ")} · {b.audience.join(", ")}
                {b.status === "sent"
                  ? ` · ${b.recipients_count.toLocaleString("en-NG")} reached`
                  : b.scheduled_at
                    ? ` · ${venueStamp(b.scheduled_at)}`
                    : ""}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Tag tone={STATUS_TONE[b.status]}>{b.status}</Tag>
              {b.status === "scheduled" && (
                <button type="button" onClick={() => cancel.mutate(b.id)} className="text-sm font-bold text-brick-600">
                  Cancel
                </button>
              )}
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
