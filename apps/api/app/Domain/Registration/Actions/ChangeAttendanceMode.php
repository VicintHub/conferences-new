<?php

namespace App\Domain\Registration\Actions;

use App\Domain\Registration\Enums\AttendanceMode;
use App\Domain\Registration\Exceptions\RegistrationException;
use App\Domain\Registration\Models\Registration;
use Illuminate\Support\Facades\DB;

/** Switches a confirmed registration between onsite and online, keeping the onsite counter honest. */
class ChangeAttendanceMode
{
    public function __construct(private ClaimOnsiteSeat $claimSeat) {}

    public function __invoke(Registration $registration, AttendanceMode $mode): Registration
    {
        return DB::transaction(function () use ($registration, $mode) {
            $registration = Registration::whereKey($registration->id)->lockForUpdate()->firstOrFail();

            if ($registration->mode === $mode) {
                return $registration;
            }

            if ($mode === AttendanceMode::Onsite) {
                if (! ($this->claimSeat)()) {
                    throw RegistrationException::onsiteFull();
                }
            } elseif ($registration->status === 'confirmed') {
                // Only confirmed registrations hold a seat (it is taken at verification).
                DB::table('capacity_counters')->where('name', 'onsite')->where('taken', '>', 0)->decrement('taken');
            }

            $registration->update(['mode' => $mode]);

            return $registration;
        });
    }
}
