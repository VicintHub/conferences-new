import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setDesktop } from "../../../vitest.setup";
import type { ProgrammeDay } from "@/features/app/types";
import { Live } from "./Live";
import { duration, type LiveData } from "./types";

const NOW = Date.parse("2027-01-23T10:30:00+01:00");
vi.mock("@/features/app/useNow", () => ({ useNow: () => NOW }));

const session = (id: number, title: string, start: string, end: string, kind: string, subtitle = "Main hall") => ({
  id,
  title,
  subtitle,
  kind,
  starts_at: `2027-01-23T${start}:00+01:00`,
  ends_at: `2027-01-23T${end}:00+01:00`,
});
const days: ProgrammeDay[] = [
  {
    date: "2027-01-23",
    title: "Royal Conf. + IYLC",
    sessions: [
      session(1, "Arrival & check-in", "07:00", "09:00", "arrival", "Gates A and B"),
      session(2, "Royal Conference", "09:00", "13:00", "plenary"),
      session(3, "Lunch", "13:00", "14:00", "meal", "Meal points 1–3"),
      session(4, "IYLC", "14:00", "20:00", "iylc"),
    ],
  },
];
vi.mock("@/features/app/queries", () => ({ useProgramme: () => ({ days, isPending: false, isError: false, refetch: vi.fn() }) }));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const wrap = (ui: React.ReactElement) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
);

const live = (over: Partial<LiveData> = {}): LiveData => ({
  is_live: true,
  title: null,
  poster: null,
  video: { kind: "file", url: "https://cdn.example.com/live.mp4" },
  radio: { url: "https://cdn.example.com/radio" },
  viewers: 2418,
  give_url: null,
  reminders: [],
  replays: [
    {
      id: 1,
      title: "IMLC Day 3 · Evening plenary",
      recorded_on: "2027-01-22",
      duration_seconds: 8048,
      thumbnail: null,
      video: { kind: "file", url: "https://cdn.example.com/r1.mp4" },
    },
    { id: 2, title: "Evening of Worship", recorded_on: "2027-01-19", duration_seconds: 9075, thumbnail: null, video: null },
  ],
  ...over,
});

