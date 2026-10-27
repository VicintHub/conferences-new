import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setDesktop } from "../../../vitest.setup";
import { MobileProfile } from "./MobileProfile";
import { SpeakersView } from "./SpeakersView";
import type { Speaker } from "./types";

const speakers: Speaker[] = [
  {
    slug: "samson",
    name: "Rev. Samson Ajetomobi",
    role: "President of MIV",
    short_role: "Host · President, MIV",
    group: "host",
    photo: "/images/photos/lp-host-1.webp",
    photo_mobile: null,
    bio: ["First paragraph.", "Second paragraph.", "Third."],
  },
  {
    slug: "stella",
    name: "Rev. Stellamaris Ajetomobi",
    role: "Vice-President of MIV",
    short_role: "Host · Vice-President, MIV",
    group: "host",
    photo: null,
    photo_mobile: null,
    bio: ["Stella bio."],
  },
  {
    slug: "poju",
    name: "Pastor Poju Oyemade",
    role: "Senior Pastor of TCN",
    short_role: "IMLC 2026",
    group: "imlc_2026",
    photo: null,
    photo_mobile: null,
    bio: ["Senior Pastor of TCN"],
  },
];

beforeEach(() => {
  window.history.replaceState(null, "", "/speakers");
  setDesktop(true);
});

// The view renders a phone list and a desktop grid; scope queries to the desktop one (md+).
const desktop = () => document.querySelector("div.hidden.md\\:block") as HTMLElement;

describe("SpeakersView", () => {
  it("groups hosts and past speakers and lists them on phones", () => {
    render(<SpeakersView speakers={speakers} />);
    expect(within(desktop()).getByRole("heading", { name: "Hosts" })).toBeInTheDocument();
    expect(within(desktop()).getByRole("heading", { name: "Ministered at IMLC 2026" })).toBeInTheDocument();
    expect(within(desktop()).getByText(/More speakers/)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Rev. Samson/ })[0]).toHaveAttribute("href", "/speakers/samson");
  });

  it("filters to hosts or past speakers", () => {
    render(<SpeakersView speakers={speakers} />);
    fireEvent.click(within(desktop()).getByRole("button", { name: "Hosts" }));
    expect(within(desktop()).queryByRole("heading", { name: "Ministered at IMLC 2026" })).not.toBeInTheDocument();
    fireEvent.click(within(desktop()).getByRole("button", { name: "IMLC 2026" }));
    expect(within(desktop()).queryByRole("heading", { name: "Hosts" })).not.toBeInTheDocument();
    expect(within(desktop()).getByText("Pastor Poju Oyemade")).toBeInTheDocument();
  });

  it("opens the profile drawer from Learn more, with the full bio, and closes it", () => {
    render(<SpeakersView speakers={speakers} />);
    fireEvent.click(within(desktop()).getAllByRole("link", { name: /Learn more/ })[0]);
    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText("HOST", { exact: false })).toBeInTheDocument();
    expect(within(drawer).getByText("First paragraph.")).toBeInTheDocument();
    expect(within(drawer).getByText("Third.")).toBeInTheDocument();
    expect(within(drawer).getByText("Ministering at")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/speakers/samson");
    fireEvent.click(within(drawer).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.location.pathname).toBe("/speakers");
  });

  it("opens straight onto a speaker for deep links", () => {
    render(<SpeakersView speakers={speakers} initialSlug="stella" />);
    expect(within(screen.getByRole("dialog")).getByText("Stella bio.")).toBeInTheDocument();
  });

  it("searches speakers on phones", () => {
    render(<SpeakersView speakers={speakers} />);
    fireEvent.click(screen.getByRole("button", { name: "Search speakers" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Search speakers" }), { target: { value: "poju" } });
    expect(screen.getAllByText("Pastor Poju Oyemade").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Rev. Samson Ajetomobi")).toHaveLength(0);
    fireEvent.change(screen.getByRole("textbox", { name: "Search speakers" }), { target: { value: "zzz" } });
    expect(screen.getAllByText("No speakers match.").length).toBeGreaterThan(0);
  });

  it("never opens the desktop drawer on phones (they use the profile page)", () => {
    setDesktop(false);
    render(<SpeakersView speakers={speakers} initialSlug="stella" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows initials when a speaker has no photo", () => {
    render(<SpeakersView speakers={speakers} />);
    expect(screen.getAllByRole("img", { name: "Pastor Poju Oyemade" })[0]).toHaveTextContent("PP");
  });
});

describe("MobileProfile", () => {
  it("expands the bio and shares the link", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    render(<MobileProfile speaker={speakers[0]} />);
    expect(screen.queryByText("Second paragraph.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Read more" }));
    expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show less" }));
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: "Rev. Samson Ajetomobi" }));
    expect(screen.getByRole("link", { name: "See sessions" })).toHaveAttribute("href", "/#schedule");
  });

  it("has no Read more for a one-paragraph bio", () => {
    render(<MobileProfile speaker={speakers[1]} />);
    expect(screen.queryByRole("button", { name: "Read more" })).not.toBeInTheDocument();
  });
});
