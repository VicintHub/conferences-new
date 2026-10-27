"use client";

import { Check } from "lucide-react";
import { useRef } from "react";
import { Badge, Button } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { venueStamp } from "@/lib/time";
import { useUploadDocuments } from "./api";
import type { AppStatus, Application } from "./types";

const tone: Record<AppStatus, "warning" | "success" | "brick" | "cobalt"> = {
  submitted: "cobalt",
  documents_checked: "cobalt",
  in_review: "warning",
  approved: "success",
  declined: "brick",
};

/** "Tracked like a delivery" (design 9e). */
export function ApplicationStatus({ app, onApplyAgain }: { app: Application; onApplyAgain?: () => void }) {
  const upload = useUploadDocuments(app.id);
  const input = useRef<HTMLInputElement>(null);
  const pick = (files: FileList | null) => files?.length && upload.mutate(Array.from(files));
  const err = upload.error instanceof ApiError ? (upload.error.fieldErrors["documents.0"] ?? upload.error.message) : null;

  return (
    <article className="flex flex-col gap-5" aria-label={app.heading}>
      <header className="flex flex-col gap-2 rounded-[24px] bg-cobalt-50 p-5">
        <span className="self-start">
          <Badge tone={tone[app.status]}>{app.status_label}</Badge>
        </span>
        <h2 className="text-[22px] font-bold text-ink-900">{app.heading}</h2>
        {app.summary && <p className="text-[15px] text-ink-500">{app.summary}</p>}
      </header>

      <ol className="flex flex-col">
        {app.timeline.map((s, i) => {
          const last = i === app.timeline.length - 1;
          return (
            <li key={s.key} className="flex gap-4" aria-current={s.state === "current" ? "step" : undefined}>
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-[26px] flex-none items-center justify-center rounded-full border-2",
                    s.state === "done" && "border-success-600 bg-success-600 text-white",
                    s.state === "current" && "border-cobalt-600 bg-white",
                    s.state === "upcoming" && "border-ink-200 bg-white",
                  )}
                >
                  {s.state === "done" && <Check size={14} strokeWidth={3} aria-hidden />}
                </span>
                {!last && <span aria-hidden className={cn("w-0.5 flex-1", s.state === "done" ? "bg-success-600" : "bg-ink-100")} />}
              </div>
              <div className={cn("flex flex-col gap-0.5 pb-6", last && "pb-0")}>
                <span className={cn("text-base font-bold", s.state === "upcoming" ? "text-ink-400" : "text-ink-900")}>{s.title}</span>
                <span className="text-[13px] text-ink-500">{s.at ? venueStamp(s.at) : s.note}</span>
                {s.at && s.note && <span className="text-[13px] text-ink-500">{s.note}</span>}
              </div>
            </li>
          );
        })}
      </ol>

      {app.requested_info && (
        <section className="flex flex-col gap-1.5 rounded-[20px] border border-ink-100 bg-white p-4">
          <h3 className="text-sm font-bold text-ink-900">Committee asked for</h3>
          <p className="text-sm text-ink-600">{app.requested_info}</p>
          <input
            ref={input}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            aria-label="Upload documents"
            className="sr-only"
            onChange={(e) => pick(e.target.files)}
          />
          <button
            type="button"
            disabled={upload.isPending}
            onClick={() => input.current?.click()}
            className="self-start py-1 text-sm font-bold text-cobalt-700 disabled:opacity-50"
          >
            {upload.isPending ? "Uploading…" : "Upload now"}
          </button>
          {err && (
            <p role="alert" className="text-sm text-brick-600">
              {err}
            </p>
          )}
        </section>
      )}

      {app.status === "approved" && (
        <p role="status" className="rounded-2xl bg-success-100 p-4 text-sm text-success-600">
          You’re approved. We’ve emailed you the next steps.
          {app.decision_note ? ` ${app.decision_note}` : ""}
        </p>
      )}
      {app.status === "declined" && (
        <div className="flex flex-col gap-3 rounded-2xl bg-brick-100 p-4 text-sm text-brick-800">
          <p>The committee wasn’t able to approve this application.{app.decision_note ? ` ${app.decision_note}` : ""}</p>
          {onApplyAgain && (
            <Button variant="outline" onClick={onApplyAgain}>
              Apply again
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