function api(data: LiveData, extra: Record<string, () => Response> = {}) {
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? "GET"} ${new URL(url, "http://x").pathname.replace("/api/backend", "")}`;
    if (key === "GET /live") return json({ data });
    if (key === "POST /live/heartbeat") return json({ data: { viewers: 2419 } });
    const r = extra[key];
    if (!r) throw new Error(`unexpected ${key}`);
    return r();
  });
  vi.stubGlobal("fetch", f);
  return f;
}
const called = (f: ReturnType<typeof vi.fn>, key: string) =>
  f.mock.calls.some(([u, i]) => `${i?.method ?? "GET"} ${new URL(u, "http://x").pathname.replace("/api/backend", "")}` === key);

let play: ReturnType<typeof vi.fn>;
beforeEach(() => {
  setDesktop(false);
  localStorage.clear();
  play = vi.fn().mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(play as never);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Live (phone)", () => {
  it("shows what is on, who is watching, what is next and the replays", async () => {
    api(live());
    render(wrap(<Live />));

    expect(await screen.findByRole("heading", { name: "Royal Conference" })).toBeInTheDocument();
    expect(screen.getByText("Sat 23 Jan · Main hall")).toBeInTheDocument();
    expect(screen.getByText("LIVE")).toBeInTheDocument();
    expect(screen.getByText("2,418 watching")).toBeInTheDocument();
    const next = screen.getByRole("region", { name: "Up next" });
    expect(within(next).getByText("IYLC")).toBeInTheDocument();
    expect(within(next).getByText("Until 8:00 PM")).toBeInTheDocument();
    expect(within(next).queryByText("Lunch")).not.toBeInTheDocument();
    expect(screen.getByText("2:14:08")).toBeInTheDocument();
    expect(screen.getByText("Fri 22 Jan")).toBeInTheDocument();
  });

  it("sets and clears a reminder for the next session", async () => {
    const f = api(live(), {
      "POST /sessions/4/remind": () => json({ data: {} }, 201),
      "DELETE /sessions/4/remind": () => new Response(null, { status: 204 }),
    });
    render(wrap(<Live />));

    fireEvent.click(await screen.findByRole("button", { name: "Remind me" }));
    expect(await screen.findByRole("button", { name: "Reminder set ✓" })).toBeInTheDocument();
    expect(called(f, "POST /sessions/4/remind")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Reminder set ✓" }));
    expect(await screen.findByRole("button", { name: "Remind me" })).toBeInTheDocument();
  });

  it("starts playback on tap and tells the server someone is watching", async () => {
    const f = api(live());
    render(wrap(<Live />));

    fireEvent.click(await screen.findByRole("button", { name: "Play" }));
    await waitFor(() => expect(called(f, "POST /live/heartbeat")).toBe(true));
    expect(await screen.findByText("2,419 watching")).toBeInTheDocument();
    expect(document.querySelector("video")?.getAttribute("src")).toBe("https://cdn.example.com/live.mp4");
  });

  it("says we're off air, and what's next, when nothing is streaming", async () => {
    api(live({ is_live: false, video: null }));
    render(wrap(<Live />));
    expect(await screen.findByText("We’re off air")).toBeInTheDocument();
    expect(screen.getByText("OFF AIR")).toBeInTheDocument();
    expect(screen.queryByText(/watching/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
  });

  it("plays a replay in the player, and explains one that isn't published yet", async () => {
    api(live());
    render(wrap(<Live />));

    fireEvent.click(await screen.findByRole("button", { name: /Evening of Worship/ }));
    expect(screen.getByText(/isn’t published yet/)).toBeInTheDocument();
    expect(screen.queryByText("REPLAY")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /IMLC Day 3/ }));
    expect(screen.getByText("REPLAY")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "IMLC Day 3 · Evening plenary" })).toBeInTheDocument();
    expect(screen.queryByText(/watching/)).not.toBeInTheDocument();
  });

  it("keeps private notes on the phone", async () => {
    api(live());
    render(wrap(<Live />));
    fireEvent.click(await screen.findByRole("button", { name: "Notes" }));
    fireEvent.change(await screen.findByLabelText("Notes"), { target: { value: "Faith is a decision" } });
    expect(localStorage.getItem("jc27.notes.2")).toBe("Faith is a decision");
  });

  it("shows Give only when the committee has set a giving link", async () => {
    api(live({ give_url: "https://give.example.com" }));
    render(wrap(<Live />));
    expect(await screen.findByRole("link", { name: "Give" })).toHaveAttribute("href", "https://give.example.com");
  });

  it("explains a failed load", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ message: "boom" }, 500)));
    render(wrap(<Live />));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});

describe("Radio", () => {
  it("switches to audio-only and plays the stream", async () => {
    api(live());
    render(wrap(<Live />));
    fireEvent.click(await screen.findByRole("radio", { name: "Radio" }));

    expect(screen.getByText("ON AIR")).toBeInTheDocument();
    expect(screen.getByText(/uses about 1 MB a minute/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    await waitFor(() => expect(play).toHaveBeenCalled());
    expect(document.querySelector("audio")?.getAttribute("src")).toBe("https://cdn.example.com/radio");

    fireEvent.click(screen.getByRole("button", { name: "Back to video" }));
    expect(await screen.findByRole("radio", { name: "Video" })).toBeChecked();
  });

  it("cannot play when no stream is configured", async () => {
    api(live({ radio: null, is_live: false }));
    render(wrap(<Live />));
    fireEvent.click(await screen.findByRole("radio", { name: "Radio" }));
    expect(screen.getByText("OFF AIR")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
  });

  it("reports a stream that fails", async () => {
    api(live());
    play.mockRejectedValueOnce(new Error("blocked"));
    render(wrap(<Live />));
    fireEvent.click(await screen.findByRole("radio", { name: "Radio" }));
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(await screen.findByText(/radio stream isn’t loading/)).toBeInTheDocument();
  });
});

describe("Live (desktop)", () => {
  it("shows the player with today's rail and replays", async () => {
    setDesktop(true);
    api(live());
    render(wrap(<Live />));

    expect(await screen.findByRole("heading", { name: "Royal Conference" })).toBeInTheDocument();
    expect(screen.getByText(/Saturday|Sat 23 Jan/)).toBeInTheDocument();
    const rail = screen.getByRole("region", { name: "Today" });
    expect(within(rail).getByText("NOW")).toBeInTheDocument();
    expect(within(rail).getByText("Stream on pause")).toBeInTheDocument();
    expect(within(rail).getByText("Gates A and B")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Replays" })).toBeInTheDocument();
  });
});

describe("duration", () => {
  it("formats hours, minutes and seconds", () => {
    expect(duration(8048)).toBe("2:14:08");
    expect(duration(3600)).toBe("1:00:00");
    expect(duration(95)).toBe("1:35");
  });
});
