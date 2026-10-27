import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminLogin } from "./Login";
import { Approvals } from "./Approvals";
import { Broadcasts } from "./Broadcasts";
import { Overview } from "./Overview";
import { Publicity } from "./Publicity";
import { Registrants } from "./Registrants";
import { Settings } from "./Settings";
import { AdminShell } from "./Shell";
import { Testimonies } from "./Testimonies";
import type { Staff } from "./types";

const push = vi.fn();
const replace = vi.fn();
let pathname = "/admin";
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(search),
}));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const wrap = (ui: React.ReactElement) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
);

type Route = (init: RequestInit | undefined, url: URL) => Response | Promise<Response>;
/** Routes fetches by "METHOD path" (the part after /api/admin-backend), so a test describes the whole conversation. */
function api(routes: Record<string, Route | Record<string, unknown>>) {
  const f = vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input, "http://x");
    const key = `${init?.method ?? "GET"} ${url.pathname.replace("/api/admin-backend", "").replace("/api/admin", "/auth")}`;
    const r = routes[key];
    if (r === undefined) throw new Error(`unexpected ${key}`);
    return typeof r === "function" ? (r as Route)(init, url) : json(r);
  });
  vi.stubGlobal("fetch", f);
  return f;
}
const sent = (f: ReturnType<typeof vi.fn>, key: string) => {
  const call = f.mock.calls.findLast(
    ([u, i]) => `${i?.method ?? "GET"} ${new URL(u, "http://x").pathname.replace("/api/admin-backend", "")}` === key,
  );
  if (!call) return undefined;
  const body = call[1]?.body;
  return typeof body === "string" ? JSON.parse(body) : body;
};
const urls = (f: ReturnType<typeof vi.fn>) => f.mock.calls.map(([u]) => String(u));

const staff = (over: Partial<Staff> = {}): Staff => ({
  id: 1,
  name: "Kunle Okafor",
  email: "kunle@example.com",
  role: "admin",
  role_label: "Admin",
  title: "Registration lead",
  active: true,
  areas: [
    "registrants",
    "approvals",
    "teams",
    "orders",
    "broadcasts",
    "testimonies",
    "publicity",
    "settings",
    "staff",
    "desk",
    "scan",
    "checkin",
    "override",
  ],
  ...over,
});
const me = (s = staff(), badges = { approvals: 18, testimonies: 7 }) => ({ data: s, meta: { badges } });

