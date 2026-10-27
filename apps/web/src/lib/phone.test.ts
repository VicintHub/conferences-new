import { describe, expect, it } from "vitest";
import { formatPhone, isE164, normalisePhone, toE164 } from "./phone";

describe("phone helpers", () => {
  it("builds E.164 and drops spaces and the trunk zero", () => {
    expect(toE164("NG", "803 456 7821")).toBe("+2348034567821");
    expect(toE164("NG", "0803 456 7821")).toBe("+2348034567821");
    expect(toE164("GB", "7911 123456")).toBe("+447911123456");
  });
  it("validates E.164", () => {
    expect(isE164("+2348034567821")).toBe(true);
    expect(isE164("08034567821")).toBe(false);
    expect(isE164("+234")).toBe(false);
  });
  it("formats for display", () => {
    expect(formatPhone("+2348034567821")).toBe("+234 803 456 7821");
  });
});

describe("normalisePhone", () => {
  it("turns local and international input into E.164", () => {
    expect(normalisePhone("0803 456 7821")).toBe("+2348034567821");
    expect(normalisePhone("234 803 456 7821")).toBe("+2348034567821");
    expect(normalisePhone("+44 7700 900123")).toBe("+447700900123");
    expect(normalisePhone("8034567821")).toBe("+2348034567821");
    expect(normalisePhone("  ")).toBe("");
  });
});
