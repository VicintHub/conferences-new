<?php

namespace App\Domain\Teams\Actions;

use App\Domain\Teams\Enums\MemberRole;
use App\Domain\Teams\Models\TeamMember;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Takes someone off a team. People the leader added who never signed in (still "Invited") are deleted outright,
 * since the account exists only because of that invitation. Anyone who confirmed keeps their ticket.
 */
class RemoveTeamMember
{
    public function __invoke(TeamMember $member): void
    {
        if ($member->role === MemberRole::Leader) {
            throw ValidationException::withMessages(['member' => 'A team leader cannot be removed.']);
        }

        DB::transaction(function () use ($member) {
            $attendee = $member->attendee()->with('registration')->first();
            $member->delete();

            if ($attendee && ! $attendee->email_verified_at) {
                $attendee->delete();
            }
        });
    }
}
