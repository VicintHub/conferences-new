import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, middleware } from "./middleware";

const req = (path: string, cookie?: string) => new NextRequest(`http://localhost${path}`, { headers: cookie ? { cookie } : {} });

describe("app route guard", () => {
  it("redirects signed-out visitors to login, remembering where they were going", () => {
    const res = middleware(req("/app/pass"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login?next=%2Fapp%2Fpass");
  });
  it("lets signed-in visitors through", () => {
    expect(middleware(req("/app", "jc27_token=abc")).headers.get("location")).toBeNull();
  });
  it("guards the app, the console and the door tools, and nothing else", () => {
    expect(config.matcher).toEqual(["/app/:path*", "/admin", "/admin/:path*", "/desk", "/scan"]);
  });
});

describe("admin console guard", () => {
  it("sends signed-out staff to the staff sign-in, remembering the page", () => {
    const res = middleware(req("/admin/approvals"));
    expect(res.headers.get("location")).toBe("http://localhost/admin/login?next=%2Fadmin%2Fapprovals");
    expect(middleware(req("/admin")).headers.get("location")).toBe("http://localhost/admin/login");
  });

  it("needs the staff cookie: an attendee's cookie is not enough", () => {
    expect(middleware(req("/admin", "jc27_token=abc")).headers.get("location")).toContain("/admin/login");
    expect(middleware(req("/admin/registrants", "jc27_staff=abc")).headers.get("location")).toBeNull();
  });

  it("leaves the staff sign-in screens open", () => {
    expect(middleware(req("/admin/login")).headers.get("location")).toBeNull();
    expect(middleware(req("/admin/verify")).headers.get("location")).toBeNull();
  });

  it("does not let a staff cookie open the attendee app", () => {
    expect(middleware(req("/app", "jc27_staff=abc")).headers.get("location")).toContain("/login");
  });
});

describe("door tools guard", () => {
  it("sends signed-out staff to the staff sign-in and back to the tool", () => {
    expect(middleware(req("/scan")).headers.get("location")).toBe("http://localhost/admin/login?next=%2Fscan");
    expect(middleware(req("/desk")).headers.get("location")).toBe("http://localhost/admin/login?next=%2Fdesk");
  });

  it("needs the staff cookie, not an attendee's", () => {
    expect(middleware(req("/scan", "jc27_token=abc")).headers.get("location")).toContain("/admin/login");
    expect(middleware(req("/desk", "jc27_staff=abc")).headers.get("location")).toBeNull();
  });
});
