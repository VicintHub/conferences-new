import { z } from "zod";
import { normalisePhone } from "@/lib/phone";
import type { RoleKey } from "./types";

export type Field = {
  name: string;
  label: string;
  placeholder?: string;
  kind: "text" | "tel" | "number" | "textarea" | "select";
  options?: { value: string; label: string }[];
  /** Spans both columns on the desktop form. */
  wide?: boolean;
  optional?: boolean;
  min?: number;
  max?: number;
};

export type RoleForm = { title: string; fields: Field[]; upload: { label: string; hint: string; required?: boolean } };

const contact: Field[] = [
  { name: "contact_name", label: "Contact name", placeholder: "Kemi Ojo", kind: "text" },
  { name: "phone", label: "Phone", placeholder: "+234 …", kind: "tel" },
];

export const roleForms: Record<RoleKey, RoleForm> = {
  media: {
    title: "Media accreditation",
    fields: [
      { name: "organisation", label: "Organisation", placeholder: "Faith Lens TV", kind: "text" },
      ...contact,
      { name: "crew_size", label: "Crew size", placeholder: "2", kind: "number", min: 1, max: 20 },
      { name: "coverage_plan", label: "Coverage plan", placeholder: "Live broadcast of evening sessions", kind: "text", wide: true },
    ],
    upload: { label: "Press ID for each crew member", hint: "PDF or photo" },
  },
  vip: {
    title: "VIP guest",
    fields: [
      { name: "title", label: "Title / office", placeholder: "Hon. Commissioner", kind: "text" },
      { name: "organisation", label: "Organisation", placeholder: "Optional", kind: "text", optional: true },
      ...contact,
      { name: "guests", label: "Guests with you", placeholder: "0", kind: "number", min: 0, max: 10 },
      {
        name: "notes",
        label: "Anything we should prepare?",
        placeholder: "Seating, access, security…",
        kind: "textarea",
        wide: true,
        optional: true,
      },
    ],
    upload: { label: "Invitation or ID (optional)", hint: "PDF or photo" },
  },
  speaker: {
    title: "Speaker invitation",
    fields: [
      { name: "ministry", label: "Ministry", placeholder: "Your ministry or church", kind: "text" },
      { name: "topic", label: "Proposed topic", placeholder: "What would you minister on?", kind: "text" },
      ...contact,
      { name: "bio", label: "Short bio", placeholder: "Who you are and how you serve", kind: "textarea", wide: true },
    ],
    upload: { label: "Ministry profile or sample message (optional)", hint: "PDF or photo" },
  },
  vendor: {
    title: "Vendor stall",
    fields: [
      { name: "business_name", label: "Business name", placeholder: "Grace Books", kind: "text" },
      {
        name: "category",
        label: "What do you sell?",
        kind: "select",
        options: [
          { value: "food", label: "Food & drink" },
          { value: "books", label: "Books & media" },
          { value: "apparel", label: "Apparel" },
          { value: "other", label: "Other" },
        ],
      },
      {
        name: "stall_size",
        label: "Stall size",
        kind: "select",
        options: [
          { value: "s", label: "Small" },
          { value: "m", label: "Medium" },
          { value: "l", label: "Large" },
        ],
      },
      ...contact,
      {
        name: "notes",
        label: "Anything else?",
        placeholder: "Power, tables, special needs…",
        kind: "textarea",
        wide: true,
        optional: true,
      },
    ],
    upload: { label: "Business registration or ID", hint: "PDF or photo" },
  },
};

/** Client-side check mirroring the API's rules for each role, so people see problems before the round trip. */
export function schemaFor(role: RoleKey) {
  const shape: Record<string, z.ZodType> = {};
  for (const f of roleForms[role].fields) {
    let rule: z.ZodType;
    if (f.name === "phone") {
      rule = z
        .string()
        .transform(normalisePhone)
        .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, "Enter a valid phone number"));
    } else if (f.kind === "number") {
      rule = z.coerce
        .number({ error: `Enter a number` })
        .int("Enter a whole number")
        .min(f.min ?? 0, `At least ${f.min ?? 0}`)
        .max(f.max ?? 99, `At most ${f.max ?? 99}`);
    } else if (f.kind === "select") {
      rule = z.string().min(1, "Choose one");
    } else if (f.optional) {
      rule = z.string().trim().max(1000);
    } else {
      rule = z
        .string()
        .trim()
        .min(2, "This is required")
        .max(f.kind === "textarea" ? 1500 : 160);
    }
    shape[f.name] = rule;
  }
  return z.object(shape);
}
