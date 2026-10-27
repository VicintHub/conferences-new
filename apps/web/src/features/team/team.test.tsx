import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setDesktop } from "../../../vitest.setup";
import { ImportSheet } from "./ImportSheet";
import { MemberSheet } from "./MemberForm";
import { MinistersTeam } from "./MinistersTeam";
import { Team } from "./Team";
import type { Team as TeamT, TeamMember, TeamResponse } from "./types";

let search = "";
let category = "delegate";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("@/features/app/queries", () => ({
  useMe: () => ({ me: { category, minister_verified: true, attendee: { full_name: "Grace Adeyemi", first_name: "Grace" } } }),
}));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const wrap = (ui: React.ReactElement) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
);

const member = (id: number, name: string, over: Partial<TeamMember> = {}): TeamMember => ({
  id,
  name,
  role: "member",
  role_label: "Delegate",
  title: null,
  category: "delegate",
  mode: "onsite",
  status: "confirmed",
  is_you: false,
  email: `${name.split(" ")[0]!.toLowerCase()}@example.com`,
  phone: "+2348122204410",
  badge_collected: false,
  ...over,
});

const team = (over: Partial<TeamT> = {}): TeamT => ({
  id: 1,
  name: "Christ Life Assembly",
  kind: "church",
  code: "CLA-7Q4K",
  share_url: "https://jc27.test/app/team?join=CLA-7Q4K",
  is_leader: true,
  members: [
    member(1, "Adebayo Ogunleye", { role: "leader", role_label: "Team leader", is_you: true }),
    member(2, "Funmi Adeleke"),
    member(3, "Chidi Okafor", { status: "invited", mode: "online" }),
  ],
  stats: { members: 3, confirmed: 2, invited: 1, onsite: 2, badges_collected: 0 },
  limits: { members: 50, aides: 3 },
  ...over,
});
const res = (t: TeamT | null, meta: Partial<TeamResponse["meta"]> = {}): TeamResponse => ({
  data: t,
  meta: { can_create: true, is_minister: false, minister_verified: false, default_name: "Christ Life Assembly", ...meta },
});

