import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Me, ProgrammeDay, Session } from "./types";

const state = vi.hoisted(() => ({ me: undefined as unknown, days: [] as unknown[], now: 0, mutate: vi.fn(), signOut: vi.fn() }));

vi.mock("@/features/shop/PickupList", () => ({ PickupList: () => null }));
vi.mock("./queries", () => ({
  useMe: () => ({ me: state.me, isPending: false, isError: false, refetch: vi.fn() }),
  useProgramme: () => ({ days: state.days, isPending: false, isError: false, refetch: vi.fn() }),
  useChangeMode: () => ({ mutate: state.mutate, isPending: false, error: null }),
  useSignOut: () => state.signOut,
}));
vi.mock("./useNow", () => ({ useNow: () => state.now }));

import { Home } from "./Home";
import { More } from "./More";
import { Pass } from "./Pass";
import { Programme } from "./Programme";

const me = (over: Partial<Me> = {}): Me => ({
  claim_code: "JC27-DLG-48213",
  category: "delegate",
  mode: "onsite",
  days: [],
  needs_accommodation: false,
  status: "confirmed",
  minister_verified: false,
  badge: null,
  access: [
    { key: "gate", label: "Gate", used: false },
    { key: "meal", label: "Meal", used: true },
  ],
  attendee: { full_name: "Adebayo Ogunleye", first_name: "Adebayo", email: "ade@example.com", church: "Christ Life Assembly" },
  ...over,
});

const s = (id: number, title: string, start: string, end: string, kind = "plenary", subtitle: string | null = "Main hall"): Session => ({
  id,
  title,
  subtitle,
  kind,
  starts_at: start,
  ends_at: end,
});
const days: ProgrammeDay[] = [
  {
    date: "2027-01-19",
    title: "Evening of Worship",
    sessions: [s(1, "Evening of Worship", "2027-01-19T17:00:00+01:00", "2027-01-19T20:00:00+01:00", "worship")],
  },
  {
    date: "2027-01-23",
    title: "Royal Conf. + IYLC",
    sessions: [
      s(2, "Royal Conference", "2027-01-23T09:00:00+01:00", "2027-01-23T13:00:00+01:00"),
      s(3, "Lunch", "2027-01-23T13:00:00+01:00", "2027-01-23T14:00:00+01:00", "meal", "Meal points 1–3"),
      s(4, "IYLC", "2027-01-23T14:00:00+01:00", "2027-01-23T20:00:00+01:00", "iylc"),
    ],
  },
];

beforeEach(() => {
  state.me = me();
  state.days = days;
  state.now = Date.parse("2026-10-26T12:00:00+01:00");
  state.mutate.mockReset();
  state.signOut.mockReset();
});

describe("Pass", () => {
  it("shows the claim ticket with its code and the desk steps", () => {
    render(<Pass />);
    expect(screen.getByText("WORKS OFFLINE")).toBeInTheDocument();
    expect(screen.getByText("JC27-DLG-48213")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /claim ticket qr code/i })).toBeInTheDocument();
    expect(screen.getByText("Adebayo O.")).toBeInTheDocument();
    expect(screen.getByText("Your printed badge replaces this ticket")).toBeInTheDocument();
  });

  it("switches to the active badge once the print desk has issued it", () => {
    state.me = me({ badge: { printed_at: "2027-01-23T08:00:00+01:00" } });
    state.now = Date.parse("2027-01-23T10:00:00+01:00");
    render(<Pass />);
    expect(screen.getByRole("heading", { name: "My badge" })).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Christ Life Assembly")).toBeInTheDocument();
    expect(screen.getByText(/Today · Sat 23/)).toBeInTheDocument();
    expect(screen.getByText("Gate").closest("li")).toHaveTextContent("available");
    expect(screen.getByText("Meal").closest("li")).toHaveTextContent("used");
  });
});

describe("Home", () => {
  it("before the event: countdown to the first session and a one-tap claim ticket", () => {
    render(<Home />);
    expect(screen.getAllByRole("timer").length).toBeGreaterThan(0);
    expect(screen.getByText(/to Evening of Worship · Tue 19 Jan/)).toBeInTheDocument();
    const claim = screen.getAllByRole("link", { name: /claim ticket/i })[0];
    expect(claim).toHaveAttribute("href", "/app/pass");
    expect(screen.getAllByText("I will be attending card").length).toBeGreaterThan(0);
  });

  it("during the event: what's on now, next up and the meal", () => {
    state.now = Date.parse("2027-01-23T11:00:00+01:00");
    render(<Home />);
    expect(screen.getAllByText("HAPPENING NOW").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Royal Conference").length).toBeGreaterThan(0);
    expect(screen.getByText("DAY 2 OF 2")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Session progress" })).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText("IYLC")).toBeInTheDocument();
    expect(screen.getByText("LUNCH")).toBeInTheDocument();
    for (const link of screen.getAllByRole("link", { name: "Watch live" })) expect(link).toHaveAttribute("href", "/app/live");
  });

  it("desktop dashboard offers to switch attendance mode", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "Switch to online" }));
    expect(state.mutate).toHaveBeenCalledWith("online");
  });
});

describe("Programme", () => {
  it("opens on the first day before the event and lists sessions on a time rail", () => {
    render(<Programme />);
    expect(screen.getByRole("tab", { name: /19/ })).toHaveAttribute("aria-selected", "true");
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByText("Evening of Worship")).toBeInTheDocument();
    expect(within(panel).getByText("5:00")).toBeInTheDocument();
    expect(within(panel).getByText("PM")).toBeInTheDocument();
  });

  it("opens on today during the conference, marks the running session, and switches days", () => {
    state.now = Date.parse("2027-01-23T10:00:00+01:00");
    render(<Programme />);
    expect(screen.getByRole("tab", { name: /23/ })).toHaveAttribute("aria-selected", "true");
    expect(within(screen.getByRole("tabpanel")).getByText("NOW")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /19/ }));
    expect(within(screen.getByRole("tabpanel")).getByText("Evening of Worship")).toBeInTheDocument();
    expect(within(screen.getByRole("tabpanel")).queryByText("NOW")).not.toBeInTheDocument();
  });
});

describe("More", () => {
  it("lists the grouped destinations and signs out", () => {
    render(<More />);
    expect(screen.getByRole("link", { name: /My team/ })).toHaveAttribute("href", "/app/team");
    expect(screen.getByRole("link", { name: /Store/ })).toHaveAttribute("href", "/shop");
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(state.signOut).toHaveBeenCalled();
  });

  it("changes attendance from the sheet", () => {
    render(<More />);
    fireEvent.click(screen.getByRole("button", { name: /Attendance/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Online" }));
    expect(state.mutate).toHaveBeenCalledWith("online");
  });
});
