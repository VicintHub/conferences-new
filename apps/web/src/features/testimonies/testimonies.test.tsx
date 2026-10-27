import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppTestimonies } from "./AppTestimonies";
import { PublicWall } from "./PublicWall";
import { ShareForm } from "./ShareForm";
import type { Feed, Testimony } from "./types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const t = (id: number, over: Partial<Testimony> = {}): Testimony => ({
  id,
  type: "write",
  body: `Testimony body ${id}`,
  display_name: `Person ${id}`,
  label: "Ibadan",
  tags: ["Healing"],
  tag: "Healing",
  amen_count: 10,
  amened: false,
  featured: false,
  media_url: null,
  poster_url: null,
  duration_seconds: null,
  ...over,
});
const feed = (over: Partial<Feed> = {}): Feed => ({
  data: [t(1), t(2)],
  featured: t(9, {
    type: "video",
    featured: true,
    body: "“I came weary. I left commissioned.”",
    display_name: "Pastor Femi A.",
    label: "Abeokuta",
    duration_seconds: 160,
    poster_url: "/images/photos/lp-about-1.webp",
  }),
  meta: { next_cursor: null, tags: ["Healing"], filters: ["Healing", "Ministry", "IYLC", "Experience"] },
  ...over,
});

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })}>
      {ui}
    </QueryClientProvider>,
  );
afterEach(() => vi.unstubAllGlobals());
beforeEach(() => localStorage.clear());

describe("in-app testimonies feed", () => {
  it("opens with the featured video, then cards with Amen counts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(feed())));
    wrap(<AppTestimonies />);
    expect(await screen.findByText("“I came weary. I left commissioned.”")).toBeInTheDocument();
    expect(screen.getByText(/Pastor Femi A\. · Abeokuta · 2:40/)).toBeInTheDocument();
    expect(screen.getByText("Testimony body 1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Share your testimony" })).toHaveAttribute("href", "/app/testimonies/share");
  });

  it("says Amen optimistically and keeps the server count", async () => {
    const f = vi.fn(async (url: string, init?: RequestInit) =>
      init?.method === "PUT" ? json({ data: { amen_count: 11, amened: true } }) : json(feed()),
    );
    vi.stubGlobal("fetch", f);
    wrap(<AppTestimonies />);
    const btn = await screen.findAllByRole("button", { name: /Say Amen, 10 so far/ });
    fireEvent.click(btn[0]);
    expect(await screen.findByRole("button", { name: /Remove Amen, 11 so far/ })).toHaveAttribute("aria-pressed", "true");
    expect(f.mock.calls.some(([u, i]) => /\/testimonies\/1\/amen$/.test(u as string) && (i as RequestInit)?.method === "PUT")).toBe(true);
  });

  it("rolls the Amen back if the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_u: string, init?: RequestInit) => (init?.method === "PUT" ? json({ message: "x" }, 500) : json(feed()))),
    );
    wrap(<AppTestimonies />);
    fireEvent.click((await screen.findAllByRole("button", { name: /Say Amen, 10 so far/ }))[0]);
    await waitFor(() => expect(screen.getAllByRole("button", { name: /Say Amen, 10 so far/ })).toHaveLength(2));
  });

  it("shows an empty state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(feed({ data: [], featured: null }))));
    wrap(<AppTestimonies />);
    expect(await screen.findByText(/No testimonies yet/)).toBeInTheDocument();
  });
});

describe("public wall", () => {
  it("filters by tag through the API", async () => {
    const f = vi.fn().mockResolvedValue(json(feed({ data: [t(5, { tag: "IYLC", tags: ["IYLC"] })] })));
    vi.stubGlobal("fetch", f);
    wrap(<PublicWall initial={feed()} />);
    fireEvent.click(screen.getAllByRole("button", { name: "IYLC" })[0]);
    await waitFor(() => expect(f).toHaveBeenCalled());
    expect(f.mock.calls[0][0]).toMatch(/\/testimonies\?tag=IYLC$/);
  });

  it("renders the initial feed without calling the API", () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    wrap(<PublicWall initial={feed()} />);
    expect(screen.getAllByText("Testimony body 1").length).toBeGreaterThan(0);
    expect(f).not.toHaveBeenCalled();
  });
});

