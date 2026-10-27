import { NextResponse, type NextRequest } from "next/server";

const API = () => process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const STAFF_COOKIE = "jc27_staff";

/**
 * [method, path pattern, needs a signed-in staff member]. The API enforces each person's role on every call;
 * this list only keeps the proxy from forwarding anything the console doesn't use.
 */
const ALLOWED: [method: string, pattern: RegExp, auth: boolean][] = [
  ["POST", /^auth\/otp$/, false],
  ["POST", /^auth\/logout$/, true],
  ["GET", /^(me|overview|settings|staff|teams|testimonies|publicity|broadcasts|checkin)$/, true],
  // Print desk and scanner.
  ["GET", /^desk\/(lookup|summary)$/, true],
  ["POST", /^desk\/print$/, true],
  ["POST", /^scans\/batch$/, true],
  ["GET", /^scans\/roster$/, true],
  ["GET", /^(registrants|orders|approvals)$/, true],
  ["GET", /^registrants\/export$/, true],
  ["GET", /^approvals\/(reg|app)-\d+$/, true],
  ["POST", /^approvals\/(reg|app)-\d+$/, true],
  ["GET", /^applications\/\d+\/documents\/\d+$/, true],
  ["PATCH", /^orders\/MV-\d+$/, true],
  ["POST", /^testimonies\/\d+$/, true],
  ["POST", /^publicity$/, true],
  ["PATCH", /^publicity\/\d+$/, true],
  ["DELETE", /^publicity\/\d+$/, true],
  ["POST", /^broadcasts$/, true],
  ["POST", /^broadcasts\/(preview|test)$/, true],
  ["POST", /^broadcasts\/\d+\/cancel$/, true],
  ["PUT", /^settings\/live$/, true],
  ["POST", /^replays$/, true],
  ["PATCH", /^replays\/\d+$/, true],
  ["DELETE", /^replays\/\d+$/, true],
  ["POST", /^staff$/, true],
  ["PATCH", /^staff\/\d+$/, true],
];

/** Backend-for-frontend for the admin console, with its own httpOnly cookie so staff and attendee sessions never mix. */
async function handle(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/");
  const rule = ALLOWED.find(([m, re]) => m === request.method && re.test(path));
  if (!rule) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const token = request.cookies.get(STAFF_COOKIE)?.value;
  if (rule[2] && !token) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });

  const hasBody = !["GET", "HEAD"].includes(request.method);
  let upstream: Response;
  try {
    upstream = await fetch(`${API()}/admin/${path}${request.nextUrl.search}`, {
      method: request.method,
      headers: {
        Accept: "application/json",
        "Content-Type": request.headers.get("content-type") ?? "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "Can't reach the server.", code: "network" }, { status: 502 });
  }

  // Downloads (the registrants CSV, applicants' documents) stream through untouched.
  const type = upstream.headers.get("content-type") ?? "";
  let res: NextResponse;
  if (upstream.ok && !type.includes("application/json") && upstream.status !== 204) {
    res = new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": type,
        "Content-Disposition": upstream.headers.get("content-disposition") ?? "attachment",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } else {
    res =
      upstream.status === 204
        ? new NextResponse(null, { status: 204 })
        : NextResponse.json(await upstream.json().catch(() => ({})), { status: upstream.status });
  }
  if ((upstream.status === 401 && token) || path === "auth/logout") res.cookies.delete(STAFF_COOKIE);
  return res;
}

export { handle as DELETE, handle as GET, handle as PATCH, handle as POST, handle as PUT };
