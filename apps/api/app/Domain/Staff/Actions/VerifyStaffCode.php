<?php

namespace App\Domain\Staff\Actions;

use App\Domain\Registration\Actions\IssueLoginCode;
use App\Domain\Registration\Actions\VerifyLoginCode;
use App\Domain\Registration\Exceptions\RegistrationException;
use App\Domain\Registration\Models\OtpCode;
use App\Domain\Staff\Models\StaffUser;

class VerifyStaffCode
{
    /** @return array{staff: StaffUser, token: string} */
    public function withCode(string $email, string $code): array
    {
        $email = strtolower(trim($email));
        $otp = $this->live(OtpCode::where('email', $email));

        if (! $otp || $otp->attempts >= VerifyLoginCode::MAX_ATTEMPTS) {
            throw RegistrationException::invalidCode();
        }
        if (! hash_equals($otp->code_hash, IssueLoginCode::codeHash($email, $code))) {
            $otp->increment('attempts');
            throw RegistrationException::invalidCode();
        }

        return $this->consume($otp);
    }

    /** @return array{staff: StaffUser, token: string} */
    public function withLink(string $email, string $token): array
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
        return $query->where('audience', 'staff')->whereNull('consumed_at')->where('expires_at', '>', now())->latest('id')->first();
    }

    private function consume(OtpCode $otp): array
    {
        if (OtpCode::whereKey($otp->id)->whereNull('consumed_at')->update(['consumed_at' => now()]) === 0) {
            throw RegistrationException::invalidCode();
        }
        $staff = StaffUser::where('email', $otp->email)->where('active', true)->first();
        if (! $staff) {
            throw RegistrationException::invalidCode();
        }

        return ['staff' => $staff, 'token' => $staff->createToken('staff')->plainTextToken];
    }
}
