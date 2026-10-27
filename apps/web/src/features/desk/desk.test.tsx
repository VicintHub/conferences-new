import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BadgeCard } from "./BadgeCard";
import { PrintDesk } from "./PrintDesk";
import { dayRange, type DeskCard } from "./types";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const wrap = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

const card = (over: Partial<DeskCard> = {}): DeskCard => ({
  registration_id: 1,
  claim_code: "JC27-DLG-48213",
  name: "Adebayo Ogunleye",
  church: "Christ Life Assembly",
  category: "delegate",
  mode: "onsite",
  days: ["2027-01-19", "2027-01-20", "2027-01-24"],
  team_code: "CLA-7Q4K",
  phone_last4: "7821",
  valid: true,
  status: "confirmed",
  badge_printed_at: null,
  ...over,
});

let areas = ["desk", "scan"];
function api(routes: { lookup?: DeskCard[] | (() => Response); print?: (body: Record<string, unknown>) => Response } = {}) {
  const f = vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input, "http://x");
    const path = url.pathname.replace("/api/admin-backend", "");
    if (path === "/me") return json({ data: { role: "desk", areas, name: "Door" } });
    if (path === "/desk/summary") return json({ data: { printed_today: 412, printed_total: 900 } });
    if (path === "/desk/lookup") return typeof routes.lookup === "function" ? routes.lookup() : json({ data: routes.lookup ?? [card()] });
    if (path === "/desk/print")
      return routes.print
        ? routes.print(JSON.parse(String(init?.body)))
        : json({ data: card({ badge_printed_at: "2027-01-19T10:00:00+01:00" }) });
    throw new Error(`unexpected ${path}`);
  });
  vi.stubGlobal("fetch", f);
  return f;
}
const find = async (q: string) => {
  fireEvent.change(screen.getByLabelText(/Scan a claim ticket/), { target: { value: q } });
  fireEvent.submit(screen.getByLabelText(/Scan a claim ticket/).closest("form")!);
};
const printCalls = (f: ReturnType<typeof vi.fn>) =>
  f.mock.calls.filter(([u]) => String(u).endsWith("/desk/print")).map(([, i]) => JSON.parse(String(i?.body)));

beforeEach(() => {
  localStorage.clear();
  areas = ["desk", "scan"];
  window.print = vi.fn();
});
afterEach(() => vi.unstubAllGlobals());

