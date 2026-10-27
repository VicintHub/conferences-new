import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/features/app/types";
import { readSkipped } from "./prompt";
import { SessionFeedbackSheet } from "./SessionFeedbackSheet";
import { SurveyFlow } from "./SurveyFlow";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const wrap = (ui: React.ReactNode) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);
const session: Session = {
  id: 7,
  title: "Royal Conference",
  subtitle: "Main hall · until 1 PM",
  kind: "plenary",
  starts_at: "2027-01-23T09:00:00+01:00",
  ends_at: "2027-01-23T13:00:00+01:00",
};

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("SessionFeedbackSheet", () => {
  it("needs a rating, then sends rating, highlights and comment", async () => {
    const f = vi.fn().mockResolvedValue(json({ data: { session_id: 7 } }, 201));
    vi.stubGlobal("fetch", f);
    const onClose = vi.fn();
    wrap(<SessionFeedbackSheet session={session} highlights={["The word", "Worship"]} onClose={onClose} />);
    expect(screen.getByText("How was the Royal Conference?")).toBeInTheDocument();
    expect(screen.getByText("Just ended · Main hall")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send feedback" })).toBeDisabled();

    fireEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    fireEvent.click(screen.getByRole("button", { name: "Worship" }));
    fireEvent.change(screen.getByLabelText("Anything we should improve?"), { target: { value: "More seating" } });
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(f.mock.calls[0][0]).toMatch(/\/sessions\/7\/feedback$/);
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ rating: 4, highlights: ["Worship"], comment: "More seating" });
  });

  it("remembers a skip so the prompt doesn't come back", () => {
    const onClose = vi.fn();
    wrap(<SessionFeedbackSheet session={session} highlights={[]} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(onClose).toHaveBeenCalled();
    expect(readSkipped()).toEqual([7]);
  });

  it("renders nothing without a session", () => {
    wrap(<SessionFeedbackSheet session={undefined} highlights={[]} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

const survey = {
  title: "Help us plan IMLC 2028",
  completed: false,
  questions: [
    {
      id: "attend",
      type: "scale",
      required: true,
      text: "How likely are you to attend next year?",
      min: 1,
      max: 5,
      low: "Not likely",
      high: "Definitely",
    },
    { id: "ratings", type: "ratings", required: true, text: "Rate these", items: ["Registration", "Meals"] },
    { id: "keep", type: "multi", required: false, text: "What should we keep?", options: ["Worship", "Radio"] },
    { id: "improve", type: "text", required: false, text: "What should we improve?" },
  ],
};

describe("SurveyFlow", () => {
  it("walks the questions, gates required ones and submits the answers", async () => {
    const f = vi.fn(async (_u: string, init?: RequestInit) =>
      init?.method === "POST" ? json({ data: { completed: true } }, 201) : json({ data: survey }),
    );
    vi.stubGlobal("fetch", f);
    wrap(<SurveyFlow />);

    expect(await screen.findByText("How likely are you to attend next year?")).toBeInTheDocument();
    expect(screen.getByText("4 questions · about 2 minutes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next question" })).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: "Next question" }));

    expect(screen.getByRole("button", { name: "Next question" })).toBeDisabled();
    fireEvent.click(screen.getAllByRole("radio", { name: "5 stars" })[0]);
    expect(screen.getByRole("button", { name: "Next question" })).toBeDisabled();
    fireEvent.click(screen.getAllByRole("radio", { name: "3 stars" })[1]);
    fireEvent.click(screen.getByRole("button", { name: "Next question" }));

    fireEvent.click(screen.getByRole("button", { name: "Worship" }));
    fireEvent.click(screen.getByRole("button", { name: "Next question" }));
    fireEvent.change(screen.getByLabelText("What should we improve?"), { target: { value: "Seating" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findByText("Thank you!")).toBeInTheDocument();
    const post = f.mock.calls.find(([, i]) => (i as RequestInit)?.method === "POST")!;
    expect(JSON.parse((post[1] as RequestInit).body as string)).toEqual({
      answers: { attend: 5, ratings: { Registration: 5, Meals: 3 }, keep: ["Worship"], improve: "Seating" },
    });
  });

  it("goes back a question and keeps answers", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ data: survey })));
    wrap(<SurveyFlow />);
    fireEvent.click(await screen.findByRole("radio", { name: "4" }));
    fireEvent.click(screen.getByRole("button", { name: "Next question" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("radio", { name: "4" })).toHaveAttribute("aria-checked", "true");
  });

  it("shows the thank-you straight away if already completed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ data: { ...survey, completed: true } })));
    wrap(<SurveyFlow />);
    expect(await screen.findByText("Thank you!")).toBeInTheDocument();
  });
});
