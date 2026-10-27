<?php

namespace App\Domain\Registration\Actions;

use App\Domain\Registration\Enums\RegistrationCategory;
use App\Domain\Registration\Models\Attendee;
use Illuminate\Support\Facades\DB;

/**
 * Records the registration as pending and emails the verification code + link.
 * If the address already belongs to a verified attendee nothing is overwritten: they just get a sign-in email,
 * so the response is identical either way and reveals nothing about who is registered.
 */
class StartRegistration
{
    public function __construct(private IssueLoginCode $issue, private GenerateClaimCode $claimCode) {}

    /** @param  array<string, mixed>  $data  validated payload (see RegisterRequest) */
    public function __invoke(array $data): void
    {
        $existing = Attendee::where('email', $data['email'])->first();

        if (! $existing || ! $existing->email_verified_at) {
            DB::transaction(function () use ($data, $existing) {
                $attendee = $existing ?? new Attendee(['email' => $data['email']]);
                $attendee->fill([
                    'full_name' => $data['full_name'],
                    'phone' => $data['phone'] ?? null,
                    'church' => $data['church'] ?? null,
                    'location' => $data['location'] ?? null,
                    'age_band' => $data['age_band'],
                ])->save();

                $category = RegistrationCategory::from($data['category']);
                $fields = [
                    'category' => $category,
                    'mode' => $data['mode'],
                    'days' => array_values(array_unique($data['days'])),
                    'needs_accommodation' => (bool) ($data['needs_accommodation'] ?? false),
                    'consented_at' => now(),
                ];

                $registration = $attendee->registration;
                if ($registration) {
                    $registration->update($fields);
                } else {
                    $attendee->registration()->create($fields + ['status' => 'pending_verification', 'claim_code' => ($this->claimCode)($category)]);
                }
            });
        }

        ($this->issue)($data['email']);
    }
}
