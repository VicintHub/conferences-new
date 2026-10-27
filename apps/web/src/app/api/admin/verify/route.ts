import { proxyVerify } from "@/lib/server/auth-proxy";

export const POST = (request: Request) => proxyVerify(request, "/admin/auth/verify");
