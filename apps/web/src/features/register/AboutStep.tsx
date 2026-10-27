"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Input, Segmented } from "@/components/ui";
import { cn } from "@/lib/cn";
import { COUNTRIES } from "@/lib/phone";
import { ageBands, aboutSchema, type RegistrationDraft } from "./schema";

type Values = Pick<RegistrationDraft, "full_name" | "country" | "phone_national" | "email" | "church" | "location" | "age_band">;

type Props = { id: string; defaults: Values; onSubmit: (v: Values) => void };

export function AboutStep({ id, defaults, onSubmit }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(aboutSchema), defaultValues: defaults, mode: "onTouched" });
  const err = (k: keyof Values) => errors[k]?.message;

  return (
    <form id={id} onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4 md:gap-[22px]">
      <Input label="Full name" placeholder="Adebayo Ogunleye" autoComplete="name" error={err("full_name")} {...register("full_name")} />

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          hint="We’ll email a code and a sign-in link. This is how you sign in."
          error={err("email")}
          {...register("email")}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone_national" className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-600">
            Phone number (optional)
          </label>
          <div
            className={cn(
              "flex h-12 overflow-hidden rounded-[var(--radius-input)] border-[1.5px] bg-white focus-within:border-cobalt-500 focus-within:shadow-[var(--ring)]",
              err("phone_national") ? "border-brick-600" : "border-ink-200",
            )}
          >
            <select
              aria-label="Country code"
              className="border-r border-ink-100 bg-transparent px-3 text-[15px] font-semibold text-ink-800 outline-none"
              {...register("country")}
            >
              {COUNTRIES.map((c) => (
                <option key={c.iso} value={c.iso}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              id="phone_national"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="803 456 7821"
              aria-invalid={!!err("phone_national")}
              className="min-w-0 flex-1 bg-transparent px-3 text-base text-ink-900 outline-none placeholder:text-ink-300"
              {...register("phone_national")}
            />
          </div>
          <span className={cn("text-xs", err("phone_national") ? "text-brick-600" : "text-ink-400")}>
            {err("phone_national") ?? "For event-day updates. Not used to sign in."}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Church / ministry" placeholder="e.g. Christ Life Assembly, Ibadan" error={err("church")} {...register("church")} />
        <div className="hidden md:block">
          <Input label="State / country" placeholder="Oyo, Nigeria" error={err("location")} {...register("location")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-600 md:text-xs">Age</span>
        <div className="md:max-w-sm">
          <Controller
            control={control}
            name="age_band"
            render={({ field }) => (
              <Segmented
                label="Age"
                value={field.value}
                onChange={field.onChange}
                options={ageBands.map((a) => ({ value: a.value, label: a.label }))}
              />
            )}
          />
        </div>
        <span className="text-xs text-ink-400 md:text-sm">IYLC is for ages 16–45.</span>
      </div>
    </form>
  );
}