beforeEach(() => {
  pathname = "/admin";
  search = "";
  push.mockReset();
  replace.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

describe("AdminShell", () => {
  it("shows the sidebar with waiting counts and who is signed in", async () => {
    api({ "GET /me": me() });
    render(wrap(<AdminShell>page body</AdminShell>));

    const nav = await screen.findByRole("navigation", { name: "Console" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((l) => l.textContent?.replace(/\d+ waiting|\d+$/, "").trim()),
    ).toEqual([
      "Overview",
      "Registrants",
      "Approvals",
      "Teams",
      "Broadcasts",
      "Testimonies",
      "Publicity kit",
      "Store orders",
      "Check-in & meals",
      "Settings",
    ]);
    expect(within(nav).getByLabelText("18 waiting")).toBeInTheDocument();
    expect(within(nav).getByLabelText("7 waiting")).toBeInTheDocument();
    expect(screen.getByText("Registration lead")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Print desk" })).toHaveAttribute("href", "/desk");
    expect(screen.getByRole("link", { name: "Scanner" })).toHaveAttribute("href", "/scan");
    expect(screen.getByText("page body")).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
  });

  it("only lists what the role can open and blocks a direct link to the rest", async () => {
    pathname = "/admin/registrants";
    api({ "GET /me": me(staff({ role: "moderator", areas: ["testimonies"] }), { approvals: 0, testimonies: 2 }) });
    render(wrap(<AdminShell>secret table</AdminShell>));

    const nav = await screen.findByRole("navigation", { name: "Console" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((l) => l.textContent?.replace(/\d+$/, "").trim()),
    ).toEqual(["Overview", "Testimonies"]);
    expect(screen.getByText("Your role can’t open this page.")).toBeInTheDocument();
    expect(screen.queryByText("secret table")).not.toBeInTheDocument();
  });

  it("sends staff back to sign in when the session has ended, and signs out", async () => {
    api({ "GET /me": () => json({ message: "Unauthenticated." }, 401) });
    const first = render(wrap(<AdminShell>x</AdminShell>));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/login"));
    first.unmount();

    replace.mockReset();
    const f = api({ "GET /me": me(), "POST /auth/logout": () => new Response(null, { status: 204 }) });
    render(wrap(<AdminShell>x</AdminShell>));
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/login"));
    expect(urls(f).some((u) => u.endsWith("/auth/logout"))).toBe(true);
  });
});

describe("AdminLogin", () => {
  it("asks for the email, then the code, then goes to the console", async () => {
    const f = api({
      "POST /auth/otp": () => json({ resend_after: 60 }, 202),
      "POST /auth/verify": () => json({ data: { name: "Kunle" } }),
    });
    render(wrap(<AdminLogin />));

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "Kunle@Example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Email me a code" }));
    expect(await screen.findByText("Check your email")).toBeInTheDocument();
    expect(sent(f, "POST /auth/otp")).toEqual({ email: "kunle@example.com" });

    fireEvent.change(screen.getByLabelText("Digit 1"), { target: { value: "123456" } });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin"));
    expect(sent(f, "POST /api/admin/verify")).toEqual({ email: "kunle@example.com", code: "123456" });
  });

  it("returns to the page they were trying to open, but only inside the console", async () => {
    search = "next=%2Fadmin%2Fapprovals";
    api({ "POST /auth/otp": () => json({ resend_after: 60 }, 202), "POST /auth/verify": () => json({ data: {} }) });
    const first = render(wrap(<AdminLogin />));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "k@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Email me a code" }));
    fireEvent.change(await screen.findByLabelText("Digit 1"), { target: { value: "123456" } });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/approvals"));
    first.unmount();

    push.mockReset();
    search = "next=https%3A%2F%2Fevil.example";
    render(wrap(<AdminLogin />));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "k@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Email me a code" }));
    fireEvent.change(await screen.findByLabelText("Digit 1"), { target: { value: "123456" } });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin"));
  });

  it("validates the email and reports a wrong code", async () => {
    api({
      "POST /auth/otp": () => json({ resend_after: 60 }, 202),
      "POST /auth/verify": () => json({ message: "That code or link is incorrect or has expired." }, 422),
    });
    render(wrap(<AdminLogin />));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "nope" } });
    fireEvent.click(screen.getByRole("button", { name: "Email me a code" }));
    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "k@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Email me a code" }));
    fireEvent.change(await screen.findByLabelText("Digit 1"), { target: { value: "000000" } });
    expect(await screen.findByText(/incorrect or has expired/)).toBeInTheDocument();
  });
});