describe("ShareForm", () => {
  const post = () => vi.fn().mockResolvedValue(json({ data: { id: 1, status: "pending" } }, 201));
  const body = (f: ReturnType<typeof vi.fn>) => f.mock.calls[0][1].body as FormData;

  it("asks guests for a name and checks the testimony length", async () => {
    const f = post();
    vi.stubGlobal("fetch", f);
    wrap(<ShareForm variant="full" signedIn={false} onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByText("Enter your name")).toBeInTheDocument();
    expect(screen.getByText(/at least 10 characters/)).toBeInTheDocument();
    expect(f).not.toHaveBeenCalled();
  });

  it("signed-in attendees send text, tags and name visibility without retyping their name", async () => {
    const f = post();
    const done = vi.fn();
    vi.stubGlobal("fetch", f);
    wrap(<ShareForm variant="full" signedIn onDone={done} />);
    expect(screen.queryByLabelText("Your name")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("What happened?"), { target: { value: "God healed my back during the Thursday session." } });
    fireEvent.click(screen.getByRole("button", { name: "Healing" }));
    fireEvent.click(screen.getByRole("switch", { name: "Show my name" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(done).toHaveBeenCalled());
    const form = body(f);
    expect(form.get("type")).toBe("write");
    expect(form.getAll("tags[]")).toEqual(["Healing"]);
    expect(form.get("show_name")).toBe("0");
    expect(form.has("name")).toBe(false);
  });

  it("allows at most three tags", () => {
    wrap(<ShareForm variant="full" signedIn onDone={vi.fn()} />);
    for (const tag of ["Healing", "Ministry", "Family", "Provision"]) fireEvent.click(screen.getByRole("button", { name: tag }));
    expect(screen.getByRole("button", { name: "Provision" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Family" })).toHaveAttribute("aria-pressed", "true");
  });

  it("requires a file for voice and video and rejects oversized ones", async () => {
    vi.stubGlobal("fetch", post());
    wrap(<ShareForm variant="full" signedIn onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole("radio", { name: "Video" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Record or choose a video");

    const big = new File(["x"], "big.mp4", { type: "video/mp4" });
    Object.defineProperty(big, "size", { value: 60 * 1024 * 1024 });
    fireEvent.change(screen.getByLabelText("Video file"), { target: { files: [big] } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByText(/over 50 MB/)).toBeInTheDocument();
  });

  it("uploads a video as multipart with its type", async () => {
    const f = post();
    vi.stubGlobal("fetch", f);
    const done = vi.fn();
    wrap(<ShareForm variant="full" signedIn onDone={done} />);
    fireEvent.click(screen.getByRole("radio", { name: "Video" }));
    fireEvent.change(screen.getByLabelText("Video file"), { target: { files: [new File(["abc"], "t.mp4", { type: "video/mp4" })] } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(done).toHaveBeenCalled());
    expect(body(f).get("type")).toBe("video");
    expect((body(f).get("media") as File).name).toBe("t.mp4");
  });

  it("shows API validation errors and a friendly rate-limit message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ message: "x" }, 429)));
    wrap(<ShareForm variant="full" signedIn onDone={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("What happened?"), { target: { value: "A long enough testimony text." } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/shared a few already/);
  });

  it("the desktop panel has no format picker and treats an attached file as a video", async () => {
    const f = post();
    vi.stubGlobal("fetch", f);
    const done = vi.fn();
    wrap(<ShareForm variant="panel" signedIn={false} onDone={done} />);
    expect(screen.queryByRole("radiogroup", { name: "How to share" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Grace Ade" } });
    fireEvent.change(screen.getByLabelText("City / church"), { target: { value: "Ibadan" } });
    fireEvent.change(screen.getByLabelText("Video file"), { target: { files: [new File(["abc"], "t.mp4", { type: "video/mp4" })] } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(done).toHaveBeenCalled());
    expect(body(f).get("type")).toBe("video");
    expect(body(f).get("name")).toBe("Grace Ade");
    expect(body(f).get("place")).toBe("Ibadan");
    void within;
  });
});
