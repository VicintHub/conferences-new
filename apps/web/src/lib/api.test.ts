import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "./api";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
afterEach(() => vi.unstubAllGlobals());

describe("apiFetch", () => {
  it("sends JSON headers for JSON bodies", async () => {
    const f = vi.fn().mockResolvedValue(json({ ok: true }));
    vi.stubGlobal("fetch", f);
    await apiFetch("/x", { base: "", method: "POST", body: JSON.stringify({ a: 1 }) });
    expect(f.mock.calls[0][1].headers).toMatchObject({ Accept: "application/json", "Content-Type": "application/json" });
  });

  it("leaves Content-Type unset for FormData so the browser adds the multipart boundary", async () => {
    const f = vi.fn().mockResolvedValue(json({ ok: true }));
    vi.stubGlobal("fetch", f);
    const form = new FormData();
    form.set("name", "Grace");
    await apiFetch("/x", { base: "", method: "POST", body: form });
    const headers = f.mock.calls[0][1].headers as Record<string, string>;
    expect(headers["Content-Type"]).toBeUndefined();
    expect(headers.Accept).toBe("application/json");
    expect(f.mock.calls[0][1].body).toBe(form);
  });

  it("turns API errors into ApiError with the code and field errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(json({ message: "Invalid", code: "invalid_otp", errors: { email: ["Bad email"] } }, 422)),
    );
    const err = (await apiFetch("/x", { base: "" }).catch((e) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 422, code: "invalid_otp", message: "Invalid" });
    expect(err.fieldErrors).toEqual({ email: "Bad email" });
  });

  it("reports an unreachable server as status 0", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(apiFetch("/x", { base: "" })).rejects.toMatchObject({ status: 0, code: "network" });
  });
});
