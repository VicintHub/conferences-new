import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setDesktop } from "../../../vitest.setup";
import { Apply } from "./Apply";
import { ApplicationStatus } from "./Status";
import { schemaFor } from "./roles";
import type { Application, ApplicationList } from "./types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/features/app/queries", () => ({ useMe: () => ({ me: { attendee: { full_name: "Kemi Ojo" } } }) }));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const wrap = (ui: React.ReactElement) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
);

const roles: ApplicationList["meta"]["roles"] = [
  { key: "vip", label: "VIP", blurb: "Dignitaries & guests of honour" },
  { key: "speaker", label: "Speaker", blurb: "Invited to minister" },
  { key: "vendor", label: "Vendor", blurb: "Sell at the venue" },
  { key: "media", label: "Media", blurb: "Press & broadcast crews" },
];

const application = (over: Partial<Application> = {}): Application => ({
  id: 7,
  role: "media",
  role_label: "Media",
  heading: "Media accreditation",
  summary: "Faith Lens TV · 2 crew",
  status: "in_review",
  status_label: "Under review",
  requested_info: "A copy of your press ID for each crew member.",
  decision_note: null,
  timeline: [
    { key: "submitted", title: "Submitted", at: "2026-11-12T15:20:00+00:00", note: null, state: "done" },
    { key: "documents_checked", title: "Documents checked", at: "2026-11-13T09:00:00+00:00", note: null, state: "done" },
    { key: "in_review", title: "Committee review", at: null, note: "Waiting on you", state: "current" },
    { key: "decision", title: "Decision by email", at: null, note: "Pass issued if approved", state: "upcoming" },
  ],
  documents: [],
  ...over,
});

