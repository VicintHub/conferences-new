<?php

namespace App\Domain\Admin\Actions;

use App\Domain\Registration\Enums\RegistrationCategory;
use App\Domain\Registration\Models\Registration;
use App\Mail\MinisterVerificationMail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

/**
 * The committee's call on a self-declared minister. Approving unlocks the minister's team. Declining keeps the
 * person registered, as a delegate, so nobody loses their place over a credentials check.
 */
class ReviewMinister
{
    public function __invoke(Registration $registration, bool $approve, ?string $note = null): Registration
    {
        $registration = DB::transaction(function () use ($registration, $approve) {
            $fresh = Registration::whereKey($registration->id)->lockForUpdate()->firstOrFail();

            if ($fresh->category !== RegistrationCategory::Minister || $fresh->minister_verified_at) {
                throw ValidationException::withMessages(['action' => 'This registration is not waiting for minister verification.']);
            }
            if ($approve) {
                $fresh->minister_verified_at = now();
            } else {
                $fresh->category = RegistrationCategory::Delegate;
            }
            $fresh->save();

            return $fresh;
        });

        $attendee = $registration->attendee;
        Mail::to($attendee->email)->queue(new MinisterVerificationMail(explode(' ', trim($attendee->full_name))[0], $approve, $note));

        return $registration;
    }
}
