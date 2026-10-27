import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setDesktop } from "../../../vitest.setup";
import { ItemView } from "./ItemView";
import { AppLibrary, PublicLibrary } from "./Library";
import type { PublicityItem, PublicityList } from "./types";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const flyer: PublicityItem = {
  slug: "official-flyer",
  title: "Official flyer",
  type: "flyer",
  meta: "Square · Status · Print",
  ratio: "16/9",
  preview: "/images/publicity/flyer-preview.jpg",
  is_video: false,
  caption: "The 37th IMLC & IYLC holds 19–24 January 2027. #JanConf2027",
  new: true,
  published_at: null,
  sizes: [
    { key: "square", label: "Square", dims: "1080×1080", url: "/s.jpg" },
    { key: "status", label: "Status", dims: "1080×1920", url: "/t.jpg" },
    { key: "print", label: "Print", dims: "A4", url: "/p.jpg" },
  ],
};
const logo: PublicityItem = {
  ...flyer,
  slug: "logo-pack",
  title: "Logo pack",
  type: "logo",
  meta: "PNG",
  new: false,
  sizes: [{ key: "png", label: "PNG", dims: "225×225", url: "/l.png" }],
};
const list = (items = [flyer, logo]): PublicityList => ({
  data: items,
  meta: {
    types: { flyer: "Flyers", status: "Status", video: "Videos", design: "Designs", logo: "Logos" },
    new_count: items.filter((i) => i.new).length,
  },
});

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })}>
      {ui}
    </QueryClientProvider>,
  );

let anchors: string[];
beforeEach(() => {
  anchors = [];
  setDesktop(false);
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    anchors.push(this.download);
  });
  Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const api = (extra?: (url: string, init?: RequestInit) => Response | undefined) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const custom = extra?.(url, init);
      if (custom) return custom;
      if (/\/publicity\/official-flyer$/.test(url)) return json({ data: flyer });
      if (/\/publicity(\?type=\w+)?$/.test(url)) return json(list());
      if (/\/track$/.test(url)) return json({}, 204);
      return {
        ok: true,
        status: 200,
        blob: async () => new Blob(["img"], { type: "image/jpeg" }),
        json: async () => ({}),
      } as unknown as Response;
    }),
  );

describe("ItemView", () => {
  it("shows the item with sizes and the caption, and downloads the chosen size", async () => {
    api();
    wrap(<ItemView slug="official-flyer" backHref="/app/publicity" />);
    expect(await screen.findByRole("heading", { name: "Official flyer" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Square/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(flyer.caption)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /Status/ }));
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() => expect(anchors).toEqual(["official-flyer-status.jpg"]));
  });

  it("copies the caption when the share sheet opens and lists every platform", async () => {
    api();
    wrap(<ItemView slug="official-flyer" backHref="/app/publicity" />);
    fireEvent.click(await screen.findByRole("button", { name: "Share" }));
    const sheet = await screen.findByRole("dialog");
    expect(await within(sheet).findByText("Caption copied")).toBeInTheDocument();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(flyer.caption);
    for (const p of [
      "WhatsApp chat",
      "WhatsApp group",
      "WhatsApp status",
      "Facebook",
      "Instagram",
      "YouTube",
      "X (Twitter)",
      "Copy link",
    ]) {
      expect(within(sheet).getByRole("button", { name: p })).toBeInTheDocument();
    }
    fireEvent.click(within(sheet).getByRole("button", { name: "Copy link" }));
    expect(await within(sheet).findByRole("status")).toHaveTextContent("Link copied.");
  });

  it("copies the caption from the Copy button", async () => {
    api();
    wrap(<ItemView slug="official-flyer" backHref="/app/publicity" />);
    fireEvent.click(await screen.findByRole("button", { name: /Copy/ }));
    expect(await screen.findByText("Copied")).toBeInTheDocument();
  });

  it("offers a retry when the item can't be loaded", async () => {
    api((url) => (/official-flyer$/.test(url) ? json({ message: "x" }, 500) : undefined));
    wrap(<ItemView slug="official-flyer" backHref="/app/publicity" />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn’t load/i);
  });
});

describe("AppLibrary", () => {
  it("shows the new-items banner and filters by type through the API", async () => {
    api();
    wrap(<AppLibrary />);
    expect(await screen.findByText("1 new")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Official flyer/ })).toHaveAttribute("href", "/app/publicity/official-flyer");
    fireEvent.click(screen.getByRole("button", { name: "Logos" }));
    await waitFor(() =>
      expect((fetch as ReturnType<typeof vi.fn>).mock.calls.some(([u]) => String(u).endsWith("/publicity?type=logo"))).toBe(true),
    );
  });
});

describe("PublicLibrary", () => {
  it("on desktop, selecting a card updates the side panel and Download all saves every size", async () => {
    setDesktop(true);
    api();
    wrap(<PublicLibrary initial={list()} />);
    const panel = () => screen.getByRole("complementary");
    expect(within(panel()).getByRole("heading", { name: "Official flyer" })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("link", { name: /Logo pack/ })[1]);
    expect(within(panel()).getByRole("heading", { name: "Logo pack" })).toBeInTheDocument();
    expect(within(panel()).getByRole("button", { name: "Download" })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("link", { name: /Official flyer/ })[1]);
    fireEvent.click(within(panel()).getByRole("button", { name: "Download all sizes" }));
    await waitFor(() => expect(anchors).toHaveLength(3), { timeout: 3000 });
  });

  it("on phones, cards link to the item page", () => {
    api();
    wrap(<PublicLibrary initial={list()} />);
    expect(screen.getAllByRole("link", { name: /Official flyer/ })[0]).toHaveAttribute("href", "/publicity/official-flyer");
  });

  it("shows an empty state", async () => {
    api((url) => (/\/publicity(\?type=\w+)?$/.test(url) ? json(list([])) : undefined));
    wrap(<PublicLibrary initial={list([])} />);
    expect(screen.getAllByText(/Nothing here yet/).length).toBeGreaterThan(0);
  });
});
