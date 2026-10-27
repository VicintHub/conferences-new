import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Scanner } from "./Scanner";
import type { Roster, ScanResult } from "./types";

// IndexedDB isn't in jsdom; an in-memory stand-in lets the queue survive a remount like it does on a phone.
const db = new Map<string, unknown>();
vi.mock("idb-keyval", () => ({
  get: async (k: string) => db.get(k),
  set: async (k: string, v: unknown) => void db.set(k, v),
  del: async (k: string) => void db.delete(k),
}));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const roster: Roster = {
  generated_at: "2027-01-23T12:00:00+01:00",
  people: { "JC27-DLG-00001": { n: "Adebayo Ogunleye", c: "delegate" } },
  orders: { "MV-00012": { n: "Ada Obi", s: "paid" } },
  meals: [],
  served: {},
  grace_minutes: 15,
};
const result = (over: Partial<ScanResult> = {}): ScanResult => ({
  client_uuid: "x",
  result: "ok",
  reason: null,
  label: "Gate",
  detail: "Delegate",
  checkpoint: "gate",
  overridden: false,
  attendee: { name: "Adebayo Ogunleye", category: "delegate", mode: "onsite" },
  can_override: false,
  ...over,
});

let online = true;
let areas = ["desk", "scan"];
type Handler = (body: unknown) => Response | Promise<Response>;
function api(handlers: { batch?: Handler; roster?: Roster | null } = {}) {
  const f = vi.fn(async (input: string, init?: RequestInit) => {
    const path = new URL(input, "http://x").pathname.replace("/api/admin-backend", "");
    if (!online) throw new TypeError("offline");
    if (path === "/me") return json({ data: { role: "desk", areas, name: "Door" } });
    if (path === "/scans/roster") return handlers.roster === null ? json({ message: "x" }, 500) : json({ data: handlers.roster ?? roster });
    if (path === "/scans/batch") {
      const body = JSON.parse(String(init?.body));
      return handlers.batch
        ? handlers.batch(body)
        : json({
            data: body.items.map((i: { client_uuid: string; checkpoint: string }) =>
              result({ client_uuid: i.client_uuid, checkpoint: i.checkpoint as never }),
            ),
          });
    }
    throw new Error(`unexpected ${path}`);
  });
  vi.stubGlobal("fetch", f);
  return f;
}
const batches = (f: ReturnType<typeof vi.fn>) =>
  f.mock.calls
    .filter(([u]) => String(u).endsWith("/scans/batch"))
    .map(
      ([, i]) =>
        JSON.parse(String(i?.body)).items as {
          client_uuid: string;
          code: string;
          checkpoint: string;
          override?: boolean;
          device: string | null;
        }[],
    );

const type = async (code: string) => {
  fireEvent.click(screen.getByRole("button", { name: "Type code" }));
  fireEvent.change(await screen.findByRole("textbox", { name: "Code" }), { target: { value: code } });
  fireEvent.click(screen.getByRole("button", { name: "Check" }));
};

beforeEach(() => {
  db.clear();
  localStorage.clear();
  online = true;
  areas = ["desk", "scan"];
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => online });
  Object.defineProperty(navigator, "vibrate", { configurable: true, value: vi.fn(() => true) });
});
afterEach(() => vi.unstubAllGlobals());

