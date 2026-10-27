"use client";

import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";
import { AppSubHeader } from "@/features/app/AppSubHeader";
import { useMe } from "@/features/app/queries";
import { ErrorNote, SkeletonBlock } from "@/features/app/ui";
import { cn } from "@/lib/cn";
import { useCreateTeam, useTeam } from "./api";
import { ManageSheet } from "./ManageSheet";
import { MemberSheet } from "./MemberForm";
import { MemberAvatar, StatusPill } from "./parts";
import type { TeamMember } from "./types";

/** Minister's team (design 9c): a verified minister adds a spouse and up to three aides. */
export function MinistersTeam() {
  const q = useTeam("minister");
  const { me } = useMe();
  const create = useCreateTeam("minister");
  const [adding, setAdding] = useState<"spouse" | "aide" | null>(null);
  const [managing, setManaging] = useState<TeamMember | null>(null);

  if (q.isError)
    return (
      <div className="p-5 pt-[60px]">
        <ErrorNote onRetry={() => q.refetch()} />
      </div>
    );
  if (q.isPending || !me)
    return (
      <div className="flex flex-col gap-4 px-5 pt-[60px]" aria-busy="true">
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-40" />
      </div>
    );

  const { data: team, meta } = q.data;
  const header = <AppSubHeader title="Minister’s team" backHref="/app/team" />;

  if (!team) {
    return (
      <div className="flex flex-col gap-4 lg:mx-auto lg:w-full lg:max-w-[560px]">
        {header}
        <section className="mx-5 flex flex-col gap-3 rounded-[24px] border border-ink-100 bg-white p-5">
          {!meta.is_minister ? (
            <>
              <h2 className="text-lg font-bold text-ink-900">For ministers</h2>
              <p className="text-sm leading-[1.5] text-ink-500">
                Minister’s teams are for registered ministers. If you’re bringing a group from your church, start a regular team instead.
              </p>
              <Button href="/app/team" variant="outline" fullWidth>
                Go to My team
              </Button>
            </>
          ) : !meta.minister_verified ? (
            <>
              <h2 className="text-lg font-bold text-ink-900">We’re verifying you</h2>
              <p className="text-sm leading-[1.5] text-ink-500">
                The committee checks every minister’s registration. Once you’re verified you can add your spouse and aides here, and we’ll
                let you know.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-ink-900">Set up your team</h2>
              <p className="text-sm leading-[1.5] text-ink-500">
                Add your spouse and up to 3 aides. Each gets their own ticket and is seated with you.
              </p>
              <Button size="lg" fullWidth disabled={create.isPending || !meta.can_create} onClick={() => create.mutate("")}>
                {create.isPending ? "Setting up…" : "Set up my team"}
              </Button>
              {!meta.can_create && (
                <p className="text-sm text-ink-400">You’re already part of another team, so you can’t start this one.</p>
              )}
            </>
          )}
        </section>
      </div>
    );
  }

  const spouse = team.members.find((m) => m.role === "spouse");
  const aides = team.members.filter((m) => m.role === "aide");
  const open = (m: TeamMember) => (team.is_leader ? setManaging(m) : undefined);

  return (
    <div className="flex flex-col gap-5 pb-10 lg:mx-auto lg:w-full lg:max-w-[560px]">
      {header}
      <section className="mx-5 flex items-center gap-4 rounded-[24px] border border-ink-100 bg-white p-5">
        <MemberAvatar name={me.attendee.full_name} index={0} size={64} className="text-xl" />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-lg font-bold text-ink-900">{me.attendee.full_name}</span>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-success-600">
            <Check size={16} strokeWidth={3} aria-hidden /> Verified minister
          </span>
        </div>
      </section>

      <div className="mx-5 flex flex-col gap-2.5">
        <h2 className="text-lg font-bold text-ink-900">Spouse</h2>
        {spouse ? (
          <PersonRow m={spouse} tone="spouse" subtitle="Ticket sent" onOpen={open} />
        ) : (
          <AddButton label="Add your spouse" onClick={() => setAdding("spouse")} />
        )}
      </div>

      <div className="mx-5 flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-ink-900">Aides</h2>
          <span className="text-sm text-ink-500">
            {aides.length} of {team.limits.aides} used
          </span>
        </div>
        {aides.map((m, i) => (
          <PersonRow key={m.id} m={m} tone="aide" index={i + 1} subtitle={m.title ?? "Aide"} onOpen={open} />
        ))}
        {aides.length < team.limits.aides && <AddButton label="Add an aide" onClick={() => setAdding("aide")} />}
      </div>

      <p className="mx-5 rounded-2xl bg-cream-100 p-4 text-sm leading-[1.5] text-ink-600">
        Aides are seated with you and share your meal and hall access.
      </p>

      {adding && (
        <MemberSheet
          open
          onOpenChange={(o) => !o && setAdding(null)}
          kind="minister"
          role={adding}
          title={adding === "spouse" ? "Add your spouse" : "Add an aide"}
        />
      )}
      <ManageSheet member={managing} kind="minister" onClose={() => setManaging(null)} />
    </div>
  );
}

function PersonRow({
  m,
  tone,
  index = 0,
  subtitle,
  onOpen,
}: {
  m: TeamMember;
  tone: "spouse" | "aide";
  index?: number;
  subtitle: string;
  onOpen: (m: TeamMember) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(m)}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-[20px] p-3.5 text-left",
        tone === "spouse" ? "bg-cobalt-50" : "border border-ink-100 bg-white",
      )}
    >
      <MemberAvatar name={m.name} index={index} size={48} className={tone === "spouse" ? "bg-white" : undefined} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base font-bold text-ink-900">{m.name}</span>
        <span className="text-[13px] text-ink-500">{subtitle}</span>
      </span>
      <StatusPill status={m.status} />
    </button>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-[20px] border-[1.5px] border-dashed border-ink-200 py-4 text-[15px] font-bold text-cobalt-700 focus-visible:outline-none focus-visible:shadow-[var(--ring)]"
    >
      <Plus size={18} strokeWidth={2.5} aria-hidden /> {label}
    </button>
  );
}
