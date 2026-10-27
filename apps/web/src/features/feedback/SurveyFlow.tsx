"use client";

import { useState } from "react";
import { Button, Chip } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { ErrorNote, SkeletonBlock } from "@/features/app/ui";
import { useSubmitSurvey, useSurvey, type SurveyQuestion } from "./queries";
import { StarRating } from "./StarRating";

type Answers = Record<string, unknown>;

const answered = (q: SurveyQuestion, a: unknown) => {
  if (!q.required) return true;
  if (q.type === "ratings") return q.items.every((i) => ((a as Record<string, number> | undefined) ?? {})[i] > 0);
  return a !== undefined && a !== "" && !(Array.isArray(a) && a.length === 0);
};

function Question({ q, value, onChange }: { q: SurveyQuestion; value: unknown; onChange: (v: unknown) => void }) {
  if (q.type === "scale") {
    const nums = Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i);
    return (
      <>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${nums.length}, 1fr)` }} role="radiogroup" aria-label={q.text}>
          {nums.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              onClick={() => onChange(n)}
              className={cn(
                "flex h-[52px] items-center justify-center rounded-[14px] border-[1.5px] text-[17px] font-bold",
                value === n ? "border-cobalt-600 bg-cobalt-600 text-white" : "border-ink-200 bg-white text-ink-700",
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-ink-400">
          <span>{q.low}</span>
          <span>{q.high}</span>
        </div>
      </>
    );
  }
  if (q.type === "ratings") {
    const v = (value as Record<string, number> | undefined) ?? {};
    return (
      <div className="flex flex-col">
        {q.items.map((item) => (
          <div key={item} className="flex items-center justify-between border-b border-ink-50 py-3">
            <span className="text-[15px] font-semibold text-ink-800">{item}</span>
            <StarRating label={item} size={20} value={v[item] ?? 0} onChange={(n) => onChange({ ...v, [item]: n })} className="gap-1" />
          </div>
        ))}
      </div>
    );
  }
  if (q.type === "multi") {
    const v = (value as string[] | undefined) ?? [];
    return (
      <div className="flex flex-wrap gap-2">
        {q.options.map((o) => (
          <Chip key={o} selected={v.includes(o)} onClick={() => onChange(v.includes(o) ? v.filter((x) => x !== o) : [...v, o])}>
            {o}
          </Chip>
        ))}
      </div>
    );
  }
  return (
    <textarea
      value={(value as string | undefined) ?? ""}
      onChange={(e) => onChange(e.target.value.slice(0, 1000))}
      aria-label={q.text}
      placeholder="Optional"
      className="min-h-[120px] resize-none rounded-2xl bg-ink-50 p-4 text-[15px] leading-[1.55] text-ink-800 outline-none placeholder:text-ink-400 focus:shadow-[var(--ring)]"
    />
  );
}

/** Whole-conference survey, one question at a time (design 13d). */
export function SurveyFlow() {
  const survey = useSurvey();
  const submit = useSubmitSurvey();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  if (survey.isPending) return <SkeletonBlock className="h-64" />;
  if (survey.isError || !survey.data) return <ErrorNote onRetry={() => survey.refetch()} />;

  const { title, questions, completed } = survey.data;
  if (completed || submit.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[22px] bg-cobalt-900 p-8 text-center text-cream-50">
        <span className="text-[22px] font-bold">Thank you!</span>
        <p className="text-sm leading-[1.5] text-cobalt-200">Your feedback helps us plan the next conference.</p>
      </div>
    );
  }

  const q = questions[index];
  const last = index === questions.length - 1;
  const next = () => {
    if (!last) return setIndex(index + 1);
    const body = Object.fromEntries(Object.entries(answers).filter(([, v]) => v !== "" && v !== undefined));
    submit.mutate(body);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 rounded-[22px] bg-cobalt-900 p-[18px] text-cream-50">
        <span className="text-lg font-bold">{title}</span>
        <span className="text-sm text-cobalt-200">{questions.length} questions · about 2 minutes</span>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-[3px] bg-white/15"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={questions.length}
          aria-valuenow={index + 1}
          aria-label={`Question ${index + 1} of ${questions.length}`}
        >
          <div
            className="h-full bg-cream-50 transition-[width] duration-200"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>
      <h2 className="text-[17px] font-bold leading-[1.3] text-ink-900">{q.text}</h2>
      <Question q={q} value={answers[q.id]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
      {submit.error instanceof ApiError && (
        <p role="alert" className="text-sm text-brick-600">
          {submit.error.message}
        </p>
      )}
      <div className="mt-2 flex flex-col gap-2">
        <Button size="lg" fullWidth disabled={!answered(q, answers[q.id]) || submit.isPending} onClick={next}>
          {last ? (submit.isPending ? "Sending…" : "Submit") : "Next question"}
        </Button>
        {index > 0 && (
          <button type="button" onClick={() => setIndex(index - 1)} className="text-center text-sm font-semibold text-ink-500">
            Back
          </button>
        )}
      </div>
    </div>
  );
}
