import { describe, expect, it } from "vitest";
import { estimateFee } from "./types";

describe("estimateFee", () => {
  const fee = { percent: 0.7, flat_kobo: 10000 };
  it("matches the server: ₦362 on ₦37,500", () => {
    expect(estimateFee(3750000, fee)).toBe(36200);
  });
  it("rounds down to whole naira", () => {
    expect(estimateFee(800000, fee)).toBe(15600);
  });
});
