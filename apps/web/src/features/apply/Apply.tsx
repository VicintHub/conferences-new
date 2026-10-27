"use client";

import { ArrowLeft, Mic, Star, Store, Upload, Video } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, Input } from "@/components/ui";
import { useMe } from "@/features/app/queries";
import { ErrorNote, SkeletonBlock } from "@/features/app/ui";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useApplications, useSubmitApplication } from "./api";
import { roleForms, schemaFor, type Field } from "./roles";
import { ApplicationStatus } from "./Status";
import type { RoleKey } from "./types";

const icons: Record<RoleKey, typeof Star> = { vip: Star, speaker: Mic, vendor: Store, media: Video };
const MAX_FILES = 6;
const MAX_MB = 5;

/** Apply to attend (designs 9d/9e mobile, 10b desktop). Shows the tracker once there is an application to follow. */
export function Apply() {
  const apps = useApplications();
  const [creating, setCreating] = useState(false);

  if (apps.isError)
    return (
      <div className="p-5 pt-[60px]">
        <ErrorNote onRetry={() => apps.refetch()} />
      </div>
    );
  if (apps.isPending)
    return (
      <div className="flex flex-col gap-4 px-5 pt-[60px]" aria-busy="true">
        <SkeletonBlock className="h-32" />
        <SkeletonBlock className="h-56" />
      </div>
    );

  const { data: list, meta } = apps.data;
  const taken = new Set(list.filter((a) => a.status !== "declined").map((a) => a.role));
  const free = meta.roles.filter((r) => !taken.has(r.key));

  if (list.length > 0 && !creating) {
    return (
      <div className="flex flex-col gap-6 px-5 pb-10 pt-[60px] lg:mx-auto lg:w-full lg:max-w-[560px] lg:pt-9">
        <div className="flex items-center gap-3">
          <Link href="/app/more" aria-label="Back" className="-ml-1 p-1 text-ink-900">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-ink-900">My application{list.length > 1 ? "s" : ""}</h1>
        </div>
        {list.map((a) => (
          <ApplicationStatus key={a.id} app={a} onApplyAgain={() => setCreating(true)} />
        ))}
        {free.length > 0 && (
          <Button variant="outline" size="lg" fullWidth onClick={() => setCreating(true)}>
            Apply for another role
          </Button>
        )}
      </div>
    );
  }

  return <ApplyForm roles={free.length ? free : meta.roles} hasApplications={list.length > 0} onCancel={() => setCreating(false)} />;
}

