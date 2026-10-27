import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Page documents (the app shell) are cached as they're visited, so the app opens with no signal.
 * Never cache a redirect: signed-out visitors are redirected to /login, and that response must not be
 * stored under the /app URL (the browser also refuses redirected responses for navigations).
 */
const pages = {
  matcher: ({ request, sameOrigin, url }: { request: Request; sameOrigin: boolean; url: URL }) =>
    sameOrigin &&
    request.method === "GET" &&
    !url.pathname.startsWith("/api/") &&
    (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html") === true),
  handler: new NetworkFirst({
    cacheName: "app-pages",
    networkTimeoutSeconds: 3,
    plugins: [
      {
        cacheWillUpdate: async ({ response }: { response: Response }) =>
          response.status === 200 && !response.redirected ? response : null,
      },
    ],
  }),
};

/**
 * Personal data (ticket, programme) is deliberately NOT cached here: the app keeps its own copy in
 * IndexedDB and clears it on sign-out, and every same-origin /api/* rule is dropped.
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [pages, ...defaultCache.filter((entry) => !String(entry.matcher).includes("api"))],
  fallbacks: { entries: [{ url: "/offline", matcher: ({ request }) => request.destination === "document" }] },
});

serwist.addEventListeners();
