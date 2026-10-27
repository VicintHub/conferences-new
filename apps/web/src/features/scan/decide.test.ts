import { describe, expect, it } from "vitest";
import { applyToRoster, decideLocally, logFrom, mealWindow } from "./decide";
import type { LogEntry, PendingScan, Roster } from "./types";

const roster: Roster = {
  generated_at: "2027-01-23T12:00:00+01:00",
  people: { "JC27-DLG-00001": { n: "Adebayo Ogunleye", c: "delegate" }, "JC27-INT-00002": { n: "Grace Mensah", c: "international" } },
  orders: { "MV-00012": { n: "Ada Obi", s: "paid" }, "MV-00013": { n: "Bola", s: "collected" } },
  meals: [{ id: 7, title: "Lunch", starts_at: "2027-01-23T13:00:00+01:00", ends_at: "2027-01-23T14:00:00+01:00" }],
  served: { "meal:7": ["JC27-DLG-00002"] },
  grace_minutes: 15,
};
const scan = (
  code: string,
  checkpoint: PendingScan["checkpoint"],
  at = "2027-01-23T13:20:00+01:00",
  device: string | null = "Meal point 2",
): PendingScan => ({ client_uuid: `u-${code}-${at}`, code, checkpoint, scanned_at: at, device });

describe("decideLocally", () => {
  it("asks for a connection when there is no list yet", () => {
    const r = decideLocally(null, scan("JC27-DLG-00001", "gate"), []);
    expect(r).toMatchObject({ result: "refused", provisional: true });
    expect(r.reason).toMatch(/No list on this phone/);
  });

  it("admits people at the gate and hall, noting a return", () => {
    const first = decideLocally(roster, scan("JC27-DLG-00001", "gate"), []);
    expect(first).toMatchObject({ result: "ok", label: "Gate", detail: "Delegate", provisional: true });
    expect(first.attendee).toMatchObject({ name: "Adebayo Ogunleye" });

    const log = [logFrom(scan("JC27-DLG-00001", "gate"), first, roster)];
    expect(decideLocally(roster, scan("JC27-DLG-00001", "gate"), log).detail).toBe("Delegate · Back in");
    expect(decideLocally(roster, scan("JC27-DLG-00001", "hall"), log).detail).toBe("Delegate"); // a different checkpoint
    expect(decideLocally(roster, scan("JC27-INT-00002", "hall"), []).detail).toBe("International");
  });

  it("refuses codes it doesn't know, and codes meant for another checkpoint", () => {
    expect(decideLocally(roster, scan("JC27-DLG-99999", "gate"), []).reason).toBe("Not on the onsite list");
    expect(decideLocally(roster, scan("MV-00012", "gate"), []).reason).toBe("That’s a merchandise pickup code");
    expect(decideLocally(roster, scan("JC27-DLG-00001", "merch"), []).reason).toBe("Scan the pickup QR from the order");
    expect(decideLocally(roster, scan("JC27-DLG-99999", "merch"), []).reason).toBe("Unknown code");
    expect(decideLocally(roster, scan("MV-99999", "merch"), []).reason).toBe("Unknown order");
  });

  it("never offers an override while offline", () => {
    expect(decideLocally(roster, scan("JC27-DLG-99999", "gate"), []).can_override).toBe(false);
    expect(decideLocally(roster, scan("JC27-DLG-00001", "meal", "2027-01-23T18:00:00+01:00"), []).can_override).toBe(false);
  });

  it("serves one meal per window, counting today's meals", () => {
    const ok = decideLocally(roster, scan("JC27-DLG-00001", "meal"), []);
    expect(ok).toMatchObject({ result: "ok", label: "Lunch", detail: "Delegate · 1st meal today" });

    const log: LogEntry[] = [logFrom(scan("JC27-DLG-00001", "meal"), ok, roster)];
    const again = decideLocally(roster, scan("JC27-DLG-00001", "meal", "2027-01-23T13:40:00+01:00"), log);
    expect(again).toMatchObject({ result: "refused", reason: "Already served", label: "Lunch" });
    expect(again.detail).toBe("Lunch collected at Meal point 2\n1:20 PM today");
  });

  it("knows who was served elsewhere from the roster", () => {
    const r = decideLocally(
      { ...roster, people: { ...roster.people, "JC27-DLG-00002": { n: "Chidi Okafor", c: "delegate" } } },
      scan("JC27-DLG-00002", "meal"),
      [],
    );
    expect(r).toMatchObject({ result: "refused", reason: "Already served" });
    expect(r.detail).toBe("Lunch collected at a meal point\nearlier today");
  });

  it("follows the meal windows, with a few minutes of grace either side", () => {
    expect(mealWindow(roster, "2027-01-23T12:50:00+01:00")?.id).toBe(7);
    expect(mealWindow(roster, "2027-01-23T14:14:00+01:00")?.id).toBe(7);
    expect(mealWindow(roster, "2027-01-23T12:40:00+01:00")).toBeUndefined();
    expect(mealWindow(roster, "2027-01-23T14:16:00+01:00")).toBeUndefined();
    expect(decideLocally(roster, scan("JC27-DLG-00001", "meal", "2027-01-23T12:00:00+01:00"), []).reason).toBe("No meal service right now");
  });

  it("releases merchandise once", () => {
    const ok = decideLocally(roster, scan("MV-00012", "merch"), []);
    expect(ok).toMatchObject({ result: "ok", label: "Merchandise", detail: "Ada Obi" });
    expect(decideLocally(roster, scan("MV-00013", "merch"), [])).toMatchObject({ result: "refused", reason: "Already collected" });

    const next = applyToRoster(roster, scan("MV-00012", "merch"), ok);
    expect(decideLocally(next, scan("MV-00012", "merch"), []).reason).toBe("Already collected");
  });
});

describe("applyToRoster", () => {
  it("remembers a meal served so the next scan of that person is refused", () => {
    const s = scan("JC27-DLG-00001", "meal");
    const ok = decideLocally(roster, s, []);
    const next = applyToRoster(roster, s, ok);
    expect(next.served["meal:7"]).toContain("JC27-DLG-00001");
    expect(roster.served["meal:7"]).not.toContain("JC27-DLG-00001"); // the original is untouched
    expect(decideLocally(next, scan("JC27-DLG-00001", "meal", "2027-01-23T13:30:00+01:00"), []).reason).toBe("Already served");
  });

  it("changes nothing for a refusal or a gate scan", () => {
    const refused = decideLocally(roster, scan("JC27-DLG-99999", "gate"), []);
    expect(applyToRoster(roster, scan("JC27-DLG-99999", "gate"), refused)).toBe(roster);
    const gate = decideLocally(roster, scan("JC27-DLG-00001", "gate"), []);
    expect(applyToRoster(roster, scan("JC27-DLG-00001", "gate"), gate)).toBe(roster);
  });
});

describe("logFrom", () => {
  it("records the meal window so the phone can tell a second plate from a second meal", () => {
    const s = scan("jc27-dlg-00001", "meal");
    const e = logFrom(s, decideLocally(roster, s, []), roster);
    expect(e).toMatchObject({ code: "JC27-DLG-00001", window: "meal:7", provisional: true, name: "Adebayo Ogunleye" });
    expect(logFrom(scan("x", "gate"), decideLocally(roster, scan("x", "gate"), []), roster).window).toBeNull();
  });
});
