import { cn } from "@/lib/cn";
import { initials } from "@/lib/time";
import { categoryName, type TeamMember } from "./types";

const tones = ["bg-cobalt-100", "bg-cream-100", "bg-brick-100"];

export function MemberAvatar({ name, index, size = 44, className }: { name: string; index: number; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={cn(
        "flex flex-none items-center justify-center rounded-full font-display font-bold text-cobalt-900",
        size < 40 ? "text-xs" : "text-sm",
        tones[index % 3],
        className,
      )}
    >
      {initials(name.replace(/^(Pastor|Deacon|Rev\.?|Dr\.?|Mr\.?|Mrs\.?)\s+/i, ""))}
    </span>
  );
}

export function StatusPill({ status }: { status: TeamMember["status"] }) {
  return (
    <span
      className={cn(
        "flex-none rounded-full px-2.5 py-1 text-xs font-bold leading-none",
        status === "confirmed" ? "bg-success-100 text-success-600" : "bg-warning-100 text-warning-600",
      )}
    >
      {status === "confirmed" ? "Confirmed" : "Invited"}
    </span>
  );
}

export const modeName = (m: TeamMember["mode"]) => (m === "online" ? "Online" : "Onsite");

/** "Team leader · Onsite", "Delegate · Online" (design 9a). */
export function memberSubtitle(m: TeamMember) {
  const who = m.role === "leader" ? "Team leader" : m.category ? categoryName[m.category] : m.role_label;
  return `${who} · ${modeName(m.mode)}`;
}
