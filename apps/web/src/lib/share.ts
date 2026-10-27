/** Opens the phone's share sheet, or copies the link where there isn't one. Returns which happened. */
export async function shareLink(url: string, title: string): Promise<"shared" | "copied" | "failed"> {
  try {
    if (typeof navigator.share === "function") {
      await navigator.share({ title, url });
      return "shared";
    }
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch (e) {
    // Dismissing the share sheet is not an error worth reporting.
    if (e instanceof DOMException && e.name === "AbortError") return "shared";
    return "failed";
  }
}
