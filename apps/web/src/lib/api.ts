export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public body: Record<string, unknown> = {},
  ) {
    super(message);
  }

  /** Laravel validation errors keyed by field, if any. */
  get fieldErrors(): Record<string, string> {
    const errors = (this.body.errors ?? {}) as Record<string, string[]>;
    return Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v[0]]));
  }
}

export async function apiFetch<T>(path: string, init: RequestInit & { base?: string } = {}): Promise<T> {
  const { base = API_URL, headers, ...rest } = init;
  let res: Response;
  try {
    // FormData must go out without a Content-Type so the browser can add the multipart boundary.
    const isForm = typeof FormData !== "undefined" && rest.body instanceof FormData;
    res = await fetch(`${base}${path}`, {
      ...rest,
      headers: { Accept: "application/json", ...(isForm ? {} : { "Content-Type": "application/json" }), ...headers },
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0, "network");
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new ApiError((body.message as string) ?? "Something went wrong.", res.status, body.code as string | undefined, body);
  return body as T;
}
