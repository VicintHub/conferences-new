<?php

namespace App\Domain\Teams\Actions;

use App\Domain\Registration\Models\Attendee;
use App\Domain\Teams\Enums\MemberRole;
use App\Domain\Teams\Enums\TeamKind;
use App\Domain\Teams\Models\Team;
use App\Domain\Teams\Models\TeamMember;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Joins a church team by its code (the share link). Minister teams are by invitation only. */
class JoinTeam
{
    public function __invoke(Attendee $attendee, Team $team): TeamMember
    {
        if ($team->kind !== TeamKind::Church) {
            abort(404);
        }

        return DB::transaction(function () use ($attendee, $team) {
            $team = Team::whereKey($team->id)->lockForUpdate()->firstOrFail();

            if ($attendee->teamMembership()->exists()) {
                throw ValidationException::withMessages(['code' => 'You are already part of a team. Leave it first to join another.']);
            }
            if ($team->members()->count() >= $team->kind->max()) {
                throw ValidationException::withMessages(['code' => 'This team is full.']);
            }

            return $team->members()->create(['attendee_id' => $attendee->id, 'role' => MemberRole::Member, 'added_by' => $attendee->id]);
        });
    }
}
