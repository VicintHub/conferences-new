import { track } from "./api";
import type { PublicityItem, PublicitySize } from "./types";

export type PlatformId = "whatsapp-chat" | "whatsapp-group" | "whatsapp-status" | "facebook" | "instagram" | "youtube" | "x" | "copy-link";

// Lucide-style 24px stroke paths, from the design.
const ICON = {
  wa: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z",
  grp: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  st: "M12 2a10 10 0 1 0 10 10M12 7v5l3 3",
  fb: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
  ig: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zM16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4zM17.5 6.5h.01",
  yt: "M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17M10 15l5-3-5-3z",
  x: "M4 4l16 16M20 4 4 20",
  link: "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7",
};

export const platforms: { id: PlatformId; label: string; path: string }[] = [
  { id: "whatsapp-chat", label: "WhatsApp chat", path: ICON.wa },
  { id: "whatsapp-group", label: "WhatsApp group", path: ICON.grp },
  { id: "whatsapp-status", label: "WhatsApp status", path: ICON.st },
  { id: "facebook", label: "Facebook", path: ICON.fb },
  { id: "instagram", label: "Instagram", path: ICON.ig },
  { id: "youtube", label: "YouTube", path: ICON.yt },
  { id: "x", label: "X (Twitter)", path: ICON.x },
  { id: "copy-link", label: "Copy link", path: ICON.link },
];

/** The six shown as icons in the desktop panel (design 18a). */
export const quickPlatforms = platforms.filter((p) =>
  ["whatsapp-chat", "whatsapp-status", "facebook", "instagram", "youtube", "x"].includes(p.id),
);

const enc = encodeURIComponent;
export const links = {
  whatsapp: (text: string) => `https://wa.me/?text=${enc(text)}`,
  facebook: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
  x: (text: string, url: string) => `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`,
};

export const itemUrl = (item: PublicityItem) => `${window.location.origin}/publicity/${item.slug}`;

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / insecure origins: fall back to a hidden textarea.
    const ta = Object.assign(document.createElement("textarea"), { value: text });
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

const extension = (url: string) => url.split("?")[0].split(".").pop() ?? "jpg";
const filename = (item: PublicityItem, size: PublicitySize) => `${item.slug}-${size.key}.${extension(size.url)}`;

async function toFile(item: PublicityItem, size: PublicitySize): Promise<File> {
  const blob = await (await fetch(size.url)).blob();
  return new File([blob], filename(item, size), { type: blob.type });
}

/** Saves one size. Goes through a blob so it also works for files served from another origin. */
export async function downloadSize(item: PublicityItem, size: PublicitySize) {
  const file = await toFile(item, size);
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement("a"), { href: url, download: file.name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  track(item.slug, "download");
}

export async function downloadAll(item: PublicityItem) {
  for (const size of item.sizes) {
    await downloadSize(item, size);
    await new Promise((r) => setTimeout(r, 350)); // browsers drop back-to-back downloads
  }
}

/** Web Share API level 2: hands the actual image to the phone's share sheet. */
export async function nativeShareFile(
  item: PublicityItem,
  size: PublicitySize,
  text: string,
): Promise<"shared" | "cancelled" | "unsupported"> {
  try {
    const file = await toFile(item, size);
    if (!navigator.canShare?.({ files: [file] })) return "unsupported";
    await navigator.share({ files: [file], text, title: item.title });
    return "shared";
  } catch (e) {
    return e instanceof DOMException && e.name === "AbortError" ? "cancelled" : "unsupported";
  }
}

/** Runs one platform's share action. Returns a short message to show the user (or nothing). */
export async function sharePlatform(id: PlatformId, item: PublicityItem, size: PublicitySize): Promise<string | undefined> {
  const url = itemUrl(item);
  const text = item.caption;
  track(item.slug, "share");

  switch (id) {
    case "whatsapp-chat":
    case "whatsapp-group":
    case "instagram": {
      const r = await nativeShareFile(item, size, text);
      if (r === "shared" || r === "cancelled") return undefined;
      if (id === "instagram") {
        await downloadSize(item, size);
        return "Saved to your device. Open Instagram and post it from your gallery.";
      }
      window.open(links.whatsapp(`${text}\n${url}`), "_blank", "noopener");
      return undefined;
    }
    case "whatsapp-status": {
      // WhatsApp has no web link for Status, so save the image and point the way.
      const status = item.sizes.find((s) => s.key === "status") ?? size;
      await downloadSize(item, status);
      return "Saved. Open WhatsApp → Status and choose the image.";
    }
    case "facebook":
      window.open(links.facebook(url), "_blank", "noopener");
      return undefined;
    case "x":
      window.open(links.x(text, url), "_blank", "noopener");
      return undefined;
    case "youtube":
      await copyText(url);
      return "Link copied. Paste it in your YouTube post.";
    case "copy-link":
      await copyText(url);
      return "Link copied.";
  }
}