describe("Overview", () => {
  const data = {
    days_to_opening: 84,
    kpis: {
      registered: { value: 4912, today: 198 },
      onsite: { value: 1846, percent_of_cap: 74 },
      online: { value: 3066, today: 120 },
      awaiting_approval: { value: 18, oldest_days: 2 },
    },
    series: Array.from({ length: 14 }, (_, i) => ({ date: `2027-01-${String(i + 1).padStart(2, "0")}`, count: (i + 1) * 10 })),
    capacity: { taken: 1846, total: 2500, percent: 74 },
    categories: [
      { key: "delegate", label: "Delegates", count: 3804 },
      { key: "minister", label: "Ministers", count: 612 },
      { key: "invited", label: "VIP · Speaker · Vendor · Media", count: 64 },
    ],
  };

  it("shows the KPIs, the 14-day chart, the capacity and the category split", async () => {
    api({ "GET /overview": { data } });
    render(wrap(<Overview />));

    expect(await screen.findByText("84 days to opening")).toBeInTheDocument();
    expect(screen.getByText("4,912")).toBeInTheDocument();
    expect(screen.getByText("+198 today")).toBeInTheDocument();
    expect(screen.getByText("74% of cap")).toBeInTheDocument();
    expect(screen.getByText("Oldest 2 days")).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Registrations per day" })).getAllByRole("listitem")).toHaveLength(14);
    expect(screen.getByRole("progressbar", { name: "Onsite capacity used" })).toHaveAttribute("aria-valuenow", "74");
    expect(screen.getByText("1,846 of 2,500")).toBeInTheDocument();
    expect(screen.getByText("3,804")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Export" })).toHaveAttribute("href", "/api/admin-backend/registrants/export");
  });

  it("hides the buttons a role can't use", async () => {
    api({ "GET /overview": { data } });
    render(wrap(<Overview canBroadcast={false} canExport={false} />));
    await screen.findByText("4,912");
    expect(screen.queryByRole("link", { name: "Export" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "New broadcast" })).not.toBeInTheDocument();
  });

  it("explains a failure", async () => {
    api({ "GET /overview": () => json({ message: "boom" }, 500) });
    render(wrap(<Overview />));
    expect(await screen.findByRole("alert")).toHaveTextContent("boom");
  });
});

describe("Registrants", () => {
  const row = (id: number, name: string, over = {}) => ({
    id,
    claim_code: `JC27-DLG-0000${id}`,
    name,
    email: `${name.split(" ")[0]!.toLowerCase()}@example.com`,
    phone: "+2348031234567",
    church: "CLA",
    location: null,
    category: "delegate",
    mode: "onsite",
    status: "confirmed",
    needs_accommodation: false,
    minister_verified: false,
    registered_at: "2027-01-01T10:00:00+01:00",
    ...over,
  });

  it("lists registrants and passes filters and search to the API", async () => {
    const f = api({
      "GET /registrants": () =>
        json({
          data: [row(1, "Funmi Adeleke"), row(2, "Pastor Grace", { category: "minister" })],
          meta: { page: 1, last_page: 3, total: 60 },
        }),
    });
    render(wrap(<Registrants />));

    expect(await screen.findByText("Funmi Adeleke")).toBeInTheDocument();
    expect(screen.getByText("Unverified")).toBeInTheDocument();
    expect(screen.getAllByText("+234 803 123 4567")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Ministers" }));
    fireEvent.click(screen.getByRole("button", { name: "Online" }));
    fireEvent.change(screen.getByLabelText("Search name, email, church or code"), { target: { value: "grace" } });
    await waitFor(() =>
      expect(urls(f).some((u) => u.includes("category=minister") && u.includes("mode=online") && u.includes("search=grace"))).toBe(true),
    );
    expect(screen.getByRole("link", { name: "Export CSV" }).getAttribute("href")).toContain("category=minister");
  });

  it("pages through results and says when nothing matches", async () => {
    const f = api({
      "GET /registrants": (_i, url) =>
        json(
          url.searchParams.get("page") === "2"
            ? { data: [], meta: { page: 2, last_page: 2, total: 26 } }
            : { data: [row(1, "Funmi Adeleke")], meta: { page: 1, last_page: 2, total: 26 } },
        ),
    });
    render(wrap(<Registrants />));
    await screen.findByText("Funmi Adeleke");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("No registrants match.")).toBeInTheDocument();
    expect(urls(f).some((u) => u.includes("page=2"))).toBe(true);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});

describe("Approvals", () => {
  const queue = {
    data: [
      {
        key: "reg-4",
        kind: "minister",
        kind_label: "Minister",
        name: "Pastor Grace Adeyemi",
        subtitle: "Living Waters, Osogbo",
        created_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      },
      {
        key: "app-7",
        kind: "media",
        kind_label: "Media",
        name: "Faith Lens TV",
        subtitle: "Faith Lens TV · 2 crew",
        created_at: new Date(Date.now() - 3_600_000).toISOString(),
      },
    ],
    meta: { counts: { all: 2, minister: 1, media: 1 } },
  };
  const minister = {
    key: "reg-4",
    kind: "minister",
    kind_label: "Minister",
    name: "Pastor Grace Adeyemi",
    subtitle: "",
    created_at: "",
    heading: "Minister verification",
    facts: [{ k: "Church", v: "Living Waters" }],
    documents: [],
    actions: ["approve", "decline"],
    requested_info: null,
    status: "pending",
  };
  const media = {
    ...minister,
    key: "app-7",
    kind: "media",
    kind_label: "Media",
    name: "Faith Lens TV",
    heading: "Media accreditation",
    facts: [{ k: "Crew size", v: "2" }],
    documents: [{ id: 3, name: "press-id.pdf", size: 9, url: "/admin/applications/7/documents/3" }],
    actions: ["check", "review", "request_info", "approve", "decline"],
    status: "submitted",
  };

  it("shows the queue oldest first with the first item open", async () => {
    api({ "GET /approvals": queue, "GET /approvals/reg-4": { data: minister } });
    render(wrap(<Approvals />));

    const list = await screen.findByRole("list", { name: "Queue" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(within(list).getByText("2d")).toBeInTheDocument();
    expect(within(list).getByText("1h")).toBeInTheDocument();
    expect(await screen.findByText("Minister verification")).toBeInTheDocument();
    expect(screen.getByText("Living Waters")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /All 2/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ministers 1/ })).toBeInTheDocument();
  });

  it("approves a minister", async () => {
    const f = api({
      "GET /approvals": queue,
      "GET /approvals/reg-4": { data: minister },
      "POST /approvals/reg-4": { data: null, meta: { badges: { approvals: 1, testimonies: 0 } } },
    });
    render(wrap(<Approvals />));
    fireEvent.click(await screen.findByRole("button", { name: "Approve" }));
    await waitFor(() => expect(sent(f, "POST /approvals/reg-4")).toMatchObject({ action: "approve" }));
  });

  it("declines with a note to the applicant", async () => {
    const f = api({
      "GET /approvals": queue,
      "GET /approvals/reg-4": { data: minister },
      "POST /approvals/reg-4": { data: null, meta: { badges: { approvals: 1, testimonies: 0 } } },
    });
    render(wrap(<Approvals />));
    fireEvent.click(await screen.findByRole("button", { name: "Decline" }));
    fireEvent.change(screen.getByLabelText(/Note to the applicant/), { target: { value: "Could not match the letter." } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm decline" }));
    await waitFor(() => expect(sent(f, "POST /approvals/reg-4")).toEqual({ action: "decline", note: "Could not match the letter." }));
  });

  it("works an application: documents, a request for more, and a download link", async () => {
    const f = api({
      "GET /approvals": queue,
      "GET /approvals/reg-4": { data: minister },
      "GET /approvals/app-7": { data: media },
      "POST /approvals/app-7": { data: media, meta: { badges: { approvals: 1, testimonies: 0 } } },
    });
    render(wrap(<Approvals />));
    fireEvent.click(await screen.findByRole("button", { name: /Faith Lens TV/ }));

    expect(await screen.findByText("Media accreditation")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "press-id.pdf" })).toHaveAttribute("href", "/api/admin-backend/applications/7/documents/3");
    fireEvent.click(screen.getByRole("button", { name: "Mark documents checked" }));
    await waitFor(() => expect(sent(f, "POST /approvals/app-7")).toEqual({ action: "check" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Mark documents checked" })).toBeEnabled()); // the first request has finished

    fireEvent.click(screen.getByRole("button", { name: "Ask for more" }));
    expect(screen.getByRole("button", { name: "Send request" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("What do you need from them?"), { target: { value: "Press ID for each crew member." } });
    fireEvent.click(screen.getByRole("button", { name: "Send request" }));
    await waitFor(() =>
      expect(sent(f, "POST /approvals/app-7")).toEqual({ action: "request_info", info: "Press ID for each crew member." }),
    );
  });

  it("filters by kind and shows an empty queue kindly", async () => {
    const f = api({
      "GET /approvals": (_i, url) => json(url.searchParams.get("kind") === "media" ? { data: [], meta: { counts: { all: 0 } } } : queue),
      "GET /approvals/reg-4": { data: minister },
    });
    render(wrap(<Approvals />));
    fireEvent.click(await screen.findByRole("button", { name: /Media 1/ }));
    expect(await screen.findByText("Nothing is waiting for approval.")).toBeInTheDocument();
    expect(urls(f).some((u) => u.includes("kind=media"))).toBe(true);
  });
});

describe("Broadcasts", () => {
  const meta = {
    channels: [
      { key: "push", label: "Push", available: false },
      { key: "sms", label: "SMS", available: false },
      { key: "email", label: "Email", available: true },
      { key: "whatsapp", label: "WhatsApp", available: false },
    ],
    audiences: ["onsite", "online", "iylc", "ministers", "team_leaders", "everyone"].map((key) => ({
      key,
      label: key === "iylc" ? "IYLC" : key[0]!.toUpperCase() + key.slice(1).replace("_", " "),
    })),
  };
  const sentRow = {
    id: 1,
    title: "Gate B",
    body: "x",
    channels: ["email"],
    audience: ["onsite"],
    status: "sent",
    scheduled_at: null,
    sent_at: "2027-01-23T12:00:00+01:00",
    recipients_count: 1846,
    author: "Kunle",
    created_at: "2027-01-23T12:00:00+01:00",
  };

  it("only offers connected channels and shows who a choice reaches", async () => {
    const f = api({
      "GET /broadcasts": { data: [], meta },
      "POST /broadcasts/preview": (init) => json({ data: { reach: JSON.parse(String(init?.body)).audience.length * 900 } }),
    });
    render(wrap(<Broadcasts />));

    expect(await screen.findByRole("button", { name: "SMS" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Push" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Email" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Choose who should get it.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Onsite" }));
    fireEvent.click(screen.getByRole("button", { name: "IYLC" }));
    expect(await screen.findByText("Reaches 1,800 people")).toBeInTheDocument();
    expect(sent(f, "POST /broadcasts/preview")).toEqual({ audience: ["onsite", "iylc"] });
  });

  it("previews the notification as it is typed and sends it now", async () => {
    const f = api({
      "GET /broadcasts": { data: [], meta },
      "POST /broadcasts/preview": { data: { reach: 1846 } },
      "POST /broadcasts": { data: sentRow },
    });
    render(wrap(<Broadcasts />));
    fireEvent.click(await screen.findByRole("button", { name: "Onsite" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Gate B opens at 1:15 PM" } });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "IYLC arrivals, please use Gate B." } });

    const preview = screen.getByRole("complementary", { name: "Preview" });
    expect(within(preview).getByText("Gate B opens at 1:15 PM")).toBeInTheDocument();
    expect(within(preview).getByText("IYLC arrivals, please use Gate B.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Send now" }));
    expect(await screen.findByText("Sent to 1,846 people.")).toBeInTheDocument();
    expect(sent(f, "POST /broadcasts")).toEqual({
      title: "Gate B opens at 1:15 PM",
      body: "IYLC arrivals, please use Gate B.",
      channels: ["email"],
      audience: ["onsite"],
    });
  });

  it("schedules in Ibadan time and can send a test first", async () => {
    const f = api({
      "GET /broadcasts": { data: [], meta },
      "POST /broadcasts/preview": { data: { reach: 5 } },
      "POST /broadcasts/test": { message: "Test sent to kunle@example.com." },
      "POST /broadcasts": { data: { ...sentRow, status: "scheduled", scheduled_at: "2027-01-23T12:45:00+01:00" } },
    });
    render(wrap(<Broadcasts />));
    fireEvent.click(await screen.findByRole("button", { name: "Everyone" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Gate B" } });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Use Gate B." } });

    fireEvent.click(screen.getByRole("button", { name: "Send test" }));
    expect(await screen.findByText("Test sent to kunle@example.com.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Send at (Ibadan time)"), { target: { value: "2027-01-23T12:45" } });
    fireEvent.click(screen.getByRole("button", { name: "Schedule" }));
    await waitFor(() => expect(sent(f, "POST /broadcasts")).toMatchObject({ scheduled_at: "2027-01-23T12:45:00+01:00" }));
    expect(await screen.findByText(/Scheduled for/)).toBeInTheDocument();
  });

  it("won't send until there is a message and an audience, and lists what went out", async () => {
    api({
      "GET /broadcasts": {
        data: [sentRow, { ...sentRow, id: 2, title: "Later", status: "scheduled", scheduled_at: "2027-01-24T09:00:00+01:00" }],
        meta,
      },
    });
    render(wrap(<Broadcasts />));
    expect(await screen.findByRole("button", { name: "Send now" })).toBeDisabled();
    const recent = screen.getByRole("region", { name: "Recent broadcasts" });
    expect(within(recent).getByText(/1,846 reached/)).toBeInTheDocument();
    expect(within(recent).getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });
});

describe("Testimonies", () => {
  const t = (id: number, over = {}) => ({
    id,
    type: "write",
    body: `Testimony ${id}`,
    author_name: "Real Name",
    display_name: "A delegate from Oyo",
    label: "Oyo",
    tag: "Healing",
    media_url: null,
    duration_seconds: null,
    status: "pending",
    featured: false,
    ...over,
  });
  const meta = { counts: { pending: 2, approved: 1 }, average_rating: 4.6, responses: 1120 };

  it("shows the queue with the real author and the rating summary", async () => {
    api({
      "GET /testimonies": {
        data: [t(1), t(2, { author_name: "Tobi E.", display_name: "Tobi E.", type: "video", duration_seconds: 80 })],
        meta,
      },
    });
    render(wrap(<Testimonies />));

    expect(await screen.findByText("Testimony 1")).toBeInTheDocument();
    expect(screen.getByText("Really: Real Name")).toBeInTheDocument();
    expect(screen.getByText("Video · 1:20")).toBeInTheDocument();
    expect(screen.getByText("Avg. session rating 4.6 · 1,120 responses")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /To review 2/ })).toBeInTheDocument();
  });

  it("publishes and hides", async () => {
    const f = api({
      "GET /testimonies": { data: [t(1)], meta },
      "POST /testimonies/1": { data: { id: 1, status: "approved", featured: false } },
    });
    render(wrap(<Testimonies />));
    fireEvent.click(await screen.findByRole("button", { name: "Publish" }));
    await waitFor(() => expect(sent(f, "POST /testimonies/1")).toEqual({ action: "publish" }));
    fireEvent.click(screen.getByRole("button", { name: "Hide" }));
    await waitFor(() =>
      expect(f.mock.calls.filter(([, i]) => i?.method === "POST").map(([, i]) => JSON.parse(String(i?.body)).action)).toContain("hide"),
    );
  });

  it("features a published one and says when there is nothing to review", async () => {
    const f = api({
      "GET /testimonies": (_i, url) =>
        json(url.searchParams.get("status") === "approved" ? { data: [t(3, { status: "approved" })], meta } : { data: [], meta }),
      "POST /testimonies/3": { data: {} },
    });
    render(wrap(<Testimonies />));
    expect(await screen.findByText("Nothing to review. All caught up.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Published 1/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Feature" }));
    await waitFor(() => expect(sent(f, "POST /testimonies/3")).toEqual({ action: "feature" }));
    expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();
  });
});

describe("Publicity", () => {
  const meta = {
    downloads: 2244,
    shares: 7163,
    types: { flyer: "Flyers", status: "Status", video: "Videos", design: "Designs", logo: "Logos" },
    sizes: [
      { key: "square", label: "Square", dims: "1080×1080" },
      { key: "status", label: "Status", dims: "1080×1920" },
      { key: "print", label: "Print", dims: "A4" },
    ],
  };
  const row = {
    id: 1,
    slug: "official-flyer",
    title: "Official flyer",
    type: "flyer",
    meta: "Square · Status",
    preview: null,
    caption: "c",
    status: "published",
    published_at: "2027-01-01T10:00:00+01:00",
    downloads: 1284,
    shares: 3910,
  };

  it("lists items with their numbers and totals", async () => {
    api({ "GET /publicity": { data: [row, { ...row, id: 2, title: "Countdown", status: "scheduled", downloads: 0, shares: 0 }], meta } });
    render(wrap(<Publicity />));
    expect(await screen.findByText("Official flyer")).toBeInTheDocument();
    expect(screen.getByText("7,163 shares · 2,244 downloads")).toBeInTheDocument();
    expect(screen.getByText("1,284")).toBeInTheDocument();
    expect(screen.getByText(/Scheduled/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Status" })).toBeInTheDocument(); // a type, not "Statu"
  });

  it("checks the form before uploading, then sends the file and choices as multipart", async () => {
    const f = api({ "GET /publicity": { data: [], meta }, "POST /publicity": { data: { ...row, title: "Countdown" } } });
    render(wrap(<Publicity />));
    await screen.findByText("Upload content");

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    expect(await screen.findByText("Choose a file to upload.")).toBeInTheDocument();
    expect(screen.getByText("Give it a title.")).toBeInTheDocument();
    expect(screen.getByText("Add a caption people can copy.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("File"), {
      target: { files: [new File(["x"], "countdown-3-days.png", { type: "image/png" })] },
    });
    expect(screen.getByLabelText("Title")).toHaveValue("countdown 3 days");
    fireEvent.change(screen.getByLabelText("Suggested caption"), { target: { value: "Three days to go!" } });
    fireEvent.click(screen.getByRole("button", { name: "Video" }));
    fireEvent.click(screen.getByRole("button", { name: "Print A4" }));
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    expect(await screen.findByText(/is live in the app/)).toBeInTheDocument();
    const form = sent(f, "POST /publicity") as FormData;
    expect(form.get("title")).toBe("countdown 3 days");
    expect(form.get("type")).toBe("video");
    expect(form.getAll("sizes[]")).toEqual(["square", "status", "print"]);
    expect(form.get("publish")).toBe("now");
    expect((form.get("file") as File).name).toBe("countdown-3-days.png");
  });

  it("schedules only with a time, in Ibadan time", async () => {
    const f = api({ "GET /publicity": { data: [], meta }, "POST /publicity": { data: row } });
    render(wrap(<Publicity />));
    await screen.findByText("Upload content");
    fireEvent.change(screen.getByLabelText("File"), { target: { files: [new File(["x"], "countdown.png", { type: "image/png" })] } });
    fireEvent.change(screen.getByLabelText("Suggested caption"), { target: { value: "Soon" } });

    fireEvent.click(screen.getByRole("button", { name: "Schedule" }));
    expect(await screen.findByText("Pick when it should go live.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Go live at/), { target: { value: "2027-01-12T09:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Schedule" }));
    await waitFor(() => expect((sent(f, "POST /publicity") as FormData).get("publish_at")).toBe("2027-01-12T09:00:00+01:00"));
  });

  it("refuses a file over 500 MB and unpublishes or deletes an item", async () => {
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
    const f = api({
      "GET /publicity": { data: [row], meta },
      "PATCH /publicity/1": { data: row },
      "DELETE /publicity/1": () => new Response(null, { status: 204 }),
    });
    render(wrap(<Publicity />));
    await screen.findByText("Official flyer");

    const huge = new File(["x"], "big.mp4", { type: "video/mp4" });
    Object.defineProperty(huge, "size", { value: 600 * 1024 * 1024 });
    fireEvent.change(screen.getByLabelText("File"), { target: { files: [huge] } });
    expect(await screen.findByText("That file is over 500 MB.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Unpublish" }));
    await waitFor(() => expect(sent(f, "PATCH /publicity/1")).toEqual({ publish: "draft" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(f.mock.calls.some(([, i]) => i?.method === "DELETE")).toBe(true));
  });
});

describe("Settings", () => {
  const settings = {
    live: { is_live: false, title: null, video_url: null, radio_url: null, poster: null, video_kind: null },
    replays: [{ id: 1, title: "Day 1", recorded_on: "2027-01-20", duration_seconds: 7200, thumbnail: null, video_url: null, active: true }],
  };

  it("saves the live stream settings and shows the API's complaint when it isn't enough to go live", async () => {
    const f = api({
      "GET /me": me(),
      "GET /settings": { data: settings },
      "GET /staff": { data: [staff()], meta: { roles: [{ key: "admin", label: "Admin" }] } },
      "PUT /settings/live": (init) =>
        JSON.parse(String(init?.body)).video_url
          ? json({ data: {} })
          : json({ message: "Add a video or radio link before going live." }, 422),
    });
    render(wrap(<Settings />));
    fireEvent.click(await screen.findByRole("switch", { name: "We are live now" }));
    fireEvent.click(screen.getByRole("button", { name: "Save stream settings" }));
    expect(await screen.findByText("Add a video or radio link before going live.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Video link"), { target: { value: "https://youtu.be/dQw4w9WgXcQ" } });
    fireEvent.click(screen.getByRole("button", { name: "Save stream settings" }));
    expect(await screen.findByText("Saved.")).toBeInTheDocument();
    expect(sent(f, "PUT /settings/live")).toMatchObject({ is_live: true, video_url: "https://youtu.be/dQw4w9WgXcQ", radio_url: null });
  });

  it("adds a replay and publishes its video link", async () => {
    const f = api({
      "GET /me": me(staff({ role: "content", areas: ["settings"] })),
      "GET /settings": { data: settings },
      "POST /replays": { data: {} },
      "PATCH /replays/1": { data: {} },
    });
    render(wrap(<Settings />));
    expect(await screen.findByText("Day 1")).toBeInTheDocument();
    expect(screen.queryByText("Staff")).not.toBeInTheDocument(); // admins only

    fireEvent.change(screen.getByLabelText("Video link for Day 1"), { target: { value: "https://cdn.example.com/d1.m3u8" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(sent(f, "PATCH /replays/1")).toEqual({ video_url: "https://cdn.example.com/d1.m3u8" }));

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Day 2" } });
    fireEvent.change(screen.getByLabelText("Recorded on"), { target: { value: "2027-01-21" } });
    fireEvent.change(screen.getByLabelText("Minutes"), { target: { value: "90" } });
    fireEvent.click(screen.getByRole("button", { name: "Add replay" }));
    await waitFor(() =>
      expect(sent(f, "POST /replays")).toEqual({ title: "Day 2", recorded_on: "2027-01-21", duration_seconds: 5400, video_url: null }),
    );
  });

  it("lets admins manage staff but not their own account", async () => {
    const ruth = staff({ id: 2, name: "Ruth Ige", email: "ruth@example.com", role: "moderator" });
    const f = api({
      "GET /me": me(),
      "GET /settings": { data: settings },
      "GET /staff": {
        data: [staff(), ruth],
        meta: {
          roles: [
            { key: "admin", label: "Admin" },
            { key: "moderator", label: "Moderator" },
          ],
        },
      },
      "PATCH /staff/2": { data: ruth },
      "POST /staff": { data: ruth },
    });
    render(wrap(<Settings />));

    expect(await screen.findByLabelText("Role for Kunle Okafor")).toBeDisabled();
    expect(screen.getAllByRole("button", { name: "Deactivate" })).toHaveLength(1); // only Ruth's row
    fireEvent.click(screen.getByRole("button", { name: "Deactivate" }));
    await waitFor(() => expect(sent(f, "PATCH /staff/2")).toEqual({ active: false }));

    const add = screen.getByRole("button", { name: "Add" });
    expect(add).toBeDisabled();
    fireEvent.change(screen.getAllByLabelText("Name").at(-1)!, { target: { value: "New Person" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@example.com" } });
    fireEvent.click(add);
    await waitFor(() =>
      expect(sent(f, "POST /staff")).toMatchObject({ name: "New Person", email: "new@example.com", role: "registration" }),
    );
  });
});

describe("CheckIn", () => {
  const data = {
    checkpoints: [
      { key: "gate", label: "Gate", ok: 286, refused: 4 },
      { key: "hall", label: "Hall", ok: 120, refused: 0 },
      { key: "meal", label: "Meal", ok: 90, refused: 2 },
      { key: "merch", label: "Merch", ok: 14, refused: 0 },
    ],
    meals: { Lunch: 90 },
    refusals: { "Already served": 2, "Registered as online": 4 },
    overrides: 1,
    badges: { today: 412, total: 900, reprints: 3 },
    recent: [
      {
        id: 1,
        checkpoint: "meal",
        result: "refused",
        reason: "Already served",
        overridden: false,
        who: "Chidi Okafor",
        device: "Meal point 2",
        scanned_at: "2027-01-23T12:58:00+01:00",
      },
      {
        id: 2,
        checkpoint: "gate",
        result: "ok",
        reason: null,
        overridden: true,
        who: "Funmi Adeleke",
        device: null,
        scanned_at: "2027-01-23T12:50:00+01:00",
      },
    ],
  };

  it("summarises the door, the meals, the badges and the latest scans", async () => {
    api({ "GET /checkin": { data } });
    const { CheckIn } = await import("./CheckIn");
    render(wrap(<CheckIn />));

    expect(await screen.findByText("286")).toBeInTheDocument();
    expect(screen.getByText("4 refused")).toBeInTheDocument();
    expect(screen.getByText("412")).toBeInTheDocument();
    expect(screen.getByText(/3 reprints/)).toBeInTheDocument();
    expect(screen.getByText("1 supervisor override")).toBeInTheDocument();
    expect(screen.getAllByText("Already served").length).toBeGreaterThan(1);
    expect(screen.getByText("Chidi Okafor")).toBeInTheDocument();
    expect(screen.getByText("Override")).toBeInTheDocument();
  });

  it("is calm when nothing has been scanned", async () => {
    api({
      "GET /checkin": {
        data: {
          ...data,
          checkpoints: data.checkpoints.map((c) => ({ ...c, ok: 0, refused: 0 })),
          meals: {},
          refusals: {},
          overrides: 0,
          recent: [],
        },
      },
    });
    const { CheckIn } = await import("./CheckIn");
    render(wrap(<CheckIn />));
    expect(await screen.findByText("Nothing scanned yet.")).toBeInTheDocument();
    expect(screen.getByText("None yet today.")).toBeInTheDocument();
    expect(screen.getByText("None today.")).toBeInTheDocument();
  });
});
