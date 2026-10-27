"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button, Sheet } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useImportMembers } from "./api";
import { parseMembersCsv } from "./csv";
import type { ImportResult, NewMember } from "./types";

/** Desktop bulk add (design 10a): pick a CSV, check it, send it. Bad rows are listed, good ones still go through. */
export function ImportSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const run = useImportMembers();
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<NewMember[] | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setRows(null);
    setResult(null);
    setError(null);
    if (input.current) input.current.value = "";
  };

  const pick = async (file: File | undefined) => {
    setResult(null);
    setError(null);
    if (!file) return;
    if (file.size > 512 * 1024) return setError("That file is too large for a member list.");
    const parsed = parseMembersCsv(await file.text());
    if (parsed.length === 0) return setError("We couldn’t find any rows in that file.");
    if (parsed.length > 100) return setError("Import up to 100 people at a time.");
    setRows(parsed);
  };

  const send = async () => {
    if (!rows) return;
    try {
      setResult((await run.mutateAsync(rows)).data);
      setRows(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title="Import from CSV"
      description="One person per row: name, email, phone, category, mode. Everyone gets their own ticket by email."
    >
      <div className="mt-5 flex flex-col gap-4">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex items-center gap-3 rounded-[20px] border-[1.5px] border-dashed border-ink-200 p-4 text-left focus-visible:outline-none focus-visible:shadow-[var(--ring)]"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-ink-50 text-cobalt-700">
            <Upload size={20} />
          </span>
          <span className="flex flex-col">
            <span className="text-[15px] font-bold text-ink-900">{rows ? `${rows.length} people ready` : "Choose a CSV file"}</span>
            <span className="text-xs text-ink-400">name, email, phone, category, mode</span>
          </span>
        </button>
        <input
          ref={input}
          type="file"
          accept=".csv,text/csv"
          aria-label="CSV file"
          className="sr-only"
          onChange={(e) => pick(e.target.files?.[0])}
        />

        {rows && (
          <ul className="max-h-48 overflow-auto rounded-2xl bg-ink-50 p-3 text-sm text-ink-700">
            {rows.slice(0, 8).map((r, i) => (
              <li key={i} className="flex justify-between gap-3 py-1">
                <span className="truncate font-semibold">{r.full_name || "(no name)"}</span>
                <span className="truncate text-ink-500">{r.email || "(no email)"}</span>
              </li>
            ))}
            {rows.length > 8 && <li className="pt-1 text-ink-400">and {rows.length - 8} more</li>}
          </ul>
        )}

        {result && (
          <div role="status" className="flex flex-col gap-2 rounded-2xl bg-cobalt-50 p-4 text-sm text-cobalt-900">
            <strong>
              {result.added} added{result.skipped.length ? `, ${result.skipped.length} skipped` : ""}
            </strong>
            {result.skipped.map((s) => (
              <span key={s.row} className="text-ink-600">
                Row {s.row}
                {s.name ? ` (${s.name})` : ""}: {s.reason}
              </span>
            ))}
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-brick-600">
            {error}
          </p>
        )}
        {result ? (
          <Button size="lg" fullWidth onClick={() => onOpenChange(false)}>
            Done
          </Button>
        ) : (
          <Button size="lg" fullWidth disabled={!rows || run.isPending} onClick={send}>
            {run.isPending ? "Importing…" : "Import & send tickets"}
          </Button>
        )}
      </div>
    </Sheet>
  );
}
