<?php

namespace App\Domain\Registration\Actions;

use App\Domain\Registration\Exceptions\RegistrationException;
use App\Domain\Registration\Models\Attendee;
use App\Domain\Registration\Models\OtpCode;

class VerifyLoginCode
{
    public const MAX_ATTEMPTS = 5;

    /** Consumes the live code for the address and returns its attendee, or throws. */
    public function withCode(string $email, string $code): Attendee
    {
        $email = strtolower(trim($email));
        $otp = $this->live(OtpCode::where('email', $email));

        if (! $otp || $otp->attempts >= self::MAX_ATTEMPTS) {
            throw RegistrationException::invalidCode();
        }

        if (! hash_equals($otp->code_hash, IssueLoginCode::codeHash($email, $code))) {
            $otp->increment('attempts');
            throw RegistrationException::invalidCode();
        }

        return $this->consume($otp);
    }

    public function withLink(string $email, string $token): Attendee
    {
        $email = strtolower(trim($email));
        $otp = $this->live(OtpCode::where('email', $email)->where('link_hash', IssueLoginCode::linkHash($token)));

        if (! $otp) {
            throw RegistrationException::invalidCode();
        }

        return $this->consume($otp);
    }

    private function live($query): ?OtpCode
    {
        return $query->where('audience', 'attendee')->whereNull('consumed_at')->where('expires_at', '>', now())->latest('id')->first();
    }

    private function consume(OtpCode $otp): Attendee
    {
        // Atomic claim: a concurrent request using the same code or link loses.
        if (OtpCode::whereKey($otp->id)->whereNull('consumed_at')->update(['consumed_at' => now()]) === 0) {
            throw RegistrationException::invalidCode();
        }

        $attendee = Attendee::where('email', $otp->email)->first();
        if (! $attendee) {
            throw RegistrationException::invalidCode();
        }

        return $attendee;
    }
}
