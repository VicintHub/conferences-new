"use client";

import { useAdminMe } from "./api";
import { Overview } from "./Overview";

/** Overview with the buttons this role is allowed to use. */
export function AdminOverview() {
  const me = useAdminMe();
  const areas = me.data?.data.areas ?? [];
  return <Overview canBroadcast={areas.includes("broadcasts")} canExport={areas.includes("registrants")} />;
}