function ApplyForm({
  roles,
  hasApplications,
  onCancel,
}: {
  roles: { key: RoleKey; label: string; blurb: string }[];
  hasApplications: boolean;
  onCancel: () => void;
}) {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const { me } = useMe();
  const submit = useSubmitApplication();
  const [role, setRole] = useState<RoleKey | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInput = useRef<HTMLInputElement>(null);

  // Start the contact name from their account; they can change it.
  useEffect(() => {
    if (me) setValues((v) => (v.contact_name ? v : { ...v, contact_name: me.attendee.full_name }));
  }, [me]);

  const pickRole = (r: RoleKey) => {
    setRole(r);
    setErrors({});
  };
  const form = role ? roleForms[role] : null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    const parsed = schemaFor(role).safeParse(Object.fromEntries(roleForms[role].fields.map((f) => [f.name, values[f.name] ?? ""])));
    const next: Record<string, string> = {};
    if (!parsed.success) for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message;
    if (roleForms[role].upload.required && files.length === 0) next.documents = "Add at least one file";
    setErrors(next);
    if (Object.keys(next).length || !parsed.success) return;
    try {
      await submit.mutateAsync({ role, values: parsed.data as Record<string, string | number>, files });
      onCancel(); // back to the tracker, which now has this application
    } catch (err) {
      if (err instanceof ApiError && err.status === 422)
        setErrors(Object.fromEntries(Object.entries(err.fieldErrors).map(([k, v]) => [k.replace(/^documents\.\d+$/, "documents"), v])));
      else setErrors({ form: err instanceof ApiError ? err.message : "Something went wrong." });
    }
  };

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const picked = [...files, ...Array.from(list)].slice(0, MAX_FILES);
    const tooBig = picked.find((f) => f.size > MAX_MB * 1024 * 1024);
    setErrors((e) => ({ ...e, documents: tooBig ? `${tooBig.name} is over ${MAX_MB} MB` : "" }));
    setFiles(tooBig ? files : picked);
  };

  const fields = form ? (
    <form onSubmit={send} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {form.fields.map((f) => (
          <div key={f.name} className={cn(f.wide && "lg:col-span-2")}>
            <FieldInput
              field={f}
              value={values[f.name] ?? ""}
              error={errors[f.name]}
              onChange={(v) => setValues((cur) => ({ ...cur, [f.name]: v }))}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        className="flex items-center gap-3 rounded-[20px] border-[1.5px] border-dashed border-ink-200 p-4 text-left focus-visible:outline-none focus-visible:shadow-[var(--ring)]"
      >
        <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-ink-50 text-cobalt-700">
          <Upload size={20} aria-hidden />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[15px] font-bold text-ink-900">{form.upload.label}</span>
          <span className="truncate text-xs text-ink-400">{files.length ? files.map((f) => f.name).join(", ") : form.upload.hint}</span>
        </span>
      </button>
      <input
        ref={fileInput}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        aria-label="Documents"
        className="sr-only"
        onChange={(e) => onFiles(e.target.files)}
      />
      {errors.documents && (
        <p role="alert" className="text-sm text-brick-600">
          {errors.documents}
        </p>
      )}
      {(errors.form || errors.role) && (
        <p role="alert" className="text-sm text-brick-600">
          {errors.form ?? errors.role}
        </p>
      )}
      <div className="lg:self-end">
        <Button type="submit" size="lg" fullWidth disabled={submit.isPending}>
          {submit.isPending ? "Submitting…" : "Submit application"}
        </Button>
      </div>
    </form>
  ) : null;

  const roleCards = (layout: "grid" | "list") => (
    <div role="radiogroup" aria-label="Apply as" className={layout === "grid" ? "grid grid-cols-2 gap-3.5" : "flex flex-col gap-3.5"}>
      {roles.map((r) => {
        const Icon = icons[r.key];
        const on = role === r.key;
        return (
          <button
            key={r.key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => pickRole(r.key)}
            className={cn(
              "flex rounded-[20px] text-left focus-visible:outline-none focus-visible:shadow-[var(--ring)]",
              layout === "grid" ? "flex-col gap-4 p-4" : "items-center gap-4 px-5 py-4",
              on ? "border-2 border-cobalt-600 bg-cobalt-50" : "border border-ink-100 bg-white",
            )}
          >
            <span
              className={cn(
                "flex size-11 flex-none items-center justify-center rounded-xl",
                on ? "bg-cobalt-600 text-white" : "bg-ink-50 text-cobalt-700",
              )}
            >
              <Icon size={22} aria-hidden />
            </span>
            <span className={cn("flex flex-col", layout === "grid" && "mt-3")}>
              <span className="text-base font-bold text-ink-900">{r.label}</span>
              <span className="text-[13px] leading-[1.35] text-ink-500">{r.blurb}</span>
            </span>
          </button>
        );
      })}
    </div>
  );

  if (desktop) {
    return (
      <div className="grid grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-10 px-10 pb-10 pt-12">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brick-600">By approval</p>
            <h1 className="font-display text-[56px] font-bold uppercase leading-[0.95] text-cobalt-900">Apply to attend</h1>
          </div>
          {roleCards("list")}
          {hasApplications && (
            <Button variant="ghost" onClick={onCancel}>
              Back to my applications
            </Button>
          )}
        </div>
        <section className="rounded-[28px] border border-ink-100 bg-white p-8" aria-label="Application form">
          {form ? (
            <>
              <h2 className="mb-5 text-[22px] font-bold text-ink-900">{form.title}</h2>
              {fields}
            </>
          ) : (
            <p className="py-16 text-center text-[15px] text-ink-400">Choose a role to start your application.</p>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-[60px]">
      <div className="flex items-center justify-between">
        {step === 1 ? (
          hasApplications ? (
            <button type="button" aria-label="Back" onClick={onCancel} className="-ml-1 p-1 text-ink-900">
              <ArrowLeft size={24} />
            </button>
          ) : (
            <Link href="/app/more" aria-label="Back" className="-ml-1 p-1 text-ink-900">
              <ArrowLeft size={24} />
            </Link>
          )
        ) : (
          <button type="button" aria-label="Back" onClick={() => setStep(1)} className="-ml-1 p-1 text-ink-900">
            <ArrowLeft size={24} />
          </button>
        )}
        <span className="text-sm text-ink-500">Step {step} of 2</span>
      </div>
      <div aria-hidden className="mt-4 grid grid-cols-2 gap-1.5">
        <span className="h-1 rounded-full bg-cobalt-600" />
        <span className={cn("h-1 rounded-full", step === 2 ? "bg-cobalt-600" : "bg-ink-100")} />
      </div>

      {step === 1 || !form ? (
        <>
          <h1 className="mt-6 text-[26px] font-bold leading-[1.15] text-ink-900">What are you applying as?</h1>
          <p className="mb-5 mt-2 text-[15px] leading-[1.45] text-ink-500">
            The committee reviews every application. You’ll get an email when it’s decided.
          </p>
          {roleCards("grid")}
          <div className="mt-auto pt-6">
            <Button size="lg" fullWidth disabled={!role} onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        </>
      ) : (
        <>
          <h1 className="mb-5 mt-6 text-[26px] font-bold leading-[1.15] text-ink-900">{form.title}</h1>
          {fields}
        </>
      )}
    </div>
  );
}

function FieldInput({ field, value, error, onChange }: { field: Field; value: string; error?: string; onChange: (v: string) => void }) {
  if (field.kind === "select") {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`f-${field.name}`} className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-600">
          {field.label}
        </label>
        <select
          id={`f-${field.name}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          className={cn(
            "rounded-[var(--radius-input)] border-[1.5px] bg-white px-3 py-3 text-base text-ink-900 outline-none focus:border-cobalt-500 focus:shadow-[var(--ring)]",
            error ? "border-brick-600" : "border-ink-200",
          )}
        >
          <option value="">Choose…</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <span className="text-sm text-brick-600">{error}</span>}
      </div>
    );
  }
  if (field.kind === "textarea") {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`f-${field.name}`} className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-600">
          {field.label}
        </label>
        <textarea
          id={`f-${field.name}`}
          value={value}
          rows={3}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          className={cn(
            "resize-none rounded-[var(--radius-input)] border-[1.5px] bg-white p-3 text-base text-ink-900 outline-none placeholder:text-ink-300 focus:border-cobalt-500 focus:shadow-[var(--ring)]",
            error ? "border-brick-600" : "border-ink-200",
          )}
        />
        {error && <span className="text-sm text-brick-600">{error}</span>}
      </div>
    );
  }
  return (
    <Input
      id={`f-${field.name}`}
      label={field.label}
      type={field.kind === "number" ? "number" : field.kind}
      inputMode={field.kind === "number" ? "numeric" : undefined}
      min={field.min}
      max={field.max}
      placeholder={field.placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
    />
  );
}
