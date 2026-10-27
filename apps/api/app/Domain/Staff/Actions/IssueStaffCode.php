<?php

namespace App\Domain\Staff\Actions;

use App\Domain\Registration\Actions\IssueLoginCode;
use App\Domain\Registration\Models\OtpCode;
use App\Domain\Staff\Models\StaffUser;
use App\Mail\LoginCodeMail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

/** Emails a sign-in code and link to an active staff member. Silent for anyone else, so it reveals nothing. */
class IssueStaffCode
{
    public function __invoke(string $email): void
    {
        $email = strtolower(trim($email));

        if (! Cache::add("staff-otp-cooldown:{$email}", 1, IssueLoginCode::RESEND_AFTER_SECONDS)) {
            return;
        }
        $staff = StaffUser::where('email', $email)->where('active', true)->first();
        if (! $staff) {
            return;
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $token = bin2hex(random_bytes(24));

        OtpCode::where('email', $email)->where('audience', 'staff')->whereNull('consumed_at')->update(['consumed_at' => now()]);
        OtpCode::create([
            'email' => $email,
            'audience' => 'staff',
            'code_hash' => IssueLoginCode::codeHash($email, $code),
            'link_hash' => IssueLoginCode::linkHash($token),
            'expires_at' => now()->addMinutes(IssueLoginCode::TTL_MINUTES),
        ]);

        $link = rtrim((string) config('app.frontend_url'), '/').'/admin/verify?'.http_build_query(['email' => $email, 'token' => $token]);
        Mail::to($email)->queue(new LoginCodeMail(explode(' ', trim($staff->name))[0], $code, $link, IssueLoginCode::TTL_MINUTES));
    }
}
