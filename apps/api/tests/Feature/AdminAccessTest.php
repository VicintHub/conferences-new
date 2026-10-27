<?php

namespace Tests\Feature;

use App\Domain\Registration\Models\Attendee;
use App\Domain\Registration\Models\OtpCode;
use App\Domain\Staff\Enums\StaffRole;
use App\Domain\Staff\Models\StaffUser;
use App\Domain\Store\Models\Order;
use App\Mail\LoginCodeMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    private function staff(StaffRole $role = StaffRole::Admin, string $email = 'kunle@example.com'): StaffUser
    {
        return StaffUser::create(['name' => 'Kunle Okafor', 'email' => $email, 'role' => $role, 'title' => 'Registration lead']);
    }

    private function as(StaffUser $s): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($s->createToken('t')->plainTextToken);
    }

    public function test_staff_sign_in_with_an_emailed_code_and_get_a_token(): void
    {
        Mail::fake();
        $this->staff();

        $this->postJson('/api/v1/admin/auth/otp', ['email' => 'Kunle@Example.com'])->assertStatus(202);
        $code = null;
        Mail::assertQueued(LoginCodeMail::class, function ($m) use (&$code) {
            $code = $m->code;

            return $m->hasTo('kunle@example.com') && str_contains($m->link, '/admin/verify?');
        });

        $res = $this->postJson('/api/v1/admin/auth/verify', ['email' => 'kunle@example.com', 'code' => $code])->assertOk();
        $this->assertSame('Kunle Okafor', $res->json('data.name'));
        $this->assertSame('Registration lead', $res->json('data.title'));
        $token = $res->json('meta.token');

        $this->app['auth']->forgetGuards();
        $this->flushHeaders();
        $this->withToken($token)->getJson('/api/v1/admin/me')->assertOk()->assertJsonPath('data.email', 'kunle@example.com')
            ->assertJsonStructure(['meta' => ['badges' => ['approvals', 'testimonies']]]);
    }

    public function test_the_emailed_link_works_once_and_is_not_reusable(): void
    {
        Mail::fake();
        $this->staff();
        $this->postJson('/api/v1/admin/auth/otp', ['email' => 'kunle@example.com']);
        $link = null;
        Mail::assertQueued(LoginCodeMail::class, function ($m) use (&$link) {
            $link = $m->link;

            return true;
        });
        parse_str(parse_url($link, PHP_URL_QUERY), $q);

        $this->postJson('/api/v1/admin/auth/verify-link', $q)->assertOk()->assertJsonStructure(['meta' => ['token']]);
        $this->postJson('/api/v1/admin/auth/verify-link', $q)->assertUnprocessable();
    }

    public function test_strangers_and_inactive_staff_get_no_email_and_the_same_answer(): void
    {
        Mail::fake();
        $this->staff(email: 'gone@example.com')->update(['active' => false]);

        $this->postJson('/api/v1/admin/auth/otp', ['email' => 'nobody@example.com'])->assertStatus(202);
        Cache::flush();
        $this->postJson('/api/v1/admin/auth/otp', ['email' => 'gone@example.com'])->assertStatus(202);
        Mail::assertNothingQueued();
    }

    public function test_a_wrong_code_locks_after_five_attempts(): void
    {
        Mail::fake();
        $this->staff();
        $this->postJson('/api/v1/admin/auth/otp', ['email' => 'kunle@example.com']);
        $code = null;
        Mail::assertQueued(LoginCodeMail::class, function ($m) use (&$code) {
            $code = $m->code;

            return true;
        });

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/admin/auth/verify', ['email' => 'kunle@example.com', 'code' => '000000'])->assertUnprocessable();
        }
        $this->postJson('/api/v1/admin/auth/verify', ['email' => 'kunle@example.com', 'code' => $code])->assertUnprocessable();
    }

    public function test_attendee_codes_and_staff_codes_cannot_be_swapped(): void
    {
        Mail::fake();
        // Someone is both an attendee and (by coincidence of address) on the staff list.
        $a = Attendee::create(['full_name' => 'Kunle O', 'email' => 'kunle@example.com', 'age_band' => '18-45', 'email_verified_at' => now()]);
        $a->registration()->create(['category' => 'delegate', 'mode' => 'online', 'days' => ['2027-01-19'], 'status' => 'confirmed', 'claim_code' => 'JC27-DLG-12345']);
        $this->staff();

        $this->postJson('/api/v1/auth/otp', ['email' => 'kunle@example.com'])->assertStatus(202);
        $attendeeCode = null;
        Mail::assertQueued(LoginCodeMail::class, function ($m) use (&$attendeeCode) {
            $attendeeCode = $m->code;

            return true;
        });
        $this->postJson('/api/v1/admin/auth/verify', ['email' => 'kunle@example.com', 'code' => $attendeeCode])->assertUnprocessable();
        $this->assertSame(1, OtpCode::where('audience', 'attendee')->count());
    }

    public function test_tokens_only_work_on_their_own_side(): void
    {
        $staff = $this->staff();
        $attendee = Attendee::create(['full_name' => 'Ade', 'email' => 'ade@example.com', 'age_band' => '18-45', 'email_verified_at' => now()]);
        $attendee->registration()->create(['category' => 'delegate', 'mode' => 'online', 'days' => ['2027-01-19'], 'status' => 'confirmed', 'claim_code' => 'JC27-DLG-54321']);

        // Ids can collide between the two tables; neither token may pass for the other kind of user.
        $this->assertSame($staff->id, $attendee->id);
        $this->app['auth']->forgetGuards();
        $this->withToken($staff->createToken('t')->plainTextToken)->getJson('/api/v1/me')->assertUnauthorized();
        $this->app['auth']->forgetGuards();
        $this->withToken($attendee->createToken('t')->plainTextToken)->getJson('/api/v1/admin/me')->assertUnauthorized();
        $this->app['auth']->forgetGuards();
        $this->withToken($attendee->createToken('t')->plainTextToken)->getJson('/api/v1/admin/overview')->assertUnauthorized();
    }

    public function test_an_order_is_not_opened_by_a_staff_token_with_a_matching_id(): void
    {
        $staff = $this->staff();
        $attendee = Attendee::create(['full_name' => 'Ade', 'email' => 'ade@example.com', 'age_band' => '18-45', 'email_verified_at' => now()]);
        $order = Order::create([
            'code' => 'MV-00001', 'access_token' => 'secret', 'attendee_id' => $attendee->id, 'customer_name' => 'Ade', 'customer_email' => 'ade@example.com',
            'status' => 'paid', 'method' => 'card', 'subtotal_kobo' => 1, 'fee_kobo' => 0, 'total_kobo' => 1,
        ]);

        $this->assertSame($staff->id, $attendee->id);
        $this->as($staff)->getJson("/api/v1/shop/orders/{$order->code}")->assertNotFound();
    }

    public function test_roles_limit_what_staff_can_open(): void
    {
        $registration = $this->staff(StaffRole::Registration, 'reg@example.com');
        $moderator = $this->staff(StaffRole::Moderator, 'mod@example.com');

        $this->as($registration)->getJson('/api/v1/admin/overview')->assertOk();
        $this->as($registration)->getJson('/api/v1/admin/registrants')->assertOk();
        $this->as($moderator)->getJson('/api/v1/admin/overview')->assertOk();
        $this->as($moderator)->getJson('/api/v1/admin/registrants')->assertForbidden();
        $this->as($moderator)->getJson('/api/v1/admin/orders')->assertForbidden();
        $this->as($registration)->getJson('/api/v1/admin/me')->assertJsonPath('data.areas', StaffRole::Registration->areas());
    }

    public function test_deactivated_staff_lose_access_immediately(): void
    {
        $staff = $this->staff();
        $token = $staff->createToken('t')->plainTextToken;
        $this->withToken($token)->getJson('/api/v1/admin/me')->assertOk();

        $staff->update(['active' => false]);
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/admin/me')->assertUnauthorized();
    }

    public function test_logging_out_revokes_the_token(): void
    {
        $staff = $this->staff();
        $token = $staff->createToken('t')->plainTextToken;
        $this->withToken($token)->postJson('/api/v1/admin/auth/logout')->assertNoContent();
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/admin/me')->assertUnauthorized();
    }

    public function test_the_console_needs_a_token(): void
    {
        $this->getJson('/api/v1/admin/me')->assertUnauthorized();
        $this->getJson('/api/v1/admin/overview')->assertUnauthorized();
    }
}
