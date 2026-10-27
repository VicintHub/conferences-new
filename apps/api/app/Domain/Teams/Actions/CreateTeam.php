<?php

namespace App\Domain\Teams\Actions;

use App\Domain\Registration\Enums\RegistrationCategory;
use App\Domain\Registration\Models\Attendee;
use App\Domain\Teams\Enums\MemberRole;
use App\Domain\Teams\Enums\TeamKind;
use App\Domain\Teams\Models\Team;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CreateTeam
{
    public function __invoke(Attendee $leader, TeamKind $kind, ?string $name = null): Team
    {
        $registration = $leader->registration;
        if ($registration?->status !== 'confirmed') {
            throw ValidationException::withMessages(['name' => 'Confirm your registration before creating a team.']);
        }
        if ($kind === TeamKind::Minister && ($registration->category !== RegistrationCategory::Minister || ! $registration->minister_verified_at)) {
            throw ValidationException::withMessages(['name' => 'A minister’s team needs a verified minister registration.']);
        }

        $name = trim((string) $name) !== '' ? trim((string) $name) : ($kind === TeamKind::Minister ? $leader->full_name : ($leader->church ?: "{$leader->full_name}’s team"));

        return DB::transaction(function () use ($leader, $kind, $name) {
            if ($leader->teamMembership()->exists()) {
                throw ValidationException::withMessages(['name' => 'You are already part of a team.']);
            }

            $team = Team::create(['leader_id' => $leader->id, 'kind' => $kind, 'name' => $name, 'code' => $this->code($name)]);
            $team->members()->create(['attendee_id' => $leader->id, 'role' => MemberRole::Leader, 'added_by' => $leader->id]);

            return $team;
        });
    }

    /** "Christ Life Assembly" -> CLA-7Q4K. Letters from the name, four unambiguous characters after. */
    private function code(string $name): string
    {
        $initials = Str::of($name)->replaceMatches('/[^A-Za-z ]/', '')->explode(' ')->filter()->map(fn ($w) => strtoupper($w[0]))->implode('');
        $prefix = str_pad(substr($initials, 0, 3), 3, 'X');
        $alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

        do {
            $suffix = '';
            for ($i = 0; $i < 4; $i++) {
                $suffix .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
            $code = "{$prefix}-{$suffix}";
        } while (Team::where('code', $code)->exists());

        return $code;
    }
}
