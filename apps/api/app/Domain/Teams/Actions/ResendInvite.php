<?php

namespace App\Domain\Teams\Actions;

use App\Domain\Registration\Actions\IssueLoginCode;
use App\Domain\Teams\Models\TeamMember;
use Illuminate\Validation\ValidationException;

class ResendInvite
{
    public function __construct(private IssueLoginCode $issue) {}

    public function __invoke(TeamMember $member): void
    {
        $member->loadMissing('attendee', 'team.leader');

        if ($member->isConfirmed()) {
            throw ValidationException::withMessages(['member' => 'They have already confirmed.']);
        }

        ($this->issue)($member->attendee->email, ['by' => $member->team->leader->full_name, 'team' => $member->team->name]);
    }
}
