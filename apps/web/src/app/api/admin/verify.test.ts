import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as verify } from "./verify/route";
import { POST as verifyLink } from "./verify-link/route";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
afterEach(() => vi.unstubAllGlobals());

describe("staff sign-in handlers", () => {
  it("keeps the staff token in a short-lived httpOnly cookie and never returns it", async () => {
    const f = vi.fn().mockResolvedValue(json({ data: { name: "Kunle" }, meta: { token: "7|secret" } }));
    vi.stubGlobal("fetch", f);

    const res = await verify(
      new Request("http://localhost/api/admin/verify", {
        method: "POST",
        body: JSON.stringify({ email: "k@example.com", code: "123456" }),
      }),
    );

    expect(f.mock.calls[0][0]).toMatch(/\/admin\/auth\/verify$/);
    const cookie = res.cookies.get("jc27_staff");
    expect(cookie?.value).toBe("7|secret");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.maxAge).toBe(60 * 60 * 12);
    expect(res.cookies.get("jc27_token")).toBeUndefined();
    expect(JSON.stringify(await res.json())).not.toContain("secret");
  });

  it("uses the link endpoint for links, and sets nothing when the code is wrong", async () => {
    const f = vi.fn().mockResolvedValue(json({ message: "That code or link is incorrect or has expired." }, 422));
    vi.stubGlobal("fetch", f);
    const res = await verifyLink(new Request("http://localhost/api/admin/verify-link", { method: "POST", body: "{}" }));
    expect(f.mock.calls[0][0]).toMatch(/\/admin\/auth\/verify-link$/);
    expect(res.status).toBe(422);
    expect(res.cookies.get("jc27_staff")).toBeUndefined();
  });
});
