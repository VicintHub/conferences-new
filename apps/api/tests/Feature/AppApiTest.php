<?php

namespace Tests\Feature;

use App\Domain\Programme\Models\ProgrammeSession;
use App\Domain\Registration\Models\Attendee;
use Database\Seeders\ProgrammeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppApiTest extends TestCase
{
    use RefreshDatabase;

    private function attendee(string $mode = 'onsite', string $status = 'confirmed'): Attendee
    {
        $a = Attendee::create(['full_name' => 'Adebayo Ogunleye', 'email' => 'ade@example.com', 'church' => 'CLA', 'age_band' => '18-45', 'email_verified_at' => now()]);
        $a->registration()->create(['category' => 'delegate', 'mode' => $mode, 'days' => ['2027-01-19'], 'status' => $status, 'claim_code' => 'JC27-DLG-48213']);

        return $a;
    }

    private function actingAsAttendee(Attendee $a): static
    {
        return $this->withToken($a->createToken('t')->plainTextToken);
    }

    public function test_programme_is_public_grouped_by_day_and_ordered(): void
    {
        $this->seed(ProgrammeSeeder::class);

        $res = $this->getJson('/api/v1/programme')->assertOk();

        $res->assertHeader('Cache-Control', 'max-age=60, public');
        $days = $res->json('data');
        $this->assertCount(6, $days);
        $this->assertSame('2027-01-19', $days[0]['date']);
        $this->assertSame('Evening of Worship', $days[0]['sessions'][0]['title']);
        $this->assertSame('Royal Conf. + IYLC', collect($days)->firstWhere('date', '2027-01-23')['title']);
        $sat = collect($days)->firstWhere('date', '2027-01-23')['sessions'];
        $this->assertSame(['Arrival & check-in', 'Royal Conference', 'Lunch', 'IYLC'], array_column($sat, 'title'));
        $this->assertSame('2027-01-23T07:00:00+01:00', $sat[0]['starts_at']);
    }

    public function test_me_returns_registration_ticket_badge_state_and_access(): void
    {
        $a = $this->attendee();

        $res = $this->actingAsAttendee($a)->getJson('/api/v1/me')->assertOk();

        $res->assertJsonPath('data.claim_code', 'JC27-DLG-48213')
            ->assertJsonPath('data.attendee.first_name', 'Adebayo')
            ->assertJsonPath('data.attendee.church', 'CLA')
            ->assertJsonPath('data.badge', null)
            ->assertJsonCount(4, 'data.access');

        $a->registration->update(['badge_printed_at' => '2027-01-23 08:00:00']);
        $this->app['auth']->forgetGuards(); // the test client caches the resolved user between requests
        $this->actingAsAttendee($a)->getJson('/api/v1/me')->assertJsonPath('data.badge.printed_at', fn ($v) => str_starts_with($v, '2027-01-23'));
    }

    public function test_me_requires_a_token(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
        $this->patchJson('/api/v1/me/registration', ['mode' => 'online'])->assertUnauthorized();
    }

    public function test_switching_to_online_frees_the_seat_and_back_takes_it(): void
    {
        $a = $this->attendee();
        \DB::table('capacity_counters')->insert(['name' => 'onsite', 'taken' => 1]);

        $this->actingAsAttendee($a)->patchJson('/api/v1/me/registration', ['mode' => 'online'])->assertOk()->assertJsonPath('data.mode', 'online');
        $this->getJson('/api/v1/capacity')->assertJsonPath('data.onsite.taken', 0);

        $this->actingAsAttendee($a)->patchJson('/api/v1/me/registration', ['mode' => 'onsite'])->assertOk()->assertJsonPath('data.mode', 'onsite');
        $this->getJson('/api/v1/capacity')->assertJsonPath('data.onsite.taken', 1);
    }

    public function test_switching_to_onsite_is_refused_when_full(): void
    {
        config(['conference.onsite_capacity' => 1]);
        \DB::table('capacity_counters')->insert(['name' => 'onsite', 'taken' => 1]);

        $this->actingAsAttendee($this->attendee('online'))->patchJson('/api/v1/me/registration', ['mode' => 'onsite'])
            ->assertStatus(409)->assertJsonPath('code', 'onsite_full');
        $this->getJson('/api/v1/capacity')->assertJsonPath('data.onsite.taken', 1);
    }

    public function test_repeating_the_same_mode_changes_nothing(): void
    {
        \DB::table('capacity_counters')->insert(['name' => 'onsite', 'taken' => 1]);
        $this->actingAsAttendee($this->attendee())->patchJson('/api/v1/me/registration', ['mode' => 'onsite'])->assertOk();
        $this->getJson('/api/v1/capacity')->assertJsonPath('data.onsite.taken', 1);
    }

    public function test_logout_revokes_the_token(): void
    {
        $a = $this->attendee();
        $token = $a->createToken('t')->plainTextToken;

        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_seeded_times_are_venue_times_whatever_the_app_timezone(): void
    {
        config(['app.timezone' => 'UTC']);
        date_default_timezone_set('UTC');
        $this->seed(ProgrammeSeeder::class);

        $first = ProgrammeSession::orderBy('starts_at')->first();
        $this->assertSame('2027-01-19T17:00:00+01:00', $first->starts_at->copy()->setTimezone('Africa/Lagos')->toIso8601String());
        $this->assertSame('2027-01-19T16:00:00+00:00', $first->starts_at->toIso8601String());
    }
}