/** Routes fetches by "METHOD path" so a test can describe the whole conversation with the API. */
function api(routes: Record<string, () => Response>) {
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? "GET"} ${new URL(url, "http://x").pathname.replace("/api/backend", "")}`;
    const r = routes[key];
    if (!r) throw new Error(`unexpected ${key}`);
    return r();
  });
  vi.stubGlobal("fetch", f);
  return f;
}
const bodyOf = (f: ReturnType<typeof vi.fn>, key: string) => {
  const call = f.mock.calls.find(
    ([u, i]) => `${i?.method ?? "GET"} ${new URL(u, "http://x").pathname.replace("/api/backend", "")}` === key,
  );
  return call ? JSON.parse(call[1].body) : undefined;
};

beforeEach(() => {
  search = "";
  category = "delegate";
  setDesktop(false);
});
afterEach(() => vi.unstubAllGlobals());

describe("Team (phone)", () => {
  it("shows the hero, code and filters the list", async () => {
    api({ "GET /me/teams/church": () => json(res(team())) });
    render(wrap(<Team />));

    expect(await screen.findByText("CLA-7Q4K")).toBeInTheDocument();
    expect(screen.getByText(/3 members|members · 2 confirmed/)).toBeInTheDocument();
    expect(screen.getByText("Team leader · Onsite")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Invited 1" }));
    expect(screen.queryByText("Funmi Adeleke")).not.toBeInTheDocument();
    expect(screen.getByText("Chidi Okafor")).toBeInTheDocument();
    expect(screen.getByText("Delegate · Online")).toBeInTheDocument();
  });

  it("lets someone without a team create one, defaulting to their church", async () => {
    const f = api({
      "GET /me/teams/church": () => json(res(null)),
      "POST /me/teams/church": () => json({ data: team() }, 201),
    });
    render(wrap(<Team />));

    const name = await screen.findByLabelText("Team name");
    expect(name).toHaveValue("Christ Life Assembly");
    fireEvent.click(screen.getByRole("button", { name: "Create my team" }));
    await waitFor(() => expect(bodyOf(f, "POST /me/teams/church")).toEqual({ name: "Christ Life Assembly" }));
  });

  it("explains when a team can't be created yet", async () => {
    api({ "GET /me/teams/church": () => json(res(null, { can_create: false })) });
    render(wrap(<Team />));
    expect(await screen.findByText(/Confirm your registration first/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create my team" })).not.toBeInTheDocument();
  });

  it("offers to join from a share link and reports a full team", async () => {
    search = "join=cla-7q4k";
    const f = api({
      "GET /me/teams/church": () => json(res(null)),
      "GET /teams/CLA-7Q4K": () => json({ data: { name: "Christ Life Assembly", code: "CLA-7Q4K", leader: "Adebayo", members: 14 } }),
      "POST /teams/CLA-7Q4K/join": () => json({ message: "x", errors: { code: ["This team is full."] } }, 422),
    });
    render(wrap(<Team />));

    expect(await screen.findByText("Join Christ Life Assembly?")).toBeInTheDocument();
    expect(screen.getByText(/Adebayo leads this team \(14 people\)/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Join team" }));
    expect(await screen.findByText("This team is full.")).toBeInTheDocument();
    expect(f).toHaveBeenCalledWith(expect.stringContaining("/teams/CLA-7Q4K/join"), expect.objectContaining({ method: "POST" }));
  });

  it("says so when the share link's code is unknown", async () => {
    search = "join=NOPE-1234";
    api({
      "GET /me/teams/church": () => json(res(null)),
      "GET /teams/NOPE-1234": () => json({ message: "Not found" }, 404),
    });
    render(wrap(<Team />));
    expect(await screen.findByText(/couldn’t find a team with the code NOPE-1234/)).toBeInTheDocument();
  });

  it("gives teammates a read-only list with a way to leave", async () => {
    api({ "GET /me/teams/church": () => json(res(team({ is_leader: false }))) });
    render(wrap(<Team />));
    await screen.findByText("CLA-7Q4K");
    expect(screen.queryByRole("button", { name: "Add a member" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Leave this team" })).toBeInTheDocument();
  });

  it("links ministers to their minister's team", async () => {
    category = "minister";
    api({ "GET /me/teams/church": () => json(res(team())) });
    render(wrap(<Team />));
    expect(await screen.findByRole("link", { name: /Minister’s team/ })).toHaveAttribute("href", "/app/team/minister");
  });

  it("opens a member for the leader to resend or remove", async () => {
    const f = api({
      "GET /me/teams/church": () => json(res(team())),
      "POST /me/teams/church/members/3/resend": () => json({ message: "Invitation sent." }),
      "DELETE /me/teams/church/members/3": () => new Response(null, { status: 204 }),
    });
    render(wrap(<Team />));
    fireEvent.click(await screen.findByRole("button", { name: /Chidi Okafor/ }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("chidi@example.com")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Resend ticket" }));
    expect(await within(dialog).findByRole("button", { name: /sent again/ })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Remove from team" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
    await waitFor(() =>
      expect(f).toHaveBeenCalledWith(expect.stringContaining("/members/3"), expect.objectContaining({ method: "DELETE" })),
    );
  });
});

describe("Team (desktop)", () => {
  it("shows stats and a table with contact details for the leader", async () => {
    setDesktop(true);
    api({ "GET /me/teams/church": () => json(res(team())) });
    render(wrap(<Team />));

    expect(await screen.findByRole("heading", { name: "My team" })).toBeInTheDocument();
    expect(screen.getByText("Badges collected")).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getAllByText("+234 812 220 4410")).toHaveLength(3);
    expect(within(table).getAllByText("Confirmed")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Import CSV" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add member" })).toBeInTheDocument();
  });
});

describe("MemberSheet", () => {
  const open = (props: Partial<React.ComponentProps<typeof MemberSheet>> = {}) =>
    render(wrap(<MemberSheet open onOpenChange={() => {}} kind="church" title="Add a member" {...props} />));

  it("validates before sending", async () => {
    const f = api({});
    open();
    fireEvent.click(screen.getByRole("button", { name: "Add & send ticket" }));
    expect(await screen.findByText("Enter their full name")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
    expect(f).not.toHaveBeenCalled();
  });

  it("sends a normalised member and closes", async () => {
    const onOpenChange = vi.fn();
    const f = api({ "POST /me/teams/church/members": () => json({ data: member(9, "Ruth Oyelaran") }, 201) });
    open({ onOpenChange });
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Ruth Oyelaran" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "Ruth@Example.com" } });
    fireEvent.change(screen.getByLabelText("Phone (optional)"), { target: { value: "0909 671 2245" } });
    fireEvent.click(screen.getByRole("button", { name: "Minister" }));
    fireEvent.click(screen.getByRole("switch", { name: "Attending onsite" }));
    fireEvent.click(screen.getByRole("button", { name: "Add & send ticket" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(bodyOf(f, "POST /me/teams/church/members")).toEqual({
      full_name: "Ruth Oyelaran",
      email: "ruth@example.com",
      phone: "+2349096712245",
      mode: "online",
      category: "minister",
    });
  });

  it("shows the server's reason, such as an email that is already registered", async () => {
    api({ "POST /me/teams/church/members": () => json({ message: "x", errors: { email: ["This email is already registered."] } }, 422) });
    open();
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Ruth Oyelaran" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ruth@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Add & send ticket" }));
    expect(await screen.findByText("This email is already registered.")).toBeInTheDocument();
  });

  it("asks for an aide's role and sends the minister-team shape", async () => {
    const f = api({ "POST /me/teams/minister/members": () => json({ data: member(9, "Bisi Alabi") }, 201) });
    open({ kind: "minister", role: "aide", title: "Add an aide" });
    expect(screen.queryByRole("button", { name: "Delegate" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Bisi Alabi" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "bisi@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Add & send ticket" }));
    expect(await screen.findByText("What do they do for you?")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "Protocol" } });
    fireEvent.click(screen.getByRole("button", { name: "Add & send ticket" }));
    await waitFor(() =>
      expect(bodyOf(f, "POST /me/teams/minister/members")).toMatchObject({ role: "aide", title: "Protocol", mode: "onsite" }),
    );
  });
});

describe("ImportSheet", () => {
  it("previews the file, imports it and lists skipped rows", async () => {
    const f = api({
      "POST /me/teams/church/members/import": () =>
        json({ data: { added: 1, skipped: [{ row: 2, name: "Taken", reason: "This email is already registered." }] } }),
    });
    render(wrap(<ImportSheet open onOpenChange={() => {}} />));
    const file = new File(["name,email\nFunmi,funmi@example.com\nTaken,taken@example.com\n"], "team.csv", { type: "text/csv" });
    fireEvent.change(screen.getByLabelText("CSV file"), { target: { files: [file] } });

    expect(await screen.findByText("2 people ready")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Import & send tickets" }));
    expect(await screen.findByText("1 added, 1 skipped")).toBeInTheDocument();
    expect(screen.getByText(/Row 2 \(Taken\): This email is already registered\./)).toBeInTheDocument();
    expect(bodyOf(f, "POST /me/teams/church/members/import").members).toHaveLength(2);
  });

  it("rejects an empty file", async () => {
    render(wrap(<ImportSheet open onOpenChange={() => {}} />));
    fireEvent.change(screen.getByLabelText("CSV file"), { target: { files: [new File([" \n"], "x.csv", { type: "text/csv" })] } });
    expect(await screen.findByText(/couldn’t find any rows/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import & send tickets" })).toBeDisabled();
  });
});

describe("MinistersTeam", () => {
  const spouse = member(5, "Tunde Adeyemi", { role: "spouse", role_label: "Spouse", status: "invited" });
  const aide = (id: number, name: string, title: string) => member(id, name, { role: "aide", role_label: "Aide", title });
  const minister = (members: TeamMember[]) =>
    team({ kind: "minister", name: "Grace Adeyemi", members: [member(1, "Grace Adeyemi", { role: "leader" }), ...members] });

  it("lists the spouse and aides with the 3-aide allowance", async () => {
    category = "minister";
    api({
      "GET /me/teams/minister": () =>
        json(
          res(minister([spouse, aide(6, "Olu Martins", "Personal assistant"), aide(7, "Bisi Alabi", "Protocol")]), {
            is_minister: true,
            minister_verified: true,
          }),
        ),
    });
    render(wrap(<MinistersTeam />));

    expect(await screen.findByText("Verified minister")).toBeInTheDocument();
    expect(screen.getByText("Tunde Adeyemi")).toBeInTheDocument();
    expect(screen.getByText("2 of 3 used")).toBeInTheDocument();
    expect(screen.getByText("Personal assistant")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add an aide" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add your spouse" })).not.toBeInTheDocument();
    expect(screen.getByText(/share your meal and hall access/)).toBeInTheDocument();
  });

  it("hides 'Add an aide' once all three are used", async () => {
    api({
      "GET /me/teams/minister": () =>
        json(
          res(minister([aide(6, "A One", "x"), aide(7, "B Two", "y"), aide(8, "C Three", "z")]), {
            is_minister: true,
            minister_verified: true,
          }),
        ),
    });
    render(wrap(<MinistersTeam />));
    expect(await screen.findByText("3 of 3 used")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add an aide" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add your spouse" })).toBeInTheDocument();
  });

  it("waits for verification before offering a team", async () => {
    api({ "GET /me/teams/minister": () => json(res(null, { is_minister: true, minister_verified: false, can_create: false })) });
    render(wrap(<MinistersTeam />));
    expect(await screen.findByText("We’re verifying you")).toBeInTheDocument();
  });

  it("points non-ministers to a regular team and lets verified ministers set one up", async () => {
    api({ "GET /me/teams/minister": () => json(res(null, { is_minister: false })) });
    const first = render(wrap(<MinistersTeam />));
    expect(await screen.findByText("For ministers")).toBeInTheDocument();
    first.unmount();

    const f = api({
      "GET /me/teams/minister": () => json(res(null, { is_minister: true, minister_verified: true })),
      "POST /me/teams/minister": () => json({ data: minister([]) }, 201),
    });
    render(wrap(<MinistersTeam />));
    fireEvent.click(await screen.findByRole("button", { name: "Set up my team" }));
    await waitFor(() =>
      expect(f).toHaveBeenCalledWith(expect.stringContaining("/me/teams/minister"), expect.objectContaining({ method: "POST" })),
    );
  });
});
