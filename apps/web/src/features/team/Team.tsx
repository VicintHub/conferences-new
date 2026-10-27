"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { AppSubHeader } from "@/features/app/AppSubHeader";
import { useMe } from "@/features/app/queries";
import { ErrorNote, SkeletonBlock } from "@/features/app/ui";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatPhone } from "@/lib/phone";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { previewTeam, useCreateTeam, useJoinTeam, useLeaveTeam, useRenameTeam, useTeam } from "./api";
import { ImportSheet } from "./ImportSheet";
import { ManageSheet } from "./ManageSheet";
import { MemberSheet } from "./MemberForm";
import { MemberAvatar, memberSubtitle, modeName, StatusPill } from "./parts";
import { shareLink } from "@/lib/share";
import { categoryName, type Team as TeamT, type TeamMember } from "./types";

type Filter = "all" | "confirmed" | "invited";

/** My team (designs 9a mobile, 10a desktop). */
export function Team() {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const q = useTeam("church");
  const { me } = useMe();
  const join = useSearchParams().get("join");

  if (q.isError) {
    return (
      <div className="p-5 pt-[60px]">
        <ErrorNote onRetry={() => q.refetch()} />
      </div>
    );
  }
  if (q.isPending) {
    return (
      <div className="flex flex-col gap-4 px-5 pt-[60px]" aria-busy="true">
        <SkeletonBlock className="h-40" />
        <SkeletonBlock className="h-64" />
      </div>
    );
  }

  const { data: team, meta } = q.data;
  return (
    <div className="flex flex-1 flex-col lg:px-10 lg:pb-10">
      {join && <JoinCard code={join.toUpperCase()} alreadyInTeam={!!team} />}
      {team ? (
        desktop ? (
          <DesktopTeam team={team} />
        ) : (
          <MobileTeam team={team} />
        )
      ) : (
        <NoTeam defaultName={meta.default_name} canCreate={meta.can_create} />
      )}
      {me?.category === "minister" && (
        <Link
          href="/app/team/minister"
          className="mx-5 mb-6 mt-2 flex items-center justify-between rounded-[20px] border border-ink-100 bg-white p-4 lg:mx-0"
        >
          <span className="flex flex-col">
            <span className="text-[15px] font-bold text-ink-900">Minister’s team</span>
            <span className="text-sm text-ink-500">Your spouse and up to 3 aides</span>
          </span>
          <span className="text-sm font-semibold text-cobalt-700">Open →</span>
        </Link>
      )}
    </div>
  );
}

/** The share link lands here: show whose team it is and let the person say yes. */
function JoinCard({ code, alreadyInTeam }: { code: string; alreadyInTeam: boolean }) {
  const preview = useQuery({ queryKey: ["team-preview", code], queryFn: () => previewTeam(code), retry: false });
  const join = useJoinTeam();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || alreadyInTeam) return null;

  if (preview.isError) {
    return (
      <p role="alert" className="mx-5 mt-[60px] rounded-2xl bg-brick-100 p-4 text-sm text-brick-800 lg:mx-0 lg:mt-9">
        We couldn’t find a team with the code {code}. Check the link with your team leader.
      </p>
    );
  }
  if (!preview.data) return null;
  const t = preview.data.data;
  const failed = join.error instanceof ApiError ? (join.error.fieldErrors.code ?? join.error.message) : null;

  return (
    <section className="mx-5 mt-[60px] flex flex-col gap-3 rounded-[24px] bg-cobalt-50 p-5 lg:mx-0 lg:mt-9" aria-label="Join a team">
      <h2 className="text-lg font-bold text-cobalt-900">Join {t.name}?</h2>
      <p className="text-sm text-ink-600">
        {t.leader} leads this team ({t.members} {t.members === 1 ? "person" : "people"}). You’ll appear on their list with your own ticket.
      </p>
      {failed && (
        <p role="alert" className="text-sm text-brick-600">
          {failed}
        </p>
      )}
      <div className="flex gap-2">
        <Button fullWidth disabled={join.isPending} onClick={() => join.mutate(code)}>
          {join.isPending ? "Joining…" : "Join team"}
        </Button>
        <Button fullWidth variant="outline" onClick={() => setDismissed(true)}>
          Not now
        </Button>
      </div>
    </section>
  );
}

