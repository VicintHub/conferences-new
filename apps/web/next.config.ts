import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // The dev-only kitchen sink lives under a %5F-encoded route folder whose chunk URL the server rejects (400),
  // and one bad precache entry fails the whole service worker install.
  exclude: [/\.map$/, /^manifest.*\.js$/, /kitchen-sink/],
});

const nextConfig: NextConfig = {};

export default withSerwist(nextConfig);