function api(list: Application[], extra: Record<string, () => Response> = {}) {
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? "GET"} ${new URL(url, "http://x").pathname.replace("/api/backend", "")}`;
    if (key === "GET /me/applications") return json({ data: list, meta: { roles } });
    const r = extra[key];
    if (!r) throw new Error(`unexpected ${key}`);
    return r();
  });
  vi.stubGlobal("fetch", f);
  return f;
}

beforeEach(() => setDesktop(false));
afterEach(() => vi.unstubAllGlobals());

describe("ApplicationStatus", () => {
  it("tracks the application and shows what the committee asked for", () => {
    render(wrap(<ApplicationStatus app={application()} />));
    expect(screen.getByText("Under review")).toBeInTheDocument();
    expect(screen.getByText("Faith Lens TV · 2 crew")).toBeInTheDocument();
    expect(screen.getByText("12 Nov, 4:20 PM")).toBeInTheDocument();
    expect(screen.getByText("Waiting on you")).toBeInTheDocument();
    expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent("Committee review");
    expect(screen.getByText("A copy of your press ID for each crew member.")).toBeInTheDocument();
  });

  it("uploads what was asked for", async () => {
    const f = api([], { "POST /me/applications/7/documents": () => json({ data: application({ requested_info: null }) }) });
    render(wrap(<ApplicationStatus app={application()} />));
    fireEvent.change(screen.getByLabelText("Upload documents"), {
      target: { files: [new File(["x"], "id.pdf", { type: "application/pdf" })] },
    });
    await waitFor(() => expect(f).toHaveBeenCalled());
    const body = f.mock.calls[0]![1]!.body as FormData;
    expect((body.getAll("documents[]")[0] as File).name).toBe("id.pdf");
  });

  it("congratulates on approval and offers a retry after a decline", () => {
    const again = vi.fn();
    const { unmount } = render(
      wrap(<ApplicationStatus app={application({ status: "approved", status_label: "Approved", requested_info: null })} />),
    );
    expect(screen.getByText(/You’re approved/)).toBeInTheDocument();
    unmount();

    render(
      wrap(
        <ApplicationStatus
          app={application({ status: "declined", status_label: "Declined", requested_info: null, decision_note: "Capacity reached" })}
          onApplyAgain={again}
        />,
      ),
    );
    expect(screen.getByText(/Capacity reached/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Apply again" }));
    expect(again).toHaveBeenCalled();
  });
});

describe("Apply (phone)", () => {
  it("needs a role before continuing, then asks the role's questions", async () => {
    api([]);
    render(wrap(<Apply />));

    expect(await screen.findByText("What are you applying as?")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    fireEvent.click(screen.getByRole("radio", { name: /Media/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Media accreditation" })).toBeInTheDocument();
    expect(screen.getByLabelText("Contact name")).toHaveValue("Kemi Ojo");
    expect(screen.getByLabelText("Crew size")).toBeInTheDocument();
  });

  it("validates then submits the answers and files as a multipart form", async () => {
    const f = api([], { "POST /me/applications": () => json({ data: application() }, 201) });
    render(wrap(<Apply />));
    fireEvent.click(await screen.findByRole("radio", { name: /Media/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));
    expect(await screen.findAllByText("This is required")).not.toHaveLength(0);
    expect(f).toHaveBeenCalledTimes(1); // only the list fetch

    fireEvent.change(screen.getByLabelText("Organisation"), { target: { value: "Faith Lens TV" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "0803 123 4567" } });
    fireEvent.change(screen.getByLabelText("Crew size"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Coverage plan"), { target: { value: "Live broadcast of evening sessions" } });
    fireEvent.change(screen.getByLabelText("Documents"), {
      target: { files: [new File(["x"], "press.pdf", { type: "application/pdf" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));

    await waitFor(() => expect(f.mock.calls.some(([, i]) => i?.method === "POST")).toBe(true));
    const form = f.mock.calls.find(([, i]) => i?.method === "POST")![1]!.body as FormData;
    expect(Object.fromEntries([...form.entries()].filter(([k]) => k !== "documents[]"))).toEqual({
      role: "media",
      organisation: "Faith Lens TV",
      contact_name: "Kemi Ojo",
      phone: "+2348031234567",
      crew_size: "2",
      coverage_plan: "Live broadcast of evening sessions",
    });
    expect((form.getAll("documents[]")[0] as File).name).toBe("press.pdf");
  });

  it("shows the tracker when an application exists and hides roles already taken", async () => {
    api([application()]);
    render(wrap(<Apply />));
    expect(await screen.findByText("Media accreditation")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Apply for another role" }));
    expect(screen.getByRole("radio", { name: /VIP/ })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /Media/ })).not.toBeInTheDocument();
  });

  it("shows the server's complaint when it refuses the application", async () => {
    api([], { "POST /me/applications": () => json({ message: "x", errors: { role: ["You already have a Media application."] } }, 422) });
    render(wrap(<Apply />));
    fireEvent.click(await screen.findByRole("radio", { name: /Media/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(screen.getByLabelText("Organisation"), { target: { value: "Faith Lens TV" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "08031234567" } });
    fireEvent.change(screen.getByLabelText("Crew size"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Coverage plan"), { target: { value: "Live broadcast" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));
    expect(await screen.findByText("You already have a Media application.")).toBeInTheDocument();
  });
});

describe("Apply (desktop)", () => {
  it("shows the roles and the form side by side", async () => {
    setDesktop(true);
    api([]);
    render(wrap(<Apply />));
    expect(await screen.findByRole("heading", { name: "Apply to attend" })).toBeInTheDocument();
    expect(screen.getByText(/Choose a role to start/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /Vendor/ }));
    expect(screen.getByRole("heading", { name: "Vendor stall" })).toBeInTheDocument();
    expect(screen.getByLabelText("Stall size")).toBeInTheDocument();
  });
});

describe("schemaFor", () => {
  it("checks each role's own rules", () => {
    expect(
      schemaFor("vendor").safeParse({
        business_name: "Grace Books",
        category: "books",
        stall_size: "m",
        contact_name: "Kemi Ojo",
        phone: "0803 123 4567",
        notes: "",
      }).success,
    ).toBe(true);
    expect(
      schemaFor("media").safeParse({ organisation: "X TV", contact_name: "Kemi", phone: "123", crew_size: "50", coverage_plan: "Live" })
        .success,
    ).toBe(false);
    expect(
      schemaFor("vip").safeParse({ title: "Hon.", organisation: "", contact_name: "Kemi", phone: "+2348031234567", guests: "0", notes: "" })
        .success,
    ).toBe(true);
  });
});
