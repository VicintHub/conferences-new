import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PATCH, POST, PUT } from "./[...path]/route";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const req = (method: string, path: string, token?: string, body?: object) =>
  new NextRequest(`http://localhost/api/backend/${path}`, {
    method,
    headers: token ? { cookie: `jc27_token=${token}` } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
const ctx = (path: string) => ({ params: Promise.resolve({ path: path.split("/") }) });

afterEach(() => vi.unstubAllGlobals());
const handlers = { GET, POST, DELETE, PATCH, PUT };

describe("backend proxy", () => {
  it("adds the bearer token from the cookie", async () => {
    const f = vi.fn().mockResolvedValue(json({ data: { claim_code: "X" } }));
    vi.stubGlobal("fetch", f);
    const res = await GET(req("GET", "me", "1|abc"), ctx("me"));
    expect(res.status).toBe(200);
    expect(f.mock.calls[0][0]).toMatch(/\/me$/);
    expect(f.mock.calls[0][1].headers.Authorization).toBe("Bearer 1|abc");
  });

  it("refuses private paths without a cookie, but serves the public programme", async () => {
    const f = vi.fn().mockResolvedValue(json({ data: [] }));
    vi.stubGlobal("fetch", f);
    expect((await GET(req("GET", "me"), ctx("me"))).status).toBe(401);
    expect(f).not.toHaveBeenCalled();
    expect((await GET(req("GET", "programme"), ctx("programme"))).status).toBe(200);
    expect(f.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("only exposes allow-listed method and path pairs", async () => {
    vi.stubGlobal("fetch", vi.fn());
    expect((await GET(req("GET", "auth/verify", "t"), ctx("auth/verify"))).status).toBe(404);
    expect((await POST(req("POST", "me", "t"), ctx("me"))).status).toBe(404);
    expect((await GET(req("GET", "registrations", "t"), ctx("registrations"))).status).toBe(404);
  });

  it("lets guests read and submit testimonies, passing the query string and multipart body through", async () => {
    const f = vi.fn().mockResolvedValue(json({ data: [] }));
    vi.stubGlobal("fetch", f);
    expect((await GET(req("GET", "testimonies?tag=Healing"), ctx("testimonies"))).status).toBe(200);
    expect(f.mock.calls[0][0]).toMatch(/\/testimonies\?tag=Healing$/);
    expect(f.mock.calls[0][1].headers.Authorization).toBeUndefined();

    const form = new FormData();
    form.set("type", "write");
    const post = new NextRequest("http://localhost/api/backend/testimonies", { method: "POST", body: form });
    expect((await POST(post, ctx("testimonies"))).status).toBe(200);
    expect(f.mock.calls[1][1].headers["Content-Type"]).toMatch(/^multipart\/form-data; boundary=/);
  });

  it("requires a session for Amen, feedback and the survey", async () => {
    const f = vi.fn().mockResolvedValue(json({ data: {} }));
    vi.stubGlobal("fetch", f);
    expect((await PUT(req("PUT", "testimonies/5/amen"), ctx("testimonies/5/amen"))).status).toBe(401);
    expect((await DELETE(req("DELETE", "testimonies/5/amen"), ctx("testimonies/5/amen"))).status).toBe(401);
    expect((await POST(req("POST", "sessions/3/feedback"), ctx("sessions/3/feedback"))).status).toBe(401);
    expect((await GET(req("GET", "survey"), ctx("survey"))).status).toBe(401);
    expect(f).not.toHaveBeenCalled();
    expect((await PUT(req("PUT", "testimonies/5/amen", "t"), ctx("testimonies/5/amen"))).status).toBe(200);
    expect((await GET(req("GET", "testimonies/abc/amen", "t"), ctx("testimonies/abc/amen"))).status).toBe(404);
  });

  it("does not drop a guest's cookie-less 401 handling (no cookie to delete)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ message: "no" }, 401)));
    const res = await POST(req("POST", "testimonies"), ctx("testimonies"));
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("forwards PATCH bodies", async () => {
    const f = vi.fn().mockResolvedValue(json({ data: { mode: "online" } }));
    vi.stubGlobal("fetch", f);
    const res = await PATCH(req("PATCH", "me/registration", "t", { mode: "online" }), ctx("me/registration"));
    expect(res.status).toBe(200);
    expect(JSON.parse(new TextDecoder().decode(f.mock.calls[0][1].body))).toEqual({ mode: "online" });
  });

  it("ends the session when the API rejects the token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ message: "Unauthenticated." }, 401)));
    const res = await GET(req("GET", "me", "stale"), ctx("me"));
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toMatch(/jc27_token=;/);
  });

  it("clears the cookie on sign-out and passes a 204 through", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const res = await POST(req("POST", "auth/logout", "t"), ctx("auth/logout"));
    expect(res.status).toBe(204);
    expect(res.headers.get("set-cookie")).toMatch(/jc27_token=;/);
  });

  it("returns 502 when the API is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    expect((await GET(req("GET", "me", "t"), ctx("me"))).status).toBe(502);
  });

  it("lets guests browse the shop and check out, but keeps the pass and order history private", async () => {
    const f = vi.fn().mockResolvedValue(json({ data: [] }));
    vi.stubGlobal("fetch", f);
    expect((await GET(req("GET", "shop/products"), ctx("shop/products"))).status).toBe(200);
    expect((await GET(req("GET", "shop/products/conference-tee"), ctx("shop/products/conference-tee"))).status).toBe(200);
    expect((await POST(req("POST", "shop/checkout"), ctx("shop/checkout"))).status).toBe(200);
    expect((await POST(req("POST", "shop/orders/MV-00012/verify?k=abc"), ctx("shop/orders/MV-00012/verify"))).status).toBe(200);
    expect(f.mock.calls.every((c) => c[1].headers.Authorization === undefined)).toBe(true);
    f.mockClear();
    expect((await GET(req("GET", "me/orders"), ctx("me/orders"))).status).toBe(401);
    expect((await POST(req("POST", "shop/orders/MV-00012/attach"), ctx("shop/orders/MV-00012/attach"))).status).toBe(401);
    expect(f).not.toHaveBeenCalled();
  });

  it("keeps teams and applications behind sign-in and exposes only the routes the app uses", async () => {
    const f = vi.fn().mockResolvedValue(json({ data: [] }));
    vi.stubGlobal("fetch", f);
    for (const [method, path] of [
      ["GET", "me/teams/church"],
      ["POST", "me/teams/minister/members"],
      ["POST", "me/teams/church/members/import"],
      ["DELETE", "me/teams/church/members/4"],
      ["POST", "teams/CLA-7Q4K/join"],
      ["GET", "me/applications"],
      ["POST", "me/applications/3/documents"],
    ] as const) {
      expect((await handlers[method](req(method, path), ctx(path))).status, `${method} ${path} without a cookie`).toBe(401);
    }
    expect(f).not.toHaveBeenCalled();

    expect((await POST(req("POST", "me/applications", "1|abc"), ctx("me/applications"))).status).toBe(200);
    expect(f.mock.calls[0][1].headers.Authorization).toBe("Bearer 1|abc");

    // Not part of the app's vocabulary: unknown kinds, bad codes, member import for minister teams.
    expect((await GET(req("GET", "me/teams/other", "t"), ctx("me/teams/other"))).status).toBe(404);
    expect((await POST(req("POST", "teams/lowercase/join", "t"), ctx("teams/lowercase/join"))).status).toBe(404);
    expect((await POST(req("POST", "me/teams/minister/members/import", "t"), ctx("me/teams/minister/members/import"))).status).toBe(404);
    expect((await GET(req("GET", "me/applications/3", "t"), ctx("me/applications/3"))).status).toBe(404);
  });

  it("keeps the live stream and travel details for signed-in attendees", async () => {
    const f = vi.fn().mockResolvedValue(json({ data: {} }));
    vi.stubGlobal("fetch", f);
    for (const [method, path] of [
      ["GET", "live"],
      ["POST", "live/heartbeat"],
      ["POST", "sessions/4/remind"],
      ["DELETE", "sessions/4/remind"],
      ["GET", "travel"],
    ] as const) {
      expect((await handlers[method](req(method, path), ctx(path))).status, `${method} ${path} without a cookie`).toBe(401);
    }
    expect(f).not.toHaveBeenCalled();
    expect((await GET(req("GET", "live", "1|abc"), ctx("live"))).status).toBe(200);
    expect(f.mock.calls[0][1].headers.Authorization).toBe("Bearer 1|abc");
    expect((await PUT(req("PUT", "live", "1|abc"), ctx("live"))).status).toBe(404);
  });
});
