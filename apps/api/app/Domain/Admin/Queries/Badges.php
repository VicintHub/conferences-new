<?php

namespace App\Domain\Admin\Queries;

use App\Domain\Applications\Enums\ApplicationStatus;
use App\Domain\Applications\Models\Application;
use App\Domain\Registration\Enums\RegistrationCategory;
use App\Domain\Registration\Models\Registration;
use App\Domain\Testimonies\Models\Testimony;

/** Counts of things waiting for staff: shown as red badges on the sidebar. */
class Badges
{
    /** Ministers waiting to be verified, plus applications not yet decided. */
    public static function pendingApprovals()
    {
        return [
            Registration::where('category', RegistrationCategory::Minister->value)->where('status', 'confirmed')->whereNull('minister_verified_at'),
            Application::whereNotIn('status', [ApplicationStatus::Approved->value, ApplicationStatus::Declined->value]),
        ];
    }

    /** @return array{approvals: int, testimonies: int} */
    public function __invoke(): array
    {
        [$ministers, $applications] = self::pendingApprovals();

        return [
            'approvals' => $ministers->count() + $applications->count(),
            'testimonies' => Testimony::where('status', 'pending')->count(),
        ];
    }
}
