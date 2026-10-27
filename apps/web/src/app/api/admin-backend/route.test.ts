import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PATCH, POST, PUT } from "./[...path]/route";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const req = (method: string, path: string, token?: string, body?: BodyInit) =>
  new NextRequest(`http://localhost/api/admin-backend/${path}`, { method, headers: token ? { cookie: `jc27_staff=${token}` } : {}, body });
const ctx = (path: string) => ({ params: Promise.resolve({ path: path.split("/") }) });
const handlers = { GET, POST, PATCH, PUT, DELETE };

afterEach(() => vi.unstubAllGlobals());

describe("admin proxy", () => {
  it("adds the staff token and calls the admin API", async () => {
    const f = vi.fn().mockResolvedValue(json({ data: {} }));
    vi.stubGlobal("fetch", f);
    expect((await GET(req("GET", "registrants?search=ade", "9|tok"), ctx("registrants"))).status).toBe(200);
    expect(f.mock.calls[0][0]).toMatch(/\/admin\/registrants\?search=ade$/);
    expect(f.mock.calls[0][1].headers.Authorization).toBe("Bearer 9|tok");
  });

  it("ignores the attendee cookie", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const r = new NextRequest("http://localhost/api/admin-backend/me", { headers: { cookie: "jc27_token=attendee" } });
    expect((await GET(r, ctx("me"))).status).toBe(401);
    expect(f).not.toHaveBeenCalled();
  });

  it("needs sign-in for everything except asking for a code", async () => {
    const f = vi.fn().mockResolvedValue(json({}, 202));
    vi.stubGlobal("fetch", f);
    for (const [method, path] of [
      ["GET", "overview"],
      ["GET", "approvals/reg-4"],
      ["POST", "approvals/app-9"],
      ["POST", "broadcasts"],
      ["PATCH", "staff/3"],
      ["DELETE", "publicity/5"],
      ["PUT", "settings/live"],
      ["GET", "applications/3/documents/4"],
      ["GET", "desk/lookup"],
      ["POST", "desk/print"],
      ["POST", "scans/batch"],
      ["GET", "scans/roster"],
      ["GET", "checkin"],
    ] as const) {
      expect((await handlers[method](req(method, path), ctx(path))).status, `${method} ${path}`).toBe(401);
    }
    expect(f).not.toHaveBeenCalled();
    expect((await POST(req("POST", "auth/otp", undefined, "{}"), ctx("auth/otp"))).status).toBe(202);
  });

  it("only forwards what the console uses", async () => {
    vi.stubGlobal("fetch", vi.fn());
    for (const [method, path] of [
      ["GET", "auth/verify"],
      ["DELETE", "staff/3"],
      ["GET", "approvals/nope"],
      ["POST", "orders/MV-1"],
      ["GET", "../me"],
      ["POST", "teams"],
      ["GET", "scans/batch"],
      ["POST", "scans/roster"],
      ["DELETE", "desk/print"],
    ] as const) {
      expect((await handlers[method](req(method, path, "t"), ctx(path))).status, `${method} ${path}`).toBe(404);
    }
  });

  it("streams downloads through with their file name", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("a,b\n1,2\n", {
          status: 200,
          headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="jan-conf-registrants.csv"' },
        }),
      ),
    );
    const res = await GET(req("GET", "registrants/export", "t"), ctx("registrants/export"));
    expect(res.headers.get("content-type")).toBe("text/csv");
    expect(res.headers.get("content-disposition")).toContain("jan-conf-registrants.csv");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await res.text()).toBe("a,b\n1,2\n");
  });

  it("passes uploads through as multipart", async () => {
    const f = vi.fn().mockResolvedValue(json({ data: {} }, 201));
    vi.stubGlobal("fetch", f);
    const form = new FormData();
    form.set("title", "Flyer");
    form.set("file", new Blob(["x"], { type: "image/png" }), "a.png");
    const request = new NextRequest("http://localhost/api/admin-backend/publicity", {
      method: "POST",
      headers: { cookie: "jc27_staff=t" },
      body: form,
    });
    expect((await POST(request, ctx("publicity"))).status).toBe(201);
    expect(f.mock.calls[0][1].headers["Content-Type"]).toMatch(/^multipart\/form-data; boundary=/);
  });

  it("clears the staff cookie when the token is refused or on sign-out", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(json({ message: "Unauthenticated." }, 401))
        .mockResolvedValueOnce(new Response(null, { status: 204 })),
    );
    const refused = await GET(req("GET", "me", "old"), ctx("me"));
    expect(refused.status).toBe(401);
    expect(refused.cookies.get("jc27_staff")?.value).toBe("");
    const out = await POST(req("POST", "auth/logout", "t"), ctx("auth/logout"));
    expect(out.status).toBe(204);
    expect(out.cookies.get("jc27_staff")?.value).toBe("");
  });
});
