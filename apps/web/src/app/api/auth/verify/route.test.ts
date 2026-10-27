import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as verifyCode } from "./route";
import { POST as verifyLink } from "../verify-link/route";

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const req = (body: object = { email: "ade@example.com", code: "123456" }) =>
  new Request("http://localhost/api/auth/verify", { method: "POST", body: JSON.stringify(body) });

afterEach(() => vi.unstubAllGlobals());

describe("auth verify proxy", () => {
  it("moves the token into an httpOnly cookie and strips it from the body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        json(
          { data: { claim_code: "JC27-DLG-48213" }, meta: { token: "1|secret", downgraded_to_online: false, existing_account: false } },
          200,
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const res = await verifyCode(req());
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/auth\/verify$/);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta).toEqual({ downgraded_to_online: false, existing_account: false });
    expect(JSON.stringify(body)).not.toContain("secret");
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("jc27_token=1%7Csecret");
    expect(cookie.toLowerCase()).toContain("httponly");
  });

  it("uses the link endpoint for magic links", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ data: {}, meta: { token: "t" } }, 200));
    vi.stubGlobal("fetch", fetchMock);
    await verifyLink(req({ email: "ade@example.com", token: "x" }));
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/auth\/verify-link$/);
  });

  it("forwards API errors without setting a cookie", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(json({ message: "That code or link is incorrect or has expired.", code: "invalid_otp" }, 422)),
    );
    const res = await verifyCode(req());
    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe("invalid_otp");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("returns 502 when the API is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    expect((await verifyCode(req())).status).toBe(502);
  });
});
