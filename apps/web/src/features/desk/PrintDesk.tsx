"use client";

import { Check, ScanLine, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Sheet } from "@/components/ui";
import { fetchMe } from "@/features/scan/api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { clock12, initials } from "@/lib/time";
import { lookup, useDeskSummary, usePrintBadge } from "./api";
import { BadgeCard } from "./BadgeCard";
import { categoryName, dayRange, type DeskCard } from "./types";

const DESK_KEY = "jc27.desk.name";
const PLACE_KEY = "jc27.desk.place";
const read = (k: string, d: string) => {
  try {
    return localStorage.getItem(k) ?? d;
  } catch {
    return d;
  }
};

/** Print desk (design 16a): scan a claim ticket, check the person's ID, print the badge. */
export function PrintDesk() {
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<DeskCard[]>([]);
  const [card, setCard] = useState<DeskCard | null>(null);
  const [idOk, setIdOk] = useState(false);
  const [phoneOk, setPhoneOk] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [searching, setSearching] = useState(false);
  const [canReprint, setCanReprint] = useState(false);
  const [desk, setDesk] = useState("Print desk 1");
  const [place, setPlace] = useState("Gate A");
  const [settings, setSettings] = useState(false);
  const summary = useDeskSummary();
  const print = usePrintBadge();

  useEffect(() => {
    setDesk(read(DESK_KEY, "Print desk 1"));
    setPlace(read(PLACE_KEY, "Gate A"));
    fetchMe()
      .then((m) => setCanReprint(m.data.areas.includes("override")))
      .catch(() => {});
    input.current?.focus();
  }, []);

  const clear = useCallback(() => {
    setQuery("");
    setMatches([]);
    setCard(null);
    setIdOk(false);
    setPhoneOk(false);
    setReason("");
    print.reset();
    input.current?.focus();
  }, [print]);

  const choose = (c: DeskCard) => {
    setCard(c);
    setMatches([]);
    setIdOk(false);
    setPhoneOk(false);
    setReason("");
    setNote(null);
  };

  const search = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    setNote(null);
    try {
      const { data } = await lookup(q);
      if (data.length === 0) setNote({ tone: "bad", text: "No one found. Check the code, or try the phone number or name." });
      else if (data.length === 1) choose(data[0]!);
      else setMatches(data);
    } catch (e) {
      setNote({
        tone: "bad",
        text: e instanceof ApiError && e.status === 0 ? "No connection. Check the network and try again." : "Couldn’t search. Try again.",
      });
    } finally {
      setSearching(false);
    }
  };

  const printed = !!card?.badge_printed_at;
  const needsReason = printed;
  const ready =
    !!card && card.valid && idOk && (card.phone_last4 === null || phoneOk) && (!printed || (canReprint && reason.trim().length >= 3));

  const doPrint = useCallback(async () => {
    if (!card || !ready) return;
    try {
      await print.mutateAsync({
        registration_id: card.registration_id,
        desk,
        ...(printed ? { reprint: true, reason: reason.trim() } : {}),
      });
      // The print-only badge is already in the page; the browser's print dialog does the rest.
      window.print();
      setNote({ tone: "ok", text: `Badge printed for ${card.name}.` });
      clear();
    } catch (e) {
      setNote({ tone: "bad", text: e instanceof ApiError ? e.message : "Couldn’t print. Try again." });
    }
  }, [card, ready, print, desk, printed, reason, clear]);

  // Enter prints and Esc clears when focus is not in a field, as the design says.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest("input, textarea, select");
      if (e.key === "Escape") return clear();
      if (e.key === "Enter" && !typing) {
        e.preventDefault();
        void doPrint();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clear, doPrint]);

  const checks = card && [
    { key: "id", label: "Photo ID matches the name", ok: idOk, onClick: () => setIdOk((v) => !v) },
    ...(card.phone_last4
      ? [{ key: "phone", label: `Phone ends in …${card.phone_last4}`, ok: phoneOk, onClick: () => setPhoneOk((v) => !v) }]
      : []),
    {
      key: "badge",
      label: printed ? `Badge already printed ${clock12(card.badge_printed_at!)}` : "No badge printed before",
      ok: !printed,
      onClick: undefined,
    },
  ];

  return (
    <>
      <style>{"@page { size: 100mm 150mm; margin: 0 }"}</style>
      <div className="grid min-h-[100svh] bg-cream-50 lg:grid-cols-[minmax(0,1fr)_420px] print:hidden">
        <main className="flex flex-col gap-5 px-6 py-8 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setSettings(true)}
              className="flex items-center gap-3 text-left"
              aria-label="Desk settings"
            >
              <Image src="/images/miv-logo.png" alt="" width={44} height={44} className="size-11 object-contain" />
              <span className="flex flex-col leading-tight">
                <span className="font-display text-[24px] font-bold uppercase text-cobalt-900">{desk}</span>
                <span className="text-sm text-ink-500">{place} · Printer ready</span>
              </span>
            </button>
            <span
              role="status"
              className="flex items-center gap-2 rounded-full bg-success-100 px-4 py-2 text-sm font-bold text-success-600"
            >
              <span aria-hidden className="size-2 rounded-full bg-success-600" />
              {summary.isError ? "Offline" : `Online · ${summary.data?.data.printed_today ?? 0} printed today`}
            </span>
          </header>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void search();
            }}
            className="flex items-center gap-3 rounded-full border-2 border-cobalt-600 bg-white px-5 py-3.5"
          >
            <ScanLine size={22} className="text-ink-500" aria-hidden />
            <input
              ref={input}
              aria-label="Scan a claim ticket, or type a code or phone number"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Scan a claim ticket, or type a code or phone number"
              className="min-w-0 flex-1 bg-transparent text-lg text-ink-900 outline-none placeholder:text-ink-400"
            />
            <Button type="submit" size="sm" disabled={searching || query.trim().length < 2}>
              {searching ? "…" : "Find"}
            </Button>
          </form>

          {note && (
            <p
              role={note.tone === "bad" ? "alert" : "status"}
              className={cn(
                "rounded-2xl px-4 py-3 text-[15px] font-semibold",
                note.tone === "ok" ? "bg-success-100 text-success-600" : "bg-brick-100 text-brick-800",
              )}
            >
              {note.text}
            </p>
          )}

          {matches.length > 0 && (
            <ul aria-label="Matches" className="flex flex-col gap-2 rounded-[24px] border border-ink-100 bg-white p-3">
              {matches.map((m) => (
                <li key={m.registration_id}>
                  <button
                    type="button"
                    onClick={() => choose(m)}
                    className="flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left hover:bg-cream-50"
                  >
                    <span className="flex size-11 flex-none items-center justify-center rounded-full bg-cobalt-100 font-display font-bold text-cobalt-800">
                      {initials(m.name)}
                    </span>
                    <span className="flex flex-col">
                      <span className="font-bold text-ink-900">{m.name}</span>
                      <span className="text-sm text-ink-500">
                        {m.claim_code} · {m.church ?? "—"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {card && (
            <section aria-label="Attendee" className="flex flex-col gap-5 rounded-[28px] border border-ink-100 bg-white p-6">
              <div className="flex items-center gap-5">
                <span className="flex size-[72px] flex-none items-center justify-center rounded-full bg-cobalt-100 font-display text-2xl font-bold text-cobalt-800">
                  {initials(card.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-[34px] font-bold leading-tight text-ink-900">{card.name}</h2>
                  <p className="text-[15px] text-ink-500">
                    {card.claim_code} · {card.church ?? "—"}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex-none rounded-full px-4 py-2 text-sm font-bold",
                    card.valid ? "bg-success-100 text-success-600" : "bg-brick-100 text-brick-800",
                  )}
                >
                  {card.valid ? "Valid ticket" : "Not confirmed"}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  ["Category", categoryName[card.category]],
                  ["Mode", card.mode === "onsite" ? "Onsite" : "Online"],
                  ["Days", dayRange(card.days)],
                  ["Team", card.team_code ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-cream-100 px-4 py-3">
                    <dt className="text-xs text-ink-500">{k}</dt>
                    <dd className="font-bold text-ink-900">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-col gap-3">
                <h3 className="font-bold text-ink-900">Check before printing</h3>
                {checks!.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    role="checkbox"
                    aria-checked={c.ok}
                    disabled={!c.onClick}
                    onClick={c.onClick}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl border-[1.5px] px-5 py-4 text-left font-bold",
                      c.ok
                        ? "border-success-600 bg-success-100 text-ink-900"
                        : c.onClick
                          ? "border-ink-200 bg-white text-ink-700"
                          : "border-brick-600 bg-brick-100 text-brick-800",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 flex-none items-center justify-center rounded-md",
                        c.ok ? "bg-success-600 text-white" : c.onClick ? "border-2 border-ink-300" : "bg-brick-600 text-white",
                      )}
                    >
                      {c.ok ? (
                        <Check size={16} strokeWidth={3} aria-hidden />
                      ) : !c.onClick ? (
                        <X size={16} strokeWidth={3} aria-hidden />
                      ) : null}
                    </span>
                    {c.label}
                  </button>
                ))}
              </div>

              {needsReason &&
                (canReprint ? (
                  <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink-600">
                    Why reprint?
                    <input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Torn, lost, name misspelt…"
                      className="rounded-[var(--radius-input)] border-[1.5px] border-ink-200 px-3 py-3 text-base font-normal normal-case tracking-normal text-ink-900 outline-none focus:border-cobalt-500"
                    />
                  </label>
                ) : (
                  <p role="alert" className="rounded-2xl bg-warning-100 p-4 text-sm font-semibold text-warning-600">
                    A badge was already printed. Ask a supervisor to reprint it.
                  </p>
                ))}
              {print.isError && !note && (
                <p role="alert" className="text-sm text-brick-600">
                  {print.error instanceof ApiError ? print.error.message : "Couldn’t print."}
                </p>
              )}
            </section>
          )}
        </main>

        <aside className="flex flex-col gap-4 border-l border-ink-100 bg-white px-8 py-8">
          <h2 className="font-bold text-ink-900">Badge preview</h2>
          {card ? (
            <BadgeCard card={card} />
          ) : (
            <div className="flex aspect-[2/3] w-full items-center justify-center rounded-3xl border-2 border-dashed border-ink-200 p-6 text-center text-sm text-ink-400">
              The badge appears here once you find someone.
            </div>
          )}
          <div className="mt-auto flex flex-col items-center gap-2">
            <Button size="lg" fullWidth disabled={!ready || print.isPending} onClick={() => void doPrint()}>
              {print.isPending ? "Printing…" : printed ? "Reprint badge" : "Print badge"}
            </Button>
            <p className="text-xs text-ink-500">Press Enter to print · Esc to clear</p>
          </div>
        </aside>

        <Sheet
          open={settings}
          onOpenChange={setSettings}
          title="This desk"
          description="Shown on screen and recorded with every badge this desk prints."
        >
          <div className="mt-4 flex flex-col gap-4">
            <input
              aria-label="Desk name"
              value={desk}
              onChange={(e) => setDesk(e.target.value)}
              className="rounded-[var(--radius-input)] border-[1.5px] border-ink-200 px-4 py-3 text-lg outline-none focus:border-cobalt-500"
            />
            <input
              aria-label="Location"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className="rounded-[var(--radius-input)] border-[1.5px] border-ink-200 px-4 py-3 text-lg outline-none focus:border-cobalt-500"
            />
            <Button
              size="lg"
              fullWidth
              onClick={() => {
                try {
                  localStorage.setItem(DESK_KEY, desk);
                  localStorage.setItem(PLACE_KEY, place);
                } catch {
                  // not saved
                }
                setSettings(false);
              }}
            >
              Save
            </Button>
          </div>
        </Sheet>
      </div>

      {/* What the printer receives: only the badge, at its own size. */}
      {card && (
        <div className="hidden print:block">
          <BadgeCard card={card} className="!aspect-auto !h-screen !rounded-none !shadow-none" />
        </div>
      )}
    </>
  );
}
