const API = () => process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/**
 * Server-side GET for public pages. Returns null if the API is down so a page can show its empty/error
 * state instead of failing the build or the request. Cached for a minute.
 */
export async function serverGet<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(`${API()}${path}`, { headers: { Accept: "application/json" }, next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
