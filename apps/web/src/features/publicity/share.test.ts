import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadAll, links, sharePlatform } from "./share";
import type { PublicityItem } from "./types";

const item: PublicityItem = {
  slug: "official-flyer",
  title: "Official flyer",
  type: "flyer",
  meta: null,
  ratio: "1/1",
  preview: "/p.jpg",
  is_video: false,
  caption: "Join us 19–24 January! #JanConf2027",
  new: true,
  published_at: null,
  sizes: [
    { key: "square", label: "Square", dims: "1080×1080", url: "/images/publicity/flyer-square.jpg" },
    { key: "status", label: "Status", dims: "1080×1920", url: "/images/publicity/flyer-status.jpg" },
  ],
};

let calls: string[];
let anchors: string[];

beforeEach(() => {
  calls = [];
  anchors = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? "GET"} ${url}`);
      // jsdom's File rejects Node's Blob, so hand back a jsdom Blob.
      return {
        ok: true,
        status: 200,
        blob: async () => new Blob(["img"], { type: "image/jpeg" }),
        json: async () => ({}),
      } as unknown as Response;
    }),
  );
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    anchors.push(this.download);
  });
  vi.stubGlobal("open", vi.fn());
  Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true });
  Object.defineProperty(navigator, "canShare", { value: undefined, configurable: true });
  Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const tracked = () => calls.some((c) => c.startsWith("POST") && c.endsWith("/track"));

describe("deep links", () => {
  it("encodes captions and URLs", () => {
    expect(links.whatsapp("Join us! #a b")).toBe("https://wa.me/?text=Join%20us!%20%23a%20b");
    expect(links.facebook("https://x.test/a?b=1")).toBe("https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fx.test%2Fa%3Fb%3D1");
    expect(links.x("hi there", "https://x.test")).toBe("https://twitter.com/intent/tweet?text=hi%20there&url=https%3A%2F%2Fx.test");
  });
});

describe("sharePlatform", () => {
  it("opens Facebook's sharer with the item page and counts the share", async () => {
    await sharePlatform("facebook", item, item.sizes[0]);
    expect(window.open).toHaveBeenCalledWith(expect.stringContaining("facebook.com/sharer"), "_blank", "noopener");
    expect(decodeURIComponent((window.open as ReturnType<typeof vi.fn>).mock.calls[0][0])).toContain("/publicity/official-flyer");
    expect(tracked()).toBe(true);
  });

  it("opens X with the caption", async () => {
    await sharePlatform("x", item, item.sizes[0]);
    expect(decodeURIComponent((window.open as ReturnType<typeof vi.fn>).mock.calls[0][0])).toContain("Join us 19–24 January! #JanConf2027");
  });

  it("hands the real image to the phone's share sheet when files are supported (WhatsApp)", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "canShare", { value: () => true, configurable: true });
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    expect(await sharePlatform("whatsapp-chat", item, item.sizes[0])).toBeUndefined();
    const arg = share.mock.calls[0][0];
    expect(arg.files[0]).toBeInstanceOf(File);
    expect(arg.files[0].name).toBe("official-flyer-square.jpg");
    expect(arg.text).toBe(item.caption);
    expect(window.open).not.toHaveBeenCalled();
  });

  it("falls back to a wa.me link when file sharing isn't available", async () => {
    await sharePlatform("whatsapp-group", item, item.sizes[0]);
    const url = decodeURIComponent((window.open as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(url).toContain("https://wa.me/?text=");
    expect(url).toContain(item.caption);
    expect(url).toContain("/publicity/official-flyer");
  });

  it("does nothing more if the user dismisses the share sheet", async () => {
    Object.defineProperty(navigator, "canShare", { value: () => true, configurable: true });
    Object.defineProperty(navigator, "share", {
      value: vi.fn().mockRejectedValue(new DOMException("x", "AbortError")),
      configurable: true,
    });
    await sharePlatform("whatsapp-chat", item, item.sizes[0]);
    expect(window.open).not.toHaveBeenCalled();
    expect(anchors).toEqual([]);
  });

  it("WhatsApp status saves the status-sized image and explains the next step", async () => {
    const msg = await sharePlatform("whatsapp-status", item, item.sizes[0]);
    expect(anchors).toEqual(["official-flyer-status.jpg"]);
    expect(msg).toMatch(/Open WhatsApp/);
  });

  it("Instagram falls back to saving the image", async () => {
    const msg = await sharePlatform("instagram", item, item.sizes[0]);
    expect(anchors).toEqual(["official-flyer-square.jpg"]);
    expect(msg).toMatch(/Instagram/);
  });

  it("YouTube and copy-link copy the item link", async () => {
    expect(await sharePlatform("copy-link", item, item.sizes[0])).toBe("Link copied.");
    expect(await sharePlatform("youtube", item, item.sizes[0])).toMatch(/Link copied/);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining("/publicity/official-flyer"));
  });
});

describe("downloads", () => {
  it("downloads every size, one after another, and counts each", async () => {
    await downloadAll(item);
    expect(anchors).toEqual(["official-flyer-square.jpg", "official-flyer-status.jpg"]);
    expect(calls.filter((c) => c.startsWith("POST") && c.endsWith("/track"))).toHaveLength(2);
  });
});