function NoTeam({ defaultName, canCreate }: { defaultName: string; canCreate: boolean }) {
  const create = useCreateTeam("church");
  const [name, setName] = useState(defaultName);
  const err = create.error instanceof ApiError ? (create.error.fieldErrors.name ?? create.error.message) : null;

  return (
    <div className="flex flex-col gap-4">
      <AppSubHeader title="My team" />
      <section className="mx-5 flex flex-col gap-4 rounded-[24px] border border-ink-100 bg-white p-5 lg:max-w-[520px]">
        <h2 className="text-lg font-bold text-ink-900">Bringing a group?</h2>
        <p className="text-sm leading-[1.5] text-ink-500">
          Start a team for your church or ministry. Add people yourself or share a link, and each person gets their own ticket.
        </p>
        {canCreate ? (
          <>
            <Input
              label="Team name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Christ Life Assembly, Ibadan"
              error={err ?? undefined}
            />
            <Button size="lg" fullWidth disabled={create.isPending} onClick={() => create.mutate(name.trim())}>
              {create.isPending ? "Creating…" : "Create my team"}
            </Button>
          </>
        ) : (
          <p className="rounded-xl bg-cream-100 p-3 text-sm text-ink-600">Confirm your registration first, then you can start a team.</p>
        )}
        <p className="text-sm text-ink-400">Joining someone else’s team? Open the link your team leader sent you.</p>
      </section>
    </div>
  );
}

function useTeamActions(team: TeamT) {
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [managing, setManaging] = useState<TeamMember | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const share = async () => {
    const r = await shareLink(team.share_url, `Join ${team.name} at Jan. Conf 2027`);
    setNotice(r === "copied" ? "Link copied" : r === "failed" ? "Couldn’t share the link" : null);
  };
  return { adding, setAdding, importing, setImporting, managing, setManaging, notice, share };
}

function MobileTeam({ team }: { team: TeamT }) {
  const a = useTeamActions(team);
  const [filter, setFilter] = useState<Filter>("all");
  const rename = useRenameTeam("church");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const list = team.members.filter((m) => filter === "all" || m.status === filter);
  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: `All ${team.stats.members}` },
    { key: "confirmed", label: `Confirmed ${team.stats.confirmed}` },
    { key: "invited", label: `Invited ${team.stats.invited}` },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-end justify-between pr-5">
        <AppSubHeader title="My team" />
        {team.is_leader && (
          <button type="button" onClick={() => setEditing((e) => !e)} className="pb-[18px] text-sm font-bold text-cobalt-700">
            {editing ? "Cancel" : "Edit"}
          </button>
        )}
      </div>
      <section className="relative mx-5 overflow-hidden rounded-[28px] bg-cobalt-950 p-5 text-white">
        {editing ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              rename.mutate(name.trim(), { onSuccess: () => setEditing(false) });
            }}
          >
            <Input label="Team name" value={name} onChange={(e) => setName(e.target.value)} />
            <Button type="submit" variant="onDark" disabled={rename.isPending || name.trim().length < 2}>
              Save name
            </Button>
          </form>
        ) : (
          <>
            <p className="text-sm text-cobalt-100">{team.name}</p>
            <p className="mt-2 flex items-baseline gap-3">
              <span className="font-display text-[44px] font-bold leading-none">{team.stats.members}</span>
              <span className="text-[15px] text-cobalt-100">
                {team.stats.members === 1 ? "member" : "members"} · {team.stats.confirmed} confirmed
              </span>
            </p>
          </>
        )}
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white/10 p-3.5">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-[0.08em] text-cobalt-100">Team code</span>
            <span className="font-display text-xl font-bold tracking-[0.04em]">{team.code}</span>
          </div>
          <button type="button" onClick={a.share} className="rounded-full bg-cream-50 px-4 py-2.5 text-sm font-bold text-cobalt-900">
            Share link
          </button>
        </div>
        {a.notice && (
          <p role="status" className="mt-2 text-xs text-cobalt-100">
            {a.notice}
          </p>
        )}
      </section>

      <div role="group" aria-label="Filter members" className="mt-5 flex gap-2 overflow-x-auto px-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={filter === t.key}
            onClick={() => setFilter(t.key)}
            className={cn(
              "flex-none rounded-full border-[1.5px] px-4 py-2.5 text-sm font-bold leading-none",
              filter === t.key ? "border-cobalt-950 bg-cobalt-950 text-cream-50" : "border-ink-200 text-ink-600",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ul className="mt-2 flex-1 px-5 pb-28">
        {list.map((m, i) => {
          const body = (
            <>
              <MemberAvatar name={m.name} index={i} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-base font-bold text-ink-900">{m.name}</span>
                <span className="text-[13px] text-ink-500">{memberSubtitle(m)}</span>
              </span>
              <StatusPill status={m.status} />
            </>
          );
          return (
            <li key={m.id} className="border-b border-ink-50">
              {team.is_leader ? (
                <button type="button" onClick={() => a.setManaging(m)} className="flex w-full items-center gap-3.5 py-3.5 text-left">
                  {body}
                </button>
              ) : (
                <div className="flex items-center gap-3.5 py-3.5">{body}</div>
              )}
            </li>
          );
        })}
        {list.length === 0 && <li className="py-8 text-center text-sm text-ink-400">No one here yet.</li>}
      </ul>

      {team.is_leader ? (
        <div className="sticky bottom-[84px] bg-gradient-to-t from-white via-white to-transparent px-5 pb-3 pt-6">
          <Button size="lg" fullWidth onClick={() => a.setAdding(true)}>
            Add a member
          </Button>
        </div>
      ) : (
        <LeaveButton />
      )}

      <MemberSheet open={a.adding} onOpenChange={a.setAdding} kind="church" title="Add a member" />
      <ManageSheet member={a.managing} kind="church" onClose={() => a.setManaging(null)} />
    </div>
  );
}

