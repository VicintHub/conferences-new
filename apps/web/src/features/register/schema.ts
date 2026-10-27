import { z } from "zod";
import { COUNTRIES, isE164, toE164 } from "@/lib/phone";

export const categories = [
  { value: "delegate", lead: "D", title: "Delegate", description: "Church or ministry member" },
  { value: "international", lead: "I", title: "International delegate", description: "Travelling from outside Nigeria" },
  { value: "minister", lead: "M", title: "Minister", description: "Verified by the committee" },
] as const;

export const ageBands = [
  { value: "16-17", label: "16–17" },
  { value: "18-45", label: "18–45" },
  { value: "46+", label: "46+" },
] as const;

/** ISO date sent to the API ↔ chip label shown to the user. */
export const conferenceDays = [
  { iso: "2027-01-19", label: "Tue 19" },
  { iso: "2027-01-20", label: "Wed 20" },
  { iso: "2027-01-21", label: "Thu 21" },
  { iso: "2027-01-22", label: "Fri 22" },
  { iso: "2027-01-23", label: "Sat 23" },
  { iso: "2027-01-24", label: "Sun 24" },
] as const;

const countryIso = z.enum(COUNTRIES.map((c) => c.iso) as [string, ...string[]]);

export const categorySchema = z.object({ category: z.enum(["delegate", "international", "minister"]) });

export const aboutSchema = z
  .object({
    full_name: z.string().trim().min(2, "Enter your full name"),
    country: countryIso,
    phone_national: z.string().trim(),
    email: z.string().trim().min(1, "Enter your email address").email("Enter a valid email address"),
    church: z.string().trim().max(160),
    location: z.string().trim().max(120),
    age_band: z.enum(["16-17", "18-45", "46+"]),
  })
  .superRefine((v, ctx) => {
    if (v.phone_national && !isE164(toE164(v.country as (typeof COUNTRIES)[number]["iso"], v.phone_national))) {
      ctx.addIssue({ code: "custom", path: ["phone_national"], message: "Enter a valid phone number" });
    }
  });

export const attendanceSchema = z.object({
  mode: z.enum(["onsite", "online"]),
  days: z.array(z.string()).min(1, "Pick at least one day"),
  needs_accommodation: z.boolean(),
  consent: z.literal(true, { error: "Please agree to continue" }),
});

export const codeSchema = z.object({ code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code") });

export type RegistrationDraft = z.infer<typeof categorySchema> &
  z.infer<typeof aboutSchema> &
  Omit<z.infer<typeof attendanceSchema>, "consent"> & { consent: boolean };

export const initialDraft: RegistrationDraft = {
  category: "delegate",
  full_name: "",
  country: "NG",
  phone_national: "",
  email: "",
  church: "",
  location: "",
  age_band: "18-45",
  mode: "onsite",
  days: conferenceDays.map((d) => d.iso),
  needs_accommodation: false,
  consent: false,
};

export function toPayload(draft: RegistrationDraft) {
  return {
    category: draft.category,
    full_name: draft.full_name.trim(),
    email: draft.email.trim().toLowerCase(),
    phone: draft.phone_national.trim() ? toE164(draft.country as (typeof COUNTRIES)[number]["iso"], draft.phone_national) : null,
    church: draft.church || null,
    location: draft.location || null,
    age_band: draft.age_band,
    mode: draft.mode,
    days: draft.days,
    needs_accommodation: draft.needs_accommodation,
    consent: true,
  };
}

export type RegistrationResult = {
  data: {
    claim_code: string;
    category: string;
    mode: "onsite" | "online";
    attendee: { first_name: string; full_name: string; email: string };
  };
  meta: { downgraded_to_online: boolean; existing_account: boolean };
};
