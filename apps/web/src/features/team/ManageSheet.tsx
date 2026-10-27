"use client";

import { useState } from "react";
import { Button, Sheet } from "@/components/ui";
import { formatPhone } from "@/lib/phone";
import { useRemoveMember, useResendInvite, type Kind } from "./api";
import { memberSubtitle, StatusPill } from "./parts";
import type { TeamMember } from "./types";

/** What a leader can do with one person: see their details, resend an unclaimed ticket, or remove them. */
export function ManageSheet({ member, kind, onClose }: { member: TeamMember | null; kind: Kind; onClose: () => void }) {
  const remove = useRemoveMember(kind);
  const resend = useResendInvite(kind);
  const [confirming, setConfirming] = useState(false);
  const close = () => {
    setConfirming(false);
    resend.reset();
    onClose();
  };

  return (
    <Sheet open={!!member} onOpenChange={(o) => !o && close()} title={member?.name ?? "Member"}>
      {member && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[15px] text-ink-500">{memberSubtitle(member)}</span>
            <StatusPill status={member.status} />
          </div>
          <dl className="flex flex-col gap-2 rounded-2xl bg-ink-50 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Email</dt>
              <dd className="break-all text-right font-semibold text-ink-800">{member.email}</dd>
            </div>
            {member.phone && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500">Phone</dt>
                <dd className="font-semibold text-ink-800">{formatPhone(member.phone)}</dd>
              </div>
            )}
          </dl>
          {member.status === "invited" && (
            <>
              <Button
                variant="outline"
                size="lg"
                fullWidth
                disabled={resend.isPending || resend.isSuccess}
                onClick={() => resend.mutate(member.id)}
              >
                {resend.isSuccess ? "Ticket sent again ✓" : resend.isPending ? "Sending…" : "Resend ticket"}
              </Button>
              {resend.isError && (
                <p role="alert" className="text-sm text-brick-600">
                  Couldn’t send it. Try again in a minute.
                </p>
              )}
            </>
          )}
          {member.role !== "leader" &&
            (confirming ? (
              <div className="flex flex-col gap-2 rounded-2xl border border-brick-200 bg-brick-100 p-4">
                <p className="text-sm text-brick-800">
                  {member.status === "invited"
                    ? "Their unclaimed ticket will be cancelled."
                    : "They keep their own ticket but leave your team."}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" fullWidth onClick={() => setConfirming(false)}>
                    Keep
                  </Button>
                  <Button
                    variant="accent"
                    fullWidth
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(member.id, { onSuccess: close })}
                  >
                    {remove.isPending ? "Removing…" : "Remove"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="ghost" fullWidth onClick={() => setConfirming(true)}>
                Remove from team
              </Button>
            ))}
        </div>
      )}
    </Sheet>
  );
}
