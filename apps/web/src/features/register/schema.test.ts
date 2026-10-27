import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { aboutSchema, attendanceSchema, initialDraft, codeSchema, toPayload } from "./schema";

type AboutValues = z.infer<typeof aboutSchema>;
const about: AboutValues = {
  full_name: "Adebayo Ogunleye",
  country: "NG",
  phone_national: "803 456 7821",
  email: "ade@example.com",
  church: "",
  location: "",
  age_band: "18-45",
};

describe("registration schemas", () => {
  it("accepts a valid About step with optional fields empty", () => {
    expect(aboutSchema.safeParse(about).success).toBe(true);
  });
  it("requires an email but not a phone number", () => {
    expect(aboutSchema.safeParse({ ...about, email: "" }).success).toBe(false);
    expect(aboutSchema.safeParse({ ...about, phone_national: "" }).success).toBe(true);
  });
  it("rejects a short phone number and a bad email", () => {
    const r = aboutSchema.safeParse({ ...about, phone_national: "123", email: "nope" });
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path[0]);
    expect(paths).toContain("phone_national");
    expect(paths).toContain("email");
  });
  it("needs at least one day", () => {
    expect(attendanceSchema.safeParse({ mode: "online", days: [], needs_accommodation: false }).success).toBe(false);
  });
  it("needs a 6-digit code", () => {
    expect(codeSchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(codeSchema.safeParse({ code: "12345a" }).success).toBe(false);
    expect(codeSchema.safeParse({ code: "123456" }).success).toBe(true);
  });
  it("needs consent on the attendance step", () => {
    const ok = { mode: "online", days: ["2027-01-19"], needs_accommodation: false };
    expect(attendanceSchema.safeParse({ ...ok, consent: false }).success).toBe(false);
    expect(attendanceSchema.safeParse({ ...ok, consent: true }).success).toBe(true);
  });
  it("maps the draft to the API payload", () => {
    const p = toPayload({ ...initialDraft, ...about, email: " Ade@Example.com ", consent: true });
    expect(p).toMatchObject({ phone: "+2348034567821", email: "ade@example.com", consent: true, mode: "onsite" });
    expect(toPayload({ ...initialDraft, ...about, phone_national: "" }).phone).toBeNull();
    expect(p.days).toHaveLength(6);
  });
});
