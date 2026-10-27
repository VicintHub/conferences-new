<?php

namespace App\Domain\Broadcasts\Actions;

use App\Domain\Registration\Enums\AttendanceMode;
use App\Domain\Registration\Enums\RegistrationCategory;
use App\Domain\Registration\Models\Attendee;
use App\Domain\Teams\Enums\MemberRole;
use Illuminate\Database\Eloquent\Builder;

/** Turns the chips the staff member ticked into the people they reach: confirmed attendees, any chip matching. */
class ResolveAudience
{
    /** @param  list<string>  $audience */
    public function __invoke(array $audience): Builder
    {
        $query = Attendee::query()->whereNotNull('email_verified_at')->whereHas('registration', fn ($r) => $r->where('status', 'confirmed'));

        if (in_array('everyone', $audience, true)) {
            return $query;
        }

        return $query->where(function (Builder $any) use ($audience) {
            foreach ($audience as $chip) {
                match ($chip) {
                    'onsite' => $any->orWhereHas('registration', fn ($r) => $r->where('mode', AttendanceMode::Onsite->value)),
                    'online' => $any->orWhereHas('registration', fn ($r) => $r->where('mode', AttendanceMode::Online->value)),
                    'iylc' => $any->orWhereIn('age_band', ['16-17', '18-45']),
                    'ministers' => $any->orWhereHas('registration', fn ($r) => $r->where('category', RegistrationCategory::Minister->value)),
                    'team_leaders' => $any->orWhereHas('teamMembership', fn ($m) => $m->where('role', MemberRole::Leader->value)),
                    default => null,
                };
            }
            // An empty selection must reach nobody, not everybody.
            if ($audience === []) {
                $any->whereRaw('1 = 0');
            }
        });
    }
}
