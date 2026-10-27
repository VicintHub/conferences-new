<?php

namespace Tests\Feature;

use App\Domain\Registration\Models\Attendee;
use App\Domain\Registration\Models\OtpCode;
use App\Mail\LoginCodeMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class RegistrationApiTest extends TestCase
{
    use RefreshDatabase;

    private const EMAIL = 'ade@example.com';

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'category' => 'delegate',
            'full_name' => 'Adebayo Ogunleye',
            'email' => self::EMAIL,
            'phone' => '+2348034567821',
            'church' => 'Christ Life Assembly, Ibadan',
            'age_band' => '18-45',
            'mode' => 'onsite',
            'days' => ['2027-01-19', '2027-01-20'],
            'needs_accommodation' => true,
            'consent' => true,
        ], $overrides);
    }

    private function lastMail(string $email = self::EMAIL): LoginCodeMail
    {
        return Mail::queued(LoginCodeMail::class, fn (LoginCodeMail $m) => $m->hasTo($email))->last();
    }

    private function register(array $overrides = []): LoginCodeMail
    {
        $payload = $this->payload($overrides);
        $this->postJson('/api/v1/registrations', $payload)->assertAccepted();

        return $this->lastMail(strtolower($payload['email']));
    }

    public function test_registering_with_the_emailed_code_confirms_and_signs_in(): void
    {
        $mail = $this->register();

        $this->assertDatabaseHas('registrations', ['status' => 'pending_verification']);
        $this->getJson('/api/v1/capacity')->assertJsonPath('data.onsite.taken', 0);

        $res = $this->postJson('/api/v1/auth/verify', ['email' => self::EMAIL, 'code' => $mail->code])->assertOk();

        $res->assertJsonPath('data.attendee.first_name', 'Adebayo')
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.mode', 'onsite')
            ->assertJsonPath('meta.existing_account', false)
            ->assertJsonPath('meta.downgraded_to_online', false);
        $this->assertMatchesRegularExpression('/^JC27-DLG-\d{5}$/', $res->json('data.claim_code'));

        $this->withToken($res->json('meta.token'))->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.attendee.email', self::EMAIL);
        $this->getJson('/api/v1/capacity')->assertJsonPath('data.onsite.taken', 1);
    }

    public function test_the_emailed_link_works_instead_of_the_code_and_is_single_use(): void
    {
        $mail = $this->register();
        parse_str(parse_url($mail->link, PHP_URL_QUERY), $q);
        $this->assertSame(self::EMAIL, $q['email']);

        $this->postJson('/api/v1/auth/verify-link', $q)->assertOk()->assertJsonPath('data.status', 'confirmed');
        $this->postJson('/api/v1/auth/verify-link', $q)->assertStatus(422)->assertJsonPath('code', 'invalid_otp');
        $this->postJson('/api/v1/auth/verify', ['email' => self::EMAIL, 'code' => $mail->code])->assertStatus(422);
    }

    public function test_using_the_code_invalidates_the_link(): void
    {
        $mail = $this->register();
        $this->postJson('/api/v1/auth/verify', ['email' => self::EMAIL, 'code' => $mail->code])->assertOk();

        parse_str(parse_url($mail->link, PHP_URL_QUERY), $q);
        $this->postJson('/api/v1/auth/verify-link', $q)->assertStatus(422);
    }

    public function test_wrong_code_is_rejected_and_locks_after_five_failures(): void
    {
        $mail = $this->register();
        $wrong = $mail->code === '123456' ? '654321' : '123456';

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/verify', ['email' => self::EMAIL, 'code' => $wrong])->assertStatus(422);
        }
        $this->postJson('/api/v1/auth/verify', ['email' => self::EMAIL, 'code' => $mail->code])->assertStatus(422);
        $this->assertNull(Attendee::first()->email_verified_at);
    }

    public function test_wrong_link_token_is_rejected(): void
    {
        $this->register();
        $this->postJson('/api/v1/auth/verify-link', ['email' => self::EMAIL, 'token' => str_repeat('a', 48)])->assertStatus(422);
    }

    public function test_expired_code_is_rejected(): void
    {
        $mail = $this->register();
        OtpCode::query()->update(['expires_at' => now()->subSecond()]);

        $this->postJson('/api/v1/auth/verify', ['email' => self::EMAIL, 'code' => $mail->code])->assertStatus(422);
    }

    public function test_resend_is_rate_limited_per_address_with_an_identical_response(): void
    {
        $this->register();
        Mail::assertQueuedCount(1);

        $this->postJson('/api/v1/auth/otp', ['email' => self::EMAIL])->assertAccepted()->assertExactJson(['resend_after' => 60]);
        Mail::assertQueuedCount(1);

        Cache::flush();
        $this->postJson('/api/v1/auth/otp', ['email' => self::EMAIL])->assertAccepted();
        Mail::assertQueuedCount(2);
    }

    public function test_a_new_code_supersedes_the_previous_one(): void
    {
        $first = $this->register();
        Cache::flush();
        $this->postJson('/api/v1/auth/otp', ['email' => self::EMAIL])->assertAccepted();
        $second = $this->lastMail();

        $this->postJson('/api/v1/auth/verify', ['email' => self::EMAIL, 'code' => $first->code])->assertStatus(422);
        $this->postJson('/api/v1/auth/verify', ['email' => self::EMAIL, 'code' => $second->code])->assertOk();
    }

    public function test_existing_attendee_signs_in_with_a_code_and_is_not_overwritten(): void
    {
        $this->postJson('/api/v1/auth/verify', ['email' => self::EMAIL, 'code' => $this->register()->code])->assertOk();
        Cache::flush();

        // Re-registering the same address responds the same but only sends a sign-in email.
        $mail = $this->register(['full_name' => 'Someone Else', 'mode' => 'online']);
        $this->assertSame('Adebayo', $mail->firstName);

        $this->postJson('/api/v1/auth/verify', ['email' => self::EMAIL, 'code' => $mail->code])
            ->assertOk()
            ->assertJsonPath('meta.existing_account', true)
            ->assertJsonPath('data.attendee.full_name', 'Adebayo Ogunleye')
            ->assertJsonPath('data.mode', 'onsite');
        $this->getJson('/api/v1/capacity')->assertJsonPath('data.onsite.taken', 1);
    }

    public function test_login_for_unknown_email_looks_identical_and_sends_nothing(): void
    {
        $this->postJson('/api/v1/auth/otp', ['email' => 'nobody@example.com'])->assertAccepted()->assertExactJson(['resend_after' => 60]);
        Mail::assertNothingQueued();
    }

    public function test_resubmitting_before_verifying_updates_the_pending_registration(): void
    {
        $this->register();
        Cache::flush();
        $mail = $this->register(['full_name' => 'Adebayo O. Ogunleye', 'mode' => 'online']);

        $this->assertDatabaseCount('attendees', 1);
        $this->postJson('/api/v1/auth/verify', ['email' => self::EMAIL, 'code' => $mail->code])
            ->assertOk()->assertJsonPath('data.attendee.full_name', 'Adebayo O. Ogunleye')->assertJsonPath('data.mode', 'online');
        $this->getJson('/api/v1/capacity')->assertJsonPath('data.onsite.taken', 0);
    }

    public function test_email_is_case_insensitive(): void
    {
        $mail = $this->register(['email' => 'Ade@Example.COM']);
        $this->postJson('/api/v1/auth/verify', ['email' => 'ADE@example.com', 'code' => $mail->code])->assertOk();
    }

    public function test_onsite_overflow_falls_back_to_online_at_verification(): void
    {
        config(['conference.onsite_capacity' => 1]);

        $a = $this->register(['email' => 'a@example.com']);
        $b = $this->register(['email' => 'b@example.com']);

        $this->postJson('/api/v1/auth/verify', ['email' => 'a@example.com', 'code' => $a->code])->assertOk()->assertJsonPath('data.mode', 'onsite');
        $this->getJson('/api/v1/capacity')->assertJsonPath('data.onsite.full', true);

        $this->postJson('/api/v1/auth/verify', ['email' => 'b@example.com', 'code' => $b->code])
            ->assertOk()->assertJsonPath('data.mode', 'online')->assertJsonPath('meta.downgraded_to_online', true);
        $this->getJson('/api/v1/capacity')->assertJsonPath('data.onsite.taken', 1);
    }

    public function test_validation(): void
    {
        $this->postJson('/api/v1/registrations', $this->payload(['email' => 'nope', 'consent' => false, 'days' => []]))
            ->assertUnprocessable()->assertJsonValidationErrors(['email', 'consent', 'days']);
        $this->postJson('/api/v1/registrations', $this->payload(['days' => ['2027-02-01']]))->assertJsonValidationErrors('days.0');
        $this->postJson('/api/v1/registrations', $this->payload(['phone' => '0803']))->assertJsonValidationErrors('phone');
        $this->postJson('/api/v1/registrations', $this->payload(['phone' => null]))->assertAccepted();
        $this->postJson('/api/v1/auth/verify', ['email' => self::EMAIL, 'code' => '12'])->assertJsonValidationErrors('code');
        Mail::assertQueuedCount(1);
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
    }
}