describe("PrintDesk", () => {
  it("shows the desk, its location and how many badges went out today", async () => {
    api();
    wrap(<PrintDesk />);
    expect(await screen.findByText("Online · 412 printed today")).toBeInTheDocument();
    expect(screen.getByText("Print desk 1")).toBeInTheDocument();
    expect(screen.getByText("Gate A · Printer ready")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Print badge" })).toBeDisabled();
  });

  it("finds a person, previews the badge, and only prints once the ID checks are ticked", async () => {
    const f = api();
    wrap(<PrintDesk />);
    await find("jc27-dlg-48213");

    expect(await screen.findByText("Valid ticket")).toBeInTheDocument();
    expect(screen.getByText("JC27-DLG-48213 · Christ Life Assembly")).toBeInTheDocument();
    expect(screen.getByText("19–24")).toBeInTheDocument();
    expect(screen.getByText("CLA-7Q4K")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "No badge printed before" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Print badge" })).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: "Photo ID matches the name" }));
    expect(screen.getByRole("button", { name: "Print badge" })).toBeDisabled(); // the phone check is still open
    fireEvent.click(screen.getByRole("checkbox", { name: "Phone ends in …7821" }));
    fireEvent.click(screen.getByRole("button", { name: "Print badge" }));

    expect(await screen.findByText("Badge printed for Adebayo Ogunleye.")).toBeInTheDocument();
    expect(window.print).toHaveBeenCalledTimes(1);
    expect(printCalls(f)).toEqual([{ registration_id: 1, desk: "Print desk 1" }]);
    expect(screen.queryByText("Valid ticket")).not.toBeInTheDocument(); // cleared for the next person
  });

  it("prints on Enter and clears on Escape", async () => {
    const f = api();
    wrap(<PrintDesk />);
    await find("JC27-DLG-48213");
    await screen.findByText("Valid ticket");
    fireEvent.click(screen.getByRole("checkbox", { name: "Photo ID matches the name" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Phone ends in …7821" }));

    fireEvent.keyDown(document.body, { key: "Enter" });
    await waitFor(() => expect(printCalls(f)).toHaveLength(1));

    await find("JC27-DLG-48213");
    await screen.findByText("Valid ticket");
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(screen.queryByText("Valid ticket")).not.toBeInTheDocument();
    expect(printCalls(f)).toHaveLength(1);
  });

  it("lets staff choose between several matches", async () => {
    api({ lookup: [card(), card({ registration_id: 2, claim_code: "JC27-DLG-00002", name: "Adeleke Funmi", church: null })] });
    wrap(<PrintDesk />);
    await find("ade");
    const list = await screen.findByRole("list", { name: "Matches" });
    expect(list.querySelectorAll("li")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /Adeleke Funmi/ }));
    expect(await screen.findByText("JC27-DLG-00002 · —")).toBeInTheDocument();
  });

  it("says when no one is found or the search can't reach the server", async () => {
    api({ lookup: [] });
    const first = wrap(<PrintDesk />);
    await find("nobody");
    expect(await screen.findByText(/No one found/)).toBeInTheDocument();
    first.unmount();

    api({ lookup: () => json({ message: "x" }, 500) });
    wrap(<PrintDesk />);
    await find("anyone");
    expect(await screen.findByText("Couldn’t search. Try again.")).toBeInTheDocument();
  });

  it("flags an unconfirmed registration and won't print it", async () => {
    api({ lookup: [card({ valid: false, status: "pending_verification" })] });
    wrap(<PrintDesk />);
    await find("JC27-DLG-48213");
    expect(await screen.findByText("Not confirmed")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Photo ID matches the name" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Phone ends in …7821" }));
    expect(screen.getByRole("button", { name: "Print badge" })).toBeDisabled();
  });

  it("sends a reprint to a supervisor when the desk can't override", async () => {
    api({ lookup: [card({ badge_printed_at: "2027-01-19T10:00:00+01:00" })] });
    wrap(<PrintDesk />);
    await find("JC27-DLG-48213");
    expect(await screen.findByText(/Badge already printed/)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Badge already printed/ })).not.toBeChecked();
    expect(await screen.findByText("A badge was already printed. Ask a supervisor to reprint it.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reprint badge" })).toBeDisabled();
  });

  it("lets a supervisor reprint once they say why", async () => {
    areas = ["desk", "scan", "override"];
    const f = api({ lookup: [card({ badge_printed_at: "2027-01-19T10:00:00+01:00" })] });
    wrap(<PrintDesk />);
    await find("JC27-DLG-48213");
    const why = await screen.findByLabelText("Why reprint?");
    fireEvent.click(screen.getByRole("checkbox", { name: "Photo ID matches the name" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Phone ends in …7821" }));
    expect(screen.getByRole("button", { name: "Reprint badge" })).toBeDisabled();

    fireEvent.change(why, { target: { value: "Torn by the rain" } });
    fireEvent.click(screen.getByRole("button", { name: "Reprint badge" }));
    await waitFor(() =>
      expect(printCalls(f)).toEqual([{ registration_id: 1, desk: "Print desk 1", reprint: true, reason: "Torn by the rain" }]),
    );
    expect(window.print).toHaveBeenCalled();
  });

  it("shows the server's reason when printing is refused", async () => {
    api({ print: () => json({ message: "A badge was already printed for this person." }, 409) });
    wrap(<PrintDesk />);
    await find("JC27-DLG-48213");
    await screen.findByText("Valid ticket");
    fireEvent.click(screen.getByRole("checkbox", { name: "Photo ID matches the name" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Phone ends in …7821" }));
    fireEvent.click(screen.getByRole("button", { name: "Print badge" }));
    expect(await screen.findByText("A badge was already printed for this person.")).toBeInTheDocument();
    expect(window.print).not.toHaveBeenCalled();
  });

  it("remembers the desk's name and place", async () => {
    api();
    wrap(<PrintDesk />);
    fireEvent.click(await screen.findByRole("button", { name: "Desk settings" }));
    fireEvent.change(await screen.findByLabelText("Desk name"), { target: { value: "Print desk 3" } });
    fireEvent.change(screen.getByLabelText("Location"), { target: { value: "Gate B" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(localStorage.getItem("jc27.desk.name")).toBe("Print desk 3");
    expect(await screen.findByText("Gate B · Printer ready")).toBeInTheDocument();
  });
});

describe("BadgeCard and helpers", () => {
  it("prints the name large over two lines with the category, church and a QR of the claim code", () => {
    render(<BadgeCard card={card({ category: "international" })} />);
    expect(screen.getByText("Jan. Conf 2027")).toBeInTheDocument();
    expect(screen.getByText("International")).toBeInTheDocument();
    expect(screen.getByText("Christ Life Assembly")).toBeInTheDocument();
    expect(screen.getByLabelText("Badge code JC27-DLG-48213")).toBeInTheDocument();
    expect(document.querySelector("[data-badge]")!.textContent).toContain("Adebayo");
    expect(document.querySelector("[data-badge]")!.textContent).toContain("Ogunleye");
  });

  it("summarises registered days", () => {
    expect(dayRange(["2027-01-24", "2027-01-19", "2027-01-21"])).toBe("19–24");
    expect(dayRange(["2027-01-22"])).toBe("22");
    expect(dayRange([])).toBe("—");
  });
});
