import { describe, expect, it } from "vitest";
import { clock, clock12, dayParts, initials, shortName, venueDate } from "./time";

describe("venue time", () => {
  it("formats instants in Ibadan time whatever the device timezone", () => {
    expect(clock("2027-01-23T08:00:00+00:00")).toEqual({ time: "9:00", ap: "AM" });
    expect(clock12("2027-01-23T13:30:00+01:00")).toBe("1:30 PM");
  });
  it("derives the venue calendar day (late UTC can already be next day in Ibadan)", () => {
    expect(venueDate("2027-01-22T23:30:00+00:00")).toBe("2027-01-23");
    expect(venueDate("2027-01-23T07:00:00+01:00")).toBe("2027-01-23");
  });
  it("splits a day key into weekday and number", () => {
    expect(dayParts("2027-01-23")).toMatchObject({ dow: "Sat", n: 23, long: "Saturday", month: "Jan" });
    expect(dayParts("2027-01-19").dow).toBe("Tue");
  });
  it("builds initials and short names", () => {
    expect(initials("Adebayo Ogunleye")).toBe("AO");
    expect(shortName("Adebayo Ogunleye")).toBe("Adebayo O.");
    expect(shortName("Adebayo")).toBe("Adebayo");
  });
});
