<?php

namespace App\Domain\Registration\Actions;

use App\Domain\Registration\Enums\AttendanceMode;
use App\Domain\Registration\Models\Attendee;
use App\Domain\Registration\Models\Registration;
use Illuminate\Support\Facades\DB;

/** Runs after a code or link is accepted: confirms a pending registration (taking an onsite seat) and issues a token. */
class CompleteSignIn
{
    public function __construct(private ClaimOnsiteSeat $claimSeat) {}

    /** @return array{registration: Registration, token: string, downgraded: bool, existing: bool} */
    public function __invoke(Attendee $attendee): array
    {
        return DB::transaction(function () use ($attendee) {
            $existing = $attendee->email_verified_at !== null;
            $downgraded = false;

            if (! $existing) {
                $attendee->forceFill(['email_verified_at' => now()])->save();
            }

            $registration = $attendee->registration()->lockForUpdate()->firstOrFail();
            if ($registration->status === 'pending_verification') {
                if ($registration->mode === AttendanceMode::Onsite && ! ($this->claimSeat)()) {
                    $registration->mode = AttendanceMode::Online;
                    $downgraded = true;
                }
                $registration->status = 'confirmed';
                $registration->save();
            }

            return [
                'registration' => $registration->setRelation('attendee', $attendee),
                'token' => $attendee->createToken('attendee')->plainTextToken,
                'downgraded' => $downgraded,
                'existing' => $existing,
            ];
        });
    }
}
