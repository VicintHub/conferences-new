<?php

namespace App\Domain\Checkin\Actions;

use App\Domain\Checkin\Models\Badge;
use App\Domain\Registration\Models\Registration;
use App\Domain\Staff\Models\StaffUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Records that a badge was printed. The first print is routine. A second one is a reprint (lost or damaged badge)
 * and needs someone allowed to override, plus a reason, so badges can't be quietly duplicated.
 */
class PrintBadge
{
    public function __invoke(Registration $registration, StaffUser $staff, ?string $desk, bool $reprint, ?string $reason): Badge
    {
        return DB::transaction(function () use ($registration, $staff, $desk, $reprint, $reason) {
            $reg = Registration::whereKey($registration->id)->lockForUpdate()->firstOrFail();

            if ($reg->status !== 'confirmed') {
                throw ValidationException::withMessages(['registration_id' => 'This registration isn’t confirmed yet, so no badge can be printed.']);
            }
            if ($reg->badge_printed_at && ! $reprint) {
                abort(409, 'A badge was already printed for this person.');
            }
            if ($reprint) {
                if (! $staff->role->can('override')) {
                    abort(403, 'Only a supervisor can reprint a badge.');
                }
                if (trim((string) $reason) === '') {
                    throw ValidationException::withMessages(['reason' => 'Say why the badge is being reprinted.']);
                }
            }

            $badge = Badge::create([
                'registration_id' => $reg->id, 'staff_id' => $staff->id, 'desk' => $desk,
                'reprint' => $reg->badge_printed_at !== null, 'reason' => $reprint ? trim((string) $reason) : null, 'printed_at' => now(),
            ]);
            $reg->forceFill(['badge_printed_at' => $reg->badge_printed_at ?? $badge->printed_at])->save();

            return $badge;
        });
    }
}