function LeaveButton() {
  const leave = useLeaveTeam();
  const [sure, setSure] = useState(false);
  return (
    <div className="px-5 pb-8">
      {sure ? (
        <div className="flex gap-2">
          <Button variant="outline" fullWidth onClick={() => setSure(false)}>
            Stay
          </Button>
          <Button variant="accent" fullWidth disabled={leave.isPending} onClick={() => leave.mutate()}>
            Leave team
          </Button>
        </div>
      ) : (
        <Button variant="ghost" fullWidth onClick={() => setSure(true)}>
          Leave this team
        </Button>
      )}
    </div>
  );
}

function DesktopTeam({ team }: { team: TeamT }) {
  const a = useTeamActions(team);
  const stats = [
    { k: "Members", v: team.stats.members },
    { k: "Confirmed", v: team.stats.confirmed },
    { k: "Onsite", v: team.stats.onsite },
    { k: "Badges collected", v: team.stats.badges_collected },
  ];

  return (
    <div className="flex flex-col gap-5 pt-9">
      <header className="flex items-end justify-between gap-6">
        <div>
          <p className="text-[15px] text-ink-500">
            {team.name} · code {team.code}
          </p>
          <h1 className="font-display text-[56px] font-bold uppercase leading-[1] text-cobalt-900">My team</h1>
        </div>
        <div className="flex items-center gap-3">
          {team.is_leader && (
            <Button variant="outline" onClick={() => a.setImporting(true)}>
              Import CSV
            </Button>
          )}
          <Button variant="outline" onClick={a.share}>
            Share link
          </Button>
          {team.is_leader && <Button onClick={() => a.setAdding(true)}>Add member</Button>}
        </div>
      </header>
      {a.notice && (
        <p role="status" className="text-sm text-ink-500">
          {a.notice}
        </p>
      )}

      <div className="grid grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.k} className="flex flex-col gap-1 rounded-[20px] border border-ink-100 bg-white px-5 py-4">
            <span className="text-sm text-ink-500">{s.k}</span>
            <span className="font-display text-[36px] font-bold leading-none text-cobalt-900">{s.v}</span>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[20px] border border-ink-100 bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-ink-50 text-xs uppercase tracking-[0.08em] text-ink-500">
              {["Name", "Phone", "Category", "Mode", "Status"].map((h) => (
                <th key={h} scope="col" className="px-5 py-3.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {team.members.map((m, i) => (
              <tr
                key={m.id}
                onClick={team.is_leader ? () => a.setManaging(m) : undefined}
                className={cn("border-t border-ink-50 text-[15px] text-ink-800", team.is_leader && "cursor-pointer hover:bg-cream-50")}
              >
                <td className="px-5 py-3.5">
                  <span className="flex items-center gap-3">
                    <MemberAvatar name={m.name} index={i} size={36} />
                    {team.is_leader ? (
                      <button type="button" onClick={() => a.setManaging(m)} className="font-bold text-ink-900">
                        {m.name}
                      </button>
                    ) : (
                      <span className="font-bold text-ink-900">{m.name}</span>
                    )}
                  </span>
                </td>
                <td className="px-5 py-3.5">{m.phone ? formatPhone(m.phone) : "—"}</td>
                <td className="px-5 py-3.5">{m.category ? categoryName[m.category] : "—"}</td>
                <td className="px-5 py-3.5">{modeName(m.mode)}</td>
                <td className="px-5 py-3.5">
                  <StatusPill status={m.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!team.is_leader && <LeaveButton />}

      <MemberSheet open={a.adding} onOpenChange={a.setAdding} kind="church" title="Add a member" />
      <ImportSheet open={a.importing} onOpenChange={a.setImporting} />
      <ManageSheet member={a.managing} kind="church" onClose={() => a.setManaging(null)} />
    </div>
  );
}
