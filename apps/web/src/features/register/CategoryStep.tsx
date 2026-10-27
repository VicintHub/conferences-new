"use client";

import Link from "next/link";
import { OptionCard } from "@/components/ui";
import { categories, type RegistrationDraft } from "./schema";

type Props = {
  id: string;
  value: RegistrationDraft["category"];
  onChange: (v: RegistrationDraft["category"]) => void;
  onSubmit: () => void;
};

export function CategoryStep({ id, value, onChange, onSubmit }: Props) {
  return (
    <form
      id={id}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-3"
    >
      <div role="radiogroup" aria-label="Registration category" className="flex flex-col gap-3">
        {categories.map((c) => (
          <OptionCard
            key={c.value}
            lead={c.lead}
            title={c.title}
            description={c.description}
            selected={value === c.value}
            onSelect={() => onChange(c.value)}
          />
        ))}
      </div>
      <Link href="/app/apply" className="mt-2 flex items-center gap-3 rounded-[20px] border-[1.5px] border-dashed border-ink-200 p-4">
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-semibold text-ink-800">VIP, speaker, vendor or media?</span>
          <span className="text-[13px] text-ink-400">These roles apply for approval</span>
        </span>
        <span className="text-sm font-semibold text-brick-600">Apply →</span>
      </Link>
    </form>
  );
}