describe("Scanner (online)", () => {
  it("shows the server's answer full screen and counts the scan", async () => {
    const f = api();
    render(<Scanner />);
    await screen.findByText(/Offline-ready · 0 queued/);

    await type("jc27-dlg-00001");
    expect(await screen.findByText("Gate · OK")).toBeInTheDocument();
    expect(screen.getByText("Adebayo Ogunleye")).toBeInTheDocument();
    expect(batches(f)[0]![0]).toMatchObject({ code: "JC27-DLG-00001", checkpoint: "gate" });

    // The green screen clears itself, and the counts show the scan.
    await waitFor(() => expect(screen.queryByText("Gate · OK")).not.toBeInTheDocument(), { timeout: 3000 });
    expect(screen.getByText("Scanned").previousSibling).toHaveTextContent("1");
    expect(screen.getByText("Refused").previousSibling).toHaveTextContent("0");
  });

  it("uses the chosen checkpoint and this phone's name", async () => {
    localStorage.setItem("jc27.scan.device", "Meal point 2");
    const f = api();
    render(<Scanner />);
    await screen.findByText("Meal point 2");
    fireEvent.click(screen.getByRole("radio", { name: "Meal" }));
    expect(screen.getByRole("radio", { name: "Meal" })).toBeChecked();

    await type("JC27-DLG-00001");
    await screen.findByText(/OK/);
    expect(batches(f)[0]![0]).toMatchObject({ checkpoint: "meal", device: "Meal point 2" });
  });

  it("shows a refusal in red and waits for a decision", async () => {
    api({
      batch: (b) =>
        json({
          data: [
            result({
              client_uuid: (b as { items: [{ client_uuid: string }] }).items[0].client_uuid,
              result: "refused",
              reason: "Already served",
              label: "Lunch",
              detail: "Lunch collected at Meal point 2\n12:58 PM today",
              attendee: { name: "Chidi Okafor", category: "delegate", mode: "onsite" },
            }),
          ],
        }),
    });
    render(<Scanner />);
    await type("JC27-DLG-00002");

    expect(await screen.findByText("Already served")).toBeInTheDocument();
    expect(screen.getByText("Chidi Okafor")).toBeInTheDocument();
    expect(screen.getByText(/Lunch collected at Meal point 2/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Supervisor override" })).not.toBeInTheDocument(); // a door scanner can't override
    await new Promise((r) => setTimeout(r, 1800));
    expect(screen.getByText("Already served")).toBeInTheDocument(); // it did not clear itself

    fireEvent.click(screen.getByRole("button", { name: "Scan next" }));
    expect(await screen.findByRole("button", { name: "Type code" })).toBeInTheDocument();
    expect(screen.getByText("Refused").previousSibling).toHaveTextContent("1");
  });

  it("lets a supervisor override a refusal, which is sent as a new scan", async () => {
    areas = ["desk", "scan", "override"];
    const f = api({
      batch: (b) => {
        const item = (b as { items: [{ client_uuid: string; override?: boolean }] }).items[0];
        return json({
          data: [
            item.override
              ? result({ client_uuid: item.client_uuid, overridden: true, detail: "Override (Registered as online)." })
              : result({ client_uuid: item.client_uuid, result: "refused", reason: "Registered as online", can_override: true }),
          ],
        });
      },
    });
    render(<Scanner />);
    await type("JC27-DLG-00003");
    fireEvent.click(await screen.findByRole("button", { name: "Supervisor override" }));

    expect(await screen.findByText("Gate · OK")).toBeInTheDocument();
    expect(screen.getByText("Supervisor override")).toBeInTheDocument();
    const [first, second] = batches(f).flat();
    expect([first!.override, second!.override]).toEqual([undefined, true]);
    expect(first!.client_uuid).not.toBe(second!.client_uuid);
  });
});

describe("Scanner (no signal)", () => {
  it("falls back to the list on the phone and queues the scan", async () => {
    const f = api();
    render(<Scanner />);
    await screen.findByText(/Offline-ready/);
    online = false;
    act(() => void window.dispatchEvent(new Event("offline")));

    fireEvent.click(screen.getByRole("radio", { name: "Merch" }));
    await type("MV-00012");
    expect(await screen.findByText("Merchandise · OK")).toBeInTheDocument();
    expect(screen.getByText("Decided offline, confirmed when it syncs")).toBeInTheDocument();
    expect(batches(f)).toHaveLength(0);

    fireEvent.click(screen.getByText("Merchandise · OK"));
    expect(await screen.findByText(/Offline · 1 queued/)).toBeInTheDocument();
    expect(screen.getByText("To sync").previousSibling).toHaveTextContent("1");

    // The same order scanned again is refused on the phone too.
    await type("MV-00012");
    expect(await screen.findByText("Already collected")).toBeInTheDocument();
  });

  it("keeps the queue across a restart, then sends it in order when the signal returns", async () => {
    const f = api();
    const first = render(<Scanner />);
    await screen.findByText(/Offline-ready/);
    online = false;
    act(() => void window.dispatchEvent(new Event("offline")));
    await type("JC27-DLG-00001");
    fireEvent.click(await screen.findByText("Gate · OK"));
    await screen.findByText(/Offline · 1 queued/);
    first.unmount();

    render(<Scanner />);
    expect(await screen.findByText(/Offline · 1 queued/)).toBeInTheDocument();

    online = true;
    act(() => void window.dispatchEvent(new Event("online")));
    await screen.findByText(/Offline-ready · 0 queued/, undefined, { timeout: 4000 });
    const sent = batches(f).flat();
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ code: "JC27-DLG-00001", checkpoint: "gate" });
  });

  it("says when the server disagreed with a decision made offline", async () => {
    api({
      batch: (b) =>
        json({
          data: (b as { items: { client_uuid: string }[] }).items.map((i) =>
            result({ client_uuid: i.client_uuid, result: "refused", reason: "Already served" }),
          ),
        }),
    });
    render(<Scanner />);
    await screen.findByText(/Offline-ready/);
    online = false;
    act(() => void window.dispatchEvent(new Event("offline")));
    await type("JC27-DLG-00001");
    fireEvent.click(await screen.findByText("Gate · OK"));

    online = true;
    act(() => void window.dispatchEvent(new Event("online")));
    expect(await screen.findByText(/1 scan changed after syncing/, undefined, { timeout: 4000 })).toBeInTheDocument();
  });

  it("uses the phone's own list if the server can't be reached mid-scan", async () => {
    api();
    render(<Scanner />);
    await screen.findByText(/Offline-ready/);
    online = false; // the browser still says it's online, but nothing gets through
    Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true });

    await type("JC27-DLG-00001");
    expect(await screen.findByText("Gate · OK")).toBeInTheDocument();
    expect(screen.getByText("Decided offline, confirmed when it syncs")).toBeInTheDocument();
  });

  it("asks for a connection if it has never loaded the list", async () => {
    api({ roster: null });
    render(<Scanner />);
    online = false;
    act(() => void window.dispatchEvent(new Event("offline")));
    await type("JC27-DLG-00001");
    expect(await screen.findByText(/No list on this phone yet/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Supervisor override" })).not.toBeInTheDocument();
  });
});

describe("Scanner (controls)", () => {
  it("names the phone and says when the camera is unavailable", async () => {
    api();
    render(<Scanner />);
    expect(await screen.findByText(/No camera found/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Scanner settings" }));
    fireEvent.change(await screen.findByRole("textbox", { name: "Device name" }), { target: { value: "Gate B" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(localStorage.getItem("jc27.scan.device")).toBe("Gate B");
  });
});
