<?php

namespace App\Domain\Teams\Actions;

use App\Domain\Registration\Actions\GenerateClaimCode;
use App\Domain\Registration\Actions\IssueLoginCode;
use App\Domain\Registration\Enums\RegistrationCategory;
use App\Domain\Registration\Models\Attendee;
use App\Domain\Teams\Enums\MemberRole;
use App\Domain\Teams\Enums\TeamKind;
use App\Domain\Teams\Models\Team;
use App\Domain\Teams\Models\TeamMember;
use App\Http\Requests\Api\V1\RegisterRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * A leader registers someone else. The person gets an Attendee and a pending Registration straight away, and an
 * email with a sign-in code and link; they become "Confirmed" (and take an onsite seat) when they use it.
 * Nobody who already has an account can be added this way: that would hand someone a ticket and a team without
 * their say-so. They join with the team link instead.
 */
class AddTeamMember
{
    public function __construct(private IssueLoginCode $issue, private GenerateClaimCode $claimCode) {}

    /** @param  array{full_name: string, email: string, phone?: ?string, category?: string, mode: string, title?: ?string}  $data */
    public function __invoke(Team $team, MemberRole $role, array $data, bool $sendInvite = true): TeamMember
    {
        $member = DB::transaction(function () use ($team, $role, $data) {
            // Serialise concurrent adds so two requests cannot both squeeze under the limit.
            $team = Team::whereKey($team->id)->lockForUpdate()->firstOrFail();
            $this->guardRoom($team, $role);

            if (Attendee::where('email', $data['email'])->exists()) {
                throw ValidationException::withMessages(['email' => 'This email is already registered. Ask them to join with your team link instead.']);
            }

            $leader = $team->leader;
            $category = match (true) {
                $team->kind === TeamKind::Minister => RegistrationCategory::Delegate,
                default => RegistrationCategory::from($data['category'] ?? 'delegate'),
            };

            $attendee = Attendee::create([
                'full_name' => $data['full_name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'church' => $leader->church,
                'location' => $leader->location,
            ]);
            $attendee->registration()->create([
                'category' => $category,
                'mode' => $data['mode'],
                'days' => RegisterRequest::DAYS,
                'status' => 'pending_verification',
                'claim_code' => ($this->claimCode)($category),
                'consented_at' => null,
            ]);

            return $team->members()->create([
                'attendee_id' => $attendee->id,
                'role' => $role,
                'title' => $data['title'] ?? null,
                'added_by' => $leader->id,
            ]);
        });

        if ($sendInvite) {
            ($this->issue)($data['email'], ['by' => $team->leader->full_name, 'team' => $team->name]);
        }

        return $member->load('attendee.registration');
    }

    private function guardRoom(Team $team, MemberRole $role): void
    {
        $counts = $team->members()->selectRaw('role, count(*) as n')->groupBy('role')->pluck('n', 'role');
        $total = (int) $counts->sum();

        if ($team->kind === TeamKind::Minister) {
            if (! in_array($role, [MemberRole::Spouse, MemberRole::Aide], true)) {
                throw ValidationException::withMessages(['role' => 'A minister’s team holds a spouse and aides.']);
            }
            if ($role === MemberRole::Spouse && ($counts['spouse'] ?? 0) >= 1) {
                throw ValidationException::withMessages(['full_name' => 'You have already added a spouse.']);
            }
            if ($role === MemberRole::Aide && ($counts['aide'] ?? 0) >= (int) config('conference.minister_aides_max')) {
                throw ValidationException::withMessages(['full_name' => 'You can add up to '.config('conference.minister_aides_max').' aides.']);
            }

            return;
        }

        if ($role !== MemberRole::Member) {
            throw ValidationException::withMessages(['role' => 'Only delegates can be added to a church team.']);
        }
        if ($total >= $team->kind->max()) {
            throw ValidationException::withMessages(['full_name' => "A team can have up to {$team->kind->max()} people."]);
        }
    }
}
