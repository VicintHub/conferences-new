import { describe, expect, it } from "vitest";
import { naira } from "./money";

describe("naira", () => {
  it("formats whole naira with separators", () => {
    expect(naira(1250000)).toBe("₦12,500");
    expect(naira(3786200)).toBe("₦37,862");
    expect(naira(0)).toBe("₦0");
  });
  it("shows kobo only when there are some", () => {
    expect(naira(36250)).toBe("₦362.50");
  });
});
