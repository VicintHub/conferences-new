<?php

namespace Tests\Feature;

use App\Domain\Registration\Models\Attendee;
use App\Mail\TeamInviteMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TeamsApiTest extends TestCase
{
    use RefreshDatabase;

    private function attendee(string $email = 'ade@example.com', string $category = 'delegate', bool $verifiedMinister = false, string $name = 'Adebayo Ogunleye'): Attendee
    {
        $a = Attendee::create(['full_name' => $name, 'email' => $email, 'church' => 'Christ Life Assembly', 'age_band' => '18-45', 'email_verified_at' => now()]);
        $a->registration()->create([
            'category' => $category, 'mode' => 'onsite', 'days' => ['2027-01-19'], 'status' => 'confirmed',
            'claim_code' => 'JC27-'.strtoupper(substr($category, 0, 3)).'-'.random_int(10000, 99999),
            'minister_verified_at' => $verifiedMinister ? now() : null,
        ]);

        return $a;
    }

    private function as(Attendee $a): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($a->createToken('t')->plainTextToken);
    }

    private function member(array $over = []): array
    {
        return $over + ['full_name' => 'Funmi Adeleke', 'email' => 'funmi@example.com', 'phone' => '+2348122204410', 'category' => 'delegate', 'mode' => 'onsite'];
    }

    public function test_a_leader_creates_a_church_team_with_a_code_from_the_church_name(): void
    {
        $leader = $this->attendee();

        $res = $this->as($leader)->postJson('/api/v1/me/teams/church', [])->assertCreated();

        $this->assertMatchesRegularExpression('/^CLA-[A-Z2-9]{4}$/', $res->json('data.code'));
        $this->assertSame('Christ Life Assembly', $res->json('data.name'));
        $this->assertTrue($res->json('data.is_leader'));
        $this->assertSame('leader', $res->json('data.members.0.role'));
        $this->assertSame(1, $res->json('data.stats.members'));
        $this->assertStringContainsString('/app/team?join=CLA-', $res->json('data.share_url'));
    }

    public function test_the_leader_can_rename_the_team_and_the_code_stays(): void
    {
        $leader = $this->attendee();
        $code = $this->as($leader)->postJson('/api/v1/me/teams/church', [])->json('data.code');
        $this->as($leader)->patchJson('/api/v1/me/teams/church', ['name' => 'CLA Ibadan Central'])->assertOk()
            ->assertJsonPath('data.name', 'CLA Ibadan Central')->assertJsonPath('data.code', $code);
        $this->as($leader)->patchJson('/api/v1/me/teams/church', ['name' => ''])->assertUnprocessable();
        $this->as($this->attendee('x@example.com'))->patchJson('/api/v1/me/teams/church', ['name' => 'Mine now'])->assertNotFound();
    }

    public function test_show_reports_no_team_and_whether_one_can_be_created(): void
    {
        $this->as($this->attendee())->getJson('/api/v1/me/teams/church')
            ->assertOk()->assertJsonPath('data', null)->assertJsonPath('meta.can_create', true);

        $this->as($this->attendee('m@example.com', 'minister'))->getJson('/api/v1/me/teams/minister')
            ->assertJsonPath('meta.can_create', false)->assertJsonPath('meta.is_minister', true)->assertJsonPath('meta.minister_verified', false);
    }

    public function test_adding_a_member_creates_a_pending_ticket_and_emails_them(): void
    {
        Mail::fake();
        $leader = $this->attendee();
        $this->as($leader)->postJson('/api/v1/me/teams/church', []);

        $res = $this->as($leader)->postJson('/api/v1/me/teams/church/members', $this->member())->assertCreated();

        $this->assertSame('invited', $res->json('data.status'));
        $this->assertSame('funmi@example.com', $res->json('data.email'));
        $added = Attendee::where('email', 'funmi@example.com')->first();
        $this->assertNull($added->email_verified_at);
        $this->assertSame('pending_verification', $added->registration->status);
        $this->assertSame('Christ Life Assembly', $added->church);
        Mail::assertQueued(TeamInviteMail::class, fn ($m) => $m->hasTo('funmi@example.com') && $m->invitedBy === 'Adebayo Ogunleye');
    }

    public function test_the_invited_person_becomes_confirmed_when_they_use_the_emailed_code(): void
    {
        Mail::fake();
        $leader = $this->attendee();
        $this->as($leader)->postJson('/api/v1/me/teams/church', []);
        $this->as($leader)->postJson('/api/v1/me/teams/church/members', $this->member());
        $this->assertSame('invited', $this->as($leader)->getJson('/api/v1/me/teams/church')->json('data.members.1.status'));

        $code = null;
        Mail::assertQueued(TeamInviteMail::class, function ($m) use (&$code) {
            $code = $m->code;

            return true;
        });
        $this->app['auth']->forgetGuards();
        $this->flushHeaders();
        $this->postJson('/api/v1/auth/verify', ['email' => 'funmi@example.com', 'code' => $code])->assertOk();

        $res = $this->as($leader)->getJson('/api/v1/me/teams/church');
        $this->assertSame('confirmed', $res->json('data.members.1.status'));
        $this->assertSame(2, $res->json('data.stats.confirmed'));
    }

    public function test_an_existing_account_cannot_be_added_without_consent(): void
    {
        $leader = $this->attendee();
        $this->attendee('taken@example.com', name: 'Someone Else');
        $this->as($leader)->postJson('/api/v1/me/teams/church', []);

        $this->as($leader)->postJson('/api/v1/me/teams/church/members', $this->member(['email' => 'taken@example.com']))
            ->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_only_the_leader_manages_the_team_and_teammates_do_not_see_contact_details(): void
    {
        $leader = $this->attendee();
        $code = $this->as($leader)->postJson('/api/v1/me/teams/church', [])->json('data.code');
        $other = $this->attendee('chidi@example.com', name: 'Chidi Okafor');

        $this->as($other)->postJson("/api/v1/teams/{$code}/join")->assertOk();
        $this->as($other)->postJson('/api/v1/me/teams/church/members', $this->member())->assertNotFound();

        $view = $this->as($other)->getJson('/api/v1/me/teams/church')->assertOk();
        $this->assertFalse($view->json('data.is_leader'));
        $this->assertArrayNotHasKey('email', $view->json('data.members.0'));
        $this->assertTrue($view->json('data.members.1.is_you'));
    }

    public function test_the_share_link_previews_the_team_and_joining_is_one_team_only(): void
    {
        $leader = $this->attendee();
        $code = $this->as($leader)->postJson('/api/v1/me/teams/church', [])->json('data.code');
        $joiner = $this->attendee('chidi@example.com', name: 'Chidi Okafor');

        $this->as($joiner)->getJson("/api/v1/teams/{$code}")->assertOk()
            ->assertJsonPath('data.name', 'Christ Life Assembly')->assertJsonPath('data.leader', 'Adebayo')->assertJsonPath('data.members', 1);
        $this->as($joiner)->postJson("/api/v1/teams/{$code}/join")->assertOk()->assertJsonPath('data.stats.members', 2);
        $this->as($joiner)->postJson("/api/v1/teams/{$code}/join")->assertUnprocessable();
        $this->as($joiner)->getJson('/api/v1/teams/NOPE-1234')->assertNotFound();

        $this->as($joiner)->deleteJson('/api/v1/me/teams/church/membership')->assertNoContent();
        $this->as($leader)->deleteJson('/api/v1/me/teams/church/membership')->assertUnprocessable();
    }

    public function test_the_team_size_is_capped(): void
    {
        Mail::fake();
        config(['conference.team_max' => 2]);
        $leader = $this->attendee();
        $this->as($leader)->postJson('/api/v1/me/teams/church', []);

        $this->as($leader)->postJson('/api/v1/me/teams/church/members', $this->member())->assertCreated();
        $this->as($leader)->postJson('/api/v1/me/teams/church/members', $this->member(['email' => 'b@example.com']))->assertUnprocessable();
    }

    public function test_removing_an_invited_member_deletes_the_unused_account_but_a_confirmed_one_keeps_theirs(): void
    {
        Mail::fake();
        $leader = $this->attendee();
        $code = $this->as($leader)->postJson('/api/v1/me/teams/church', [])->json('data.code');
        $invited = $this->as($leader)->postJson('/api/v1/me/teams/church/members', $this->member())->json('data.id');
        $joiner = $this->attendee('chidi@example.com', name: 'Chidi Okafor');
        $this->as($joiner)->postJson("/api/v1/teams/{$code}/join");
        $joinedId = $this->as($leader)->getJson('/api/v1/me/teams/church')->json('data.members.2.id');

        $this->as($leader)->deleteJson("/api/v1/me/teams/church/members/{$invited}")->assertNoContent();
        $this->as($leader)->deleteJson("/api/v1/me/teams/church/members/{$joinedId}")->assertNoContent();

        $this->assertDatabaseMissing('attendees', ['email' => 'funmi@example.com']);
        $this->assertDatabaseHas('attendees', ['email' => 'chidi@example.com']);
        $leaderRow = $this->as($leader)->getJson('/api/v1/me/teams/church')->json('data.members.0.id');
        $this->as($leader)->deleteJson("/api/v1/me/teams/church/members/{$leaderRow}")->assertUnprocessable();
    }

    public function test_resending_an_invitation_only_works_for_unconfirmed_members(): void
    {
        Mail::fake();
        $leader = $this->attendee();
        $this->as($leader)->postJson('/api/v1/me/teams/church', []);
        $id = $this->as($leader)->postJson('/api/v1/me/teams/church/members', $this->member())->json('data.id');
        Cache::flush(); // the sign-in email has a per-address cooldown

        $this->as($leader)->postJson("/api/v1/me/teams/church/members/{$id}/resend")->assertOk();
        Mail::assertQueued(TeamInviteMail::class, 2);

        Attendee::where('email', 'funmi@example.com')->first()->registration->update(['status' => 'confirmed']);
        $this->as($leader)->postJson("/api/v1/me/teams/church/members/{$id}/resend")->assertUnprocessable();
    }

    public function test_csv_import_adds_good_rows_and_reports_the_rest(): void
    {
        Mail::fake();
        $leader = $this->attendee();
        $this->attendee('taken@example.com', name: 'Someone Else');
        $this->as($leader)->postJson('/api/v1/me/teams/church', []);

        $res = $this->as($leader)->postJson('/api/v1/me/teams/church/members/import', ['members' => [
            $this->member(),
            $this->member(['full_name' => 'Taken', 'email' => 'taken@example.com']),
            $this->member(['full_name' => 'Ruth Oyelaran', 'email' => 'ruth@example.com', 'mode' => 'online']),
            $this->member(['full_name' => 'Dupe', 'email' => 'funmi@example.com']),
        ]])->assertOk();

        $this->assertSame(2, $res->json('data.added'));
        $this->assertSame([2, 4], array_column($res->json('data.skipped'), 'row'));
        $this->as($leader)->postJson('/api/v1/me/teams/church/members/import', ['members' => [['full_name' => 'x']]])->assertUnprocessable();
    }

    public function test_a_minister_team_needs_a_verified_minister_then_takes_one_spouse_and_three_aides(): void
    {
        Mail::fake();
        $unverified = $this->attendee('u@example.com', 'minister');
        $this->as($unverified)->postJson('/api/v1/me/teams/minister', [])->assertUnprocessable();
        $this->as($this->attendee('d@example.com'))->postJson('/api/v1/me/teams/minister', [])->assertUnprocessable();

        $minister = $this->attendee('m@example.com', 'minister', true, 'Grace Adeyemi');
        $res = $this->as($minister)->postJson('/api/v1/me/teams/minister', [])->assertCreated();
        $this->assertSame('Grace Adeyemi', $res->json('data.name'));

        $spouse = $this->member(['role' => 'spouse', 'full_name' => 'Tunde Adeyemi', 'email' => 'tunde@example.com']);
        $this->as($minister)->postJson('/api/v1/me/teams/minister/members', $spouse)->assertCreated()->assertJsonPath('data.role', 'spouse');
        $this->as($minister)->postJson('/api/v1/me/teams/minister/members', ['email' => 'tunde2@example.com'] + $spouse)->assertUnprocessable();

        foreach (['a', 'b', 'c'] as $n) {
            $this->as($minister)->postJson('/api/v1/me/teams/minister/members', $this->member(['role' => 'aide', 'title' => 'Protocol', 'email' => "{$n}@example.com"]))->assertCreated();
        }
        $this->as($minister)->postJson('/api/v1/me/teams/minister/members', $this->member(['role' => 'aide', 'title' => 'Protocol', 'email' => 'd@aides.com']))->assertUnprocessable();
        $this->as($minister)->postJson('/api/v1/me/teams/minister/members', $this->member(['role' => 'aide', 'email' => 'e@example.com']))->assertUnprocessable()->assertJsonValidationErrors('title');
        $this->as($minister)->postJson('/api/v1/me/teams/minister/members', $this->member(['role' => 'member', 'email' => 'f@example.com']))->assertUnprocessable();

        $this->assertSame(5, $this->as($minister)->getJson('/api/v1/me/teams/minister')->json('data.stats.members'));
    }

    public function test_requests_need_a_signed_in_attendee(): void
    {
        $this->getJson('/api/v1/me/teams/church')->assertUnauthorized();
        $this->postJson('/api/v1/teams/CLA-1234/join')->assertUnauthorized();
        $this->getJson('/api/v1/me/teams/other')->assertNotFound();
    }
}
