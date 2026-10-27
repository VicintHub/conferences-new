"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui";

const key = (id: string) => `jc27.notes.${id}`;

/** Private notes for a session, kept on this device only (works offline, never sent anywhere). */
export function NotesSheet({
  open,
  onOpenChange,
  sessionKey,
  title,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sessionKey: string;
  title: string;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) return;
    try {
      setText(localStorage.getItem(key(sessionKey)) ?? "");
    } catch {
      setText("");
    }
  }, [open, sessionKey]);

  const change = (v: string) => {
    setText(v);
    try {
      if (v) localStorage.setItem(key(sessionKey), v);
      else localStorage.removeItem(key(sessionKey));
    } catch {
      // storage unavailable: the note simply won't persist
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="My notes" description={`${title}. Saved on this phone only.`}>
      <textarea
        aria-label="Notes"
        value={text}
        onChange={(e) => change(e.target.value)}
        rows={8}
        placeholder="Write down what God is saying…"
        className="mt-4 w-full resize-none rounded-[18px] bg-ink-50 p-4 text-[15px] leading-[1.55] text-ink-800 outline-none placeholder:text-ink-400 focus:shadow-[var(--ring)]"
      />
    </Sheet>
  );
}
