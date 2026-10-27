<?php

namespace Tests\Feature;

use App\Domain\Applications\Models\Application;
use App\Domain\Broadcasts\Actions\DispatchDueBroadcasts;
use App\Domain\Live\Models\LiveState;
use App\Domain\Programme\Models\ProgrammeSession;
use App\Domain\Publicity\Models\PublicityItem;
use App\Domain\Registration\Models\Attendee;
use App\Domain\Registration\Models\Registration;
use App\Domain\Staff\Enums\StaffRole;
use App\Domain\Staff\Models\StaffUser;
use App\Domain\Store\Models\Order;
use App\Domain\Teams\Actions\CreateTeam;
use App\Domain\Teams\Enums\TeamKind;
use App\Domain\Testimonies\Models\SessionFeedback;
use App\Domain\Testimonies\Models\Testimony;
use App\Mail\ApplicationDecisionMail;
use App\Mail\BroadcastMail;
use App\Mail\MinisterVerificationMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminConsoleTest extends TestCase
{
    use RefreshDatabase;

    private int $n = 0;

    private function admin(StaffRole $role = StaffRole::Admin): static
    {
        $staff = StaffUser::firstOrCreate(['email' => "{$role->value}@example.com"], ['name' => 'Kunle Okafor', 'role' => $role]);
        $this->app['auth']->forgetGuards();

        return $this->withToken($staff->createToken('t')->plainTextToken);
    }

    private function attendee(array $over = [], array $reg = []): Attendee
    {
        $this->n++;
        $a = Attendee::create($over + ['full_name' => "Person {$this->n}", 'email' => "p{$this->n}@example.com", 'church' => 'Christ Life Assembly', 'age_band' => '18-45', 'email_verified_at' => now()]);
        $a->registration()->create($reg + ['category' => 'delegate', 'mode' => 'onsite', 'days' => ['2027-01-19'], 'status' => 'confirmed', 'claim_code' => 'JC27-DLG-'.str_pad((string) $this->n, 5, '0', STR_PAD_LEFT)]);

        return $a;
    }

    public function test_overview_counts_registrations_capacity_and_the_waiting_queue(): void
    {
        Carbon::setTestNow('2026-11-10 12:00:00');
        config(['conference.onsite_capacity' => 10]);
        $this->attendee();
        $this->attendee(reg: ['mode' => 'online']);
        $this->attendee(['age_band' => '46+'], ['category' => 'international']);
        $this->attendee(reg: ['category' => 'minister']);
        $this->attendee(reg: ['status' => 'pending_verification']); // not counted
        Registration::query()->where('claim_code', 'JC27-DLG-00001')->update(['created_at' => now()->subDays(3)]);
        DB::table('capacity_counters')->insert(['name' => 'onsite', 'taken' => 4]);

        $d = $this->admin()->getJson('/api/v1/admin/overview')->assertOk()->json('data');

        $this->assertSame(4, $d['kpis']['registered']['value']);
        $this->assertSame(3, $d['kpis']['registered']['today']);
        $this->assertSame(3, $d['kpis']['onsite']['value']);
        $this->assertSame(40, $d['kpis']['onsite']['percent_of_cap']);
        $this->assertSame(1, $d['kpis']['online']['value']);
        $this->assertSame(1, $d['kpis']['awaiting_approval']['value']); // the unverified minister
        $this->assertCount(14, $d['series']);
        $this->assertSame('2026-11-10', $d['series'][13]['date']);
        $this->assertSame(3, $d['series'][13]['count']);
        $this->assertSame(1, $d['series'][10]['count']);
        $this->assertSame(['taken' => 4, 'total' => 10, 'percent' => 40], $d['capacity']);
        $cats = collect($d['categories'])->pluck('count', 'key');
        $this->assertSame([2, 1, 1, 3], [$cats['delegate'], $cats['minister'], $cats['international'], $cats['iylc']]);
        Carbon::setTestNow();
    }

    public function test_registrants_are_searchable_filterable_and_paged(): void
    {
        foreach (range(1, 27) as $i) {
            $this->attendee(['full_name' => "Delegate {$i}"]);
        }
        $this->attendee(['full_name' => 'Pastor Grace Adeyemi', 'church' => 'Living Waters'], ['category' => 'minister', 'mode' => 'online']);

        $page1 = $this->admin()->getJson('/api/v1/admin/registrants')->assertOk();
        $this->assertCount(25, $page1->json('data'));
        $this->assertSame(['page' => 1, 'last_page' => 2, 'total' => 28], $page1->json('meta'));
        $this->assertSame('Pastor Grace Adeyemi', $page1->json('data.0.name')); // newest first

        $this->admin()->getJson('/api/v1/admin/registrants?search=living')->assertJsonPath('meta.total', 1);
        $this->admin()->getJson('/api/v1/admin/registrants?category=minister&mode=online')->assertJsonPath('meta.total', 1);
        $this->admin()->getJson('/api/v1/admin/registrants?mode=online')->assertJsonPath('meta.total', 1);
        $this->admin()->getJson('/api/v1/admin/registrants?search=JC27-DLG-00003')->assertJsonPath('meta.total', 1);
        $this->admin()->getJson('/api/v1/admin/registrants?category=wizard')->assertUnprocessable();
        $this->admin()->getJson('/api/v1/admin/registrants?search='.urlencode('%'))->assertJsonPath('meta.total', 0); // wildcard is literal
    }

    public function test_the_csv_export_has_every_registrant_and_defuses_formulas(): void
    {
        $this->attendee(['full_name' => '=HYPERLINK("http://evil","x")', 'church' => '+cmd|calc']);
        $this->attendee(['full_name' => 'Funmi Adeleke']);

        $res = $this->admin()->get('/api/v1/admin/registrants/export')->assertOk();
        $this->assertStringContainsString('text/csv', $res->headers->get('Content-Type'));
        $rows = array_map('str_getcsv', array_filter(explode("\n", $res->streamedContent())));

        $this->assertSame('Claim code', $rows[0][0]);
        $this->assertCount(3, $rows);
        $this->assertSame("'=HYPERLINK(\"http://evil\",\"x\")", $rows[1][1]);
        $this->assertSame("'+cmd|calc", $rows[1][4]);
        $this->assertSame('Funmi Adeleke', $rows[2][1]);
    }

    public function test_teams_and_orders_tables(): void
    {
        $leader = $this->attendee();
        app(CreateTeam::class)($leader, TeamKind::Church, 'Christ Life Assembly');
        Order::create(['code' => 'MV-00001', 'access_token' => 'x', 'customer_name' => 'Ada', 'customer_email' => 'ada@example.com', 'status' => 'paid', 'method' => 'card', 'subtotal_kobo' => 800000, 'fee_kobo' => 15600, 'total_kobo' => 815600, 'paid_at' => now()]);
        Order::create(['code' => 'MV-00002', 'access_token' => 'y', 'customer_name' => 'Bola', 'customer_email' => 'bola@example.com', 'status' => 'pending', 'method' => 'card', 'subtotal_kobo' => 1, 'fee_kobo' => 0, 'total_kobo' => 1]);

        $teams = $this->admin()->getJson('/api/v1/admin/teams')->assertOk();
        $this->assertEquals(['members' => 1, 'confirmed' => 1, 'leader' => 'Person 1'], array_intersect_key($teams->json('data.0'), array_flip(['members', 'confirmed', 'leader'])));
        $this->admin()->getJson('/api/v1/admin/teams?search=nomatch')->assertJsonPath('meta.total', 0);

        $this->admin()->getJson('/api/v1/admin/orders?status=paid')->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.code', 'MV-00001');
        $this->admin()->getJson('/api/v1/admin/orders?search=bola')->assertJsonPath('data.0.code', 'MV-00002');
    }

    public function test_orders_move_from_paid_to_collected_but_not_from_pending(): void
    {
        Order::create(['code' => 'MV-00001', 'access_token' => 'x', 'customer_name' => 'Ada', 'customer_email' => 'a@example.com', 'status' => 'paid', 'method' => 'card', 'subtotal_kobo' => 1, 'fee_kobo' => 0, 'total_kobo' => 1]);
        Order::create(['code' => 'MV-00002', 'access_token' => 'y', 'customer_name' => 'Bola', 'customer_email' => 'b@example.com', 'status' => 'pending', 'method' => 'card', 'subtotal_kobo' => 1, 'fee_kobo' => 0, 'total_kobo' => 1]);

        $this->admin()->patchJson('/api/v1/admin/orders/MV-00001', ['status' => 'collected'])->assertOk()->assertJsonPath('data.status', 'collected');
        $this->assertNotNull(Order::where('code', 'MV-00001')->first()->collected_at);
        $this->admin()->patchJson('/api/v1/admin/orders/MV-00002', ['status' => 'collected'])->assertUnprocessable();
        $this->admin()->patchJson('/api/v1/admin/orders/MV-00001', ['status' => 'paid'])->assertUnprocessable();
    }

    public function test_the_approvals_queue_mixes_ministers_and_applications_oldest_first(): void
    {
        $minister = $this->attendee(['full_name' => 'Pastor Grace Adeyemi', 'church' => 'Living Waters', 'location' => 'Osogbo'], ['category' => 'minister', 'created_at' => now()->subDays(2)]);
        $verified = $this->attendee(reg: ['category' => 'minister', 'minister_verified_at' => now()]);
        $applicant = $this->attendee(['full_name' => 'Kemi Ojo']);
        Application::create(['attendee_id' => $applicant->id, 'role' => 'media', 'status' => 'submitted', 'payload' => ['organisation' => 'Faith Lens TV', 'crew_size' => 2, 'contact_name' => 'Kemi', 'phone' => '+2348031234567', 'coverage_plan' => 'Live']]);
        Application::create(['attendee_id' => $applicant->id, 'role' => 'vip', 'status' => 'approved', 'payload' => ['title' => 'Hon.']]);

        $res = $this->admin()->getJson('/api/v1/admin/approvals')->assertOk();
        $this->assertSame(['Pastor Grace Adeyemi', 'Faith Lens TV'], array_column($res->json('data'), 'name'));
        $this->assertSame('Living Waters, Osogbo', $res->json('data.0.subtitle'));
        $this->assertSame(['all' => 2, 'minister' => 1, 'media' => 1], $res->json('meta.counts'));
        $this->admin()->getJson('/api/v1/admin/approvals?kind=media')->assertJsonCount(1, 'data');
        $this->assertNotNull($verified);
    }

    public function test_approving_a_minister_unlocks_their_team_and_declining_keeps_them_as_a_delegate(): void
    {
        Mail::fake();
        $a = $this->attendee(reg: ['category' => 'minister']);
        $b = $this->attendee(reg: ['category' => 'minister']);

        $detail = $this->admin()->getJson("/api/v1/admin/approvals/reg-{$a->registration->id}")->assertOk();
        $this->assertSame('Minister verification', $detail->json('data.heading'));
        $this->assertSame(['approve', 'decline'], $detail->json('data.actions'));

        $this->admin()->postJson("/api/v1/admin/approvals/reg-{$a->registration->id}", ['action' => 'approve'])->assertOk()->assertJsonPath('meta.badges.approvals', 1);
        $this->admin()->postJson("/api/v1/admin/approvals/reg-{$b->registration->id}", ['action' => 'decline', 'note' => 'We could not match the ordination letter.'])->assertOk();

        $this->assertNotNull($a->registration->fresh()->minister_verified_at);
        $this->assertSame('delegate', $b->registration->fresh()->category->value);
        Mail::assertQueued(MinisterVerificationMail::class, fn ($m) => $m->hasTo($a->email) && $m->approved);
        Mail::assertQueued(MinisterVerificationMail::class, fn ($m) => $m->hasTo($b->email) && ! $m->approved && str_contains($m->note, 'ordination'));

        // Already reviewed: not in the queue any more, and can't be reviewed twice.
        $this->admin()->postJson("/api/v1/admin/approvals/reg-{$a->registration->id}", ['action' => 'approve'])->assertUnprocessable();
        $this->admin()->postJson("/api/v1/admin/approvals/reg-{$a->registration->id}", ['action' => 'review'])->assertUnprocessable();
    }

    public function test_an_application_goes_through_checks_a_request_and_a_decision(): void
    {
        Mail::fake();
        Storage::fake('local');
        $applicant = $this->attendee(['full_name' => 'Kemi Ojo']);
        $app = Application::create(['attendee_id' => $applicant->id, 'role' => 'media', 'status' => 'submitted', 'payload' => ['organisation' => 'Faith Lens TV', 'crew_size' => 2, 'contact_name' => 'Kemi', 'phone' => '+2348031234567', 'coverage_plan' => 'Live broadcast']]);
        Storage::disk('local')->put('applications/1/id.pdf', 'PDF-BYTES');
        $doc = $app->documents()->create(['path' => 'applications/1/id.pdf', 'original_name' => 'press-id.pdf', 'mime' => 'application/pdf', 'size' => 9]);

        $d = $this->admin()->getJson("/api/v1/admin/approvals/app-{$app->id}")->assertOk()->json('data');
        $this->assertSame('Media accreditation', $d['heading']);
        $this->assertContains(['k' => 'Crew size', 'v' => '2'], $d['facts']);
        $this->assertSame('Kemi Ojo · '.$applicant->email, $d['facts'][0]['v']);
        $this->assertSame('press-id.pdf', $d['documents'][0]['name']);

        $this->admin()->postJson("/api/v1/admin/approvals/app-{$app->id}", ['action' => 'check'])->assertOk()->assertJsonPath('data.status', 'documents_checked');
        $this->admin()->postJson("/api/v1/admin/approvals/app-{$app->id}", ['action' => 'request_info'])->assertUnprocessable();
        $this->admin()->postJson("/api/v1/admin/approvals/app-{$app->id}", ['action' => 'request_info', 'info' => 'A copy of each crew member\'s press ID.'])
            ->assertOk()->assertJsonPath('data.status', 'in_review')->assertJsonPath('data.requested_info', "A copy of each crew member's press ID.");
        $this->admin()->postJson("/api/v1/admin/approvals/app-{$app->id}", ['action' => 'check'])->assertUnprocessable(); // can't go back

        $download = $this->admin()->get("/api/v1/admin/applications/{$app->id}/documents/{$doc->id}")->assertOk();
        $this->assertSame('PDF-BYTES', $download->streamedContent());

        $this->admin()->postJson("/api/v1/admin/approvals/app-{$app->id}", ['action' => 'approve', 'note' => 'Welcome'])->assertOk()->assertJsonPath('data.actions', []);
        Mail::assertQueued(ApplicationDecisionMail::class, fn ($m) => $m->approved && $m->hasTo($applicant->email));
        $this->admin()->postJson("/api/v1/admin/approvals/app-{$app->id}", ['action' => 'decline'])->assertUnprocessable();
        $this->admin()->getJson('/api/v1/admin/approvals/nope')->assertNotFound();
    }

    public function test_broadcast_audiences_add_up_and_empty_reaches_nobody(): void
    {
        $this->attendee(reg: ['mode' => 'onsite']);                                         // onsite
        $this->attendee(['age_band' => '46+'], ['mode' => 'online']);                       // online, not IYLC
        $this->attendee(['age_band' => '16-17'], ['mode' => 'online']);                     // online, IYLC
        $minister = $this->attendee(['age_band' => '46+'], ['mode' => 'online', 'category' => 'minister']);
        $leader = $this->attendee(['age_band' => '46+'], ['mode' => 'online']);
        $this->attendee(reg: ['status' => 'pending_verification']);                         // never reached
        app(CreateTeam::class)($leader, TeamKind::Church, 'CLA');

        $reach = fn (array $chips) => $this->admin()->postJson('/api/v1/admin/broadcasts/preview', ['audience' => $chips])->assertOk()->json('data.reach');

        $this->assertSame(1, $reach(['onsite']));
        $this->assertSame(4, $reach(['online']));
        $this->assertSame(2, $reach(['onsite', 'iylc']));       // the onsite person, plus the teenager's online
        $this->assertSame(1, $reach(['ministers']));
        $this->assertSame(1, $reach(['team_leaders']));
        $this->assertSame(5, $reach(['everyone']));
        $this->assertSame(0, $reach([]));
        $this->admin()->postJson('/api/v1/admin/broadcasts/preview', ['audience' => ['martians']])->assertUnprocessable();
        $this->assertNotNull($minister);
    }

    public function test_a_broadcast_goes_out_by_email_now_or_later_and_can_be_cancelled(): void
    {
        Mail::fake();
        Carbon::setTestNow('2027-01-23 12:00:00');
        $this->attendee(reg: ['mode' => 'onsite']);
        $this->attendee(reg: ['mode' => 'onsite']);
        $this->attendee(reg: ['mode' => 'online']);
        $send = ['title' => 'Gate B opens at 1:15 PM', 'body' => 'Please use Gate B.', 'channels' => ['email'], 'audience' => ['onsite']];

        $now = $this->admin()->postJson('/api/v1/admin/broadcasts', $send)->assertCreated();
        $this->assertSame('sent', $now->json('data.status'));
        $this->assertSame(2, $now->json('data.recipients_count'));
        Mail::assertQueued(BroadcastMail::class, 2);
        Mail::assertQueued(BroadcastMail::class, fn ($m) => $m->heading === 'Gate B opens at 1:15 PM' && $m->text === 'Please use Gate B.');

        $later = $this->admin()->postJson('/api/v1/admin/broadcasts', $send + ['scheduled_at' => '2027-01-23 12:45:00'] + [])->assertCreated();
        $this->assertSame('scheduled', $later->json('data.status'));
        Mail::assertQueued(BroadcastMail::class, 2); // nothing new yet
        $this->assertSame(0, app(DispatchDueBroadcasts::class)());

        Carbon::setTestNow('2027-01-23 12:46:00');
        $this->assertSame(1, app(DispatchDueBroadcasts::class)());
        $this->assertSame(0, app(DispatchDueBroadcasts::class)(), 'a broadcast is only sent once');
        Mail::assertQueued(BroadcastMail::class, 4);

        $cancelled = $this->admin()->postJson('/api/v1/admin/broadcasts', $send + ['scheduled_at' => '2027-01-24 09:00:00'])->json('data.id');
        $this->admin()->postJson("/api/v1/admin/broadcasts/{$cancelled}/cancel")->assertOk()->assertJsonPath('data.status', 'cancelled');
        $this->admin()->postJson("/api/v1/admin/broadcasts/{$cancelled}/cancel")->assertUnprocessable();
        Carbon::setTestNow('2027-01-25 00:00:00');
        $this->assertSame(0, app(DispatchDueBroadcasts::class)());
        Carbon::setTestNow();
    }

    public function test_broadcasts_validate_and_only_offer_connected_channels(): void
    {
        $ok = ['title' => 'Hello', 'body' => 'World', 'channels' => ['email'], 'audience' => ['everyone']];

        $this->admin()->postJson('/api/v1/admin/broadcasts', ['channels' => ['sms']] + $ok)->assertUnprocessable()->assertJsonValidationErrors('channels.0');
        $this->admin()->postJson('/api/v1/admin/broadcasts', ['channels' => []] + $ok)->assertUnprocessable();
        $this->admin()->postJson('/api/v1/admin/broadcasts', ['audience' => []] + $ok)->assertUnprocessable();
        $this->admin()->postJson('/api/v1/admin/broadcasts', ['scheduled_at' => '2020-01-01 00:00:00'] + $ok)->assertUnprocessable();
        $this->admin()->postJson('/api/v1/admin/broadcasts', ['body' => ''] + $ok)->assertUnprocessable();

        $meta = $this->admin()->getJson('/api/v1/admin/broadcasts')->json('meta');
        $this->assertEquals(['email' => true, 'push' => false, 'sms' => false, 'whatsapp' => false], collect($meta['channels'])->pluck('available', 'key')->all());
        $this->assertCount(6, $meta['audiences']);
    }

    public function test_a_test_broadcast_goes_only_to_the_signed_in_staff_member(): void
    {
        Mail::fake();
        $this->attendee();
        $this->admin()->postJson('/api/v1/admin/broadcasts/test', ['title' => 'Gate B', 'body' => 'Please use Gate B.'])->assertOk();
        Mail::assertQueued(BroadcastMail::class, 1);
        Mail::assertQueued(BroadcastMail::class, fn ($m) => $m->hasTo('admin@example.com') && $m->heading === '[Test] Gate B');
    }

    public function test_moderation_publishes_hides_and_features_with_the_real_author_visible(): void
    {
        $t = Testimony::create(['author_name' => 'Chidi Okafor', 'display_name' => 'A delegate from Oyo', 'label' => 'Oyo', 'type' => 'write', 'body' => 'I was healed.', 'tags' => ['Healing'], 'status' => 'pending']);
        Testimony::create(['author_name' => 'Old', 'display_name' => 'Old', 'type' => 'write', 'body' => 'Already out.', 'tags' => [], 'status' => 'approved', 'published_at' => now()]);
        $session = ProgrammeSession::create(['day' => '2027-01-20', 'starts_at' => now(), 'ends_at' => now()->addHour(), 'title' => 'Plenary', 'kind' => 'plenary']);
        SessionFeedback::query()->insert([
            ['attendee_id' => $this->attendee()->id, 'programme_session_id' => $session->id, 'rating' => 5, 'highlights' => '[]', 'created_at' => now(), 'updated_at' => now()],
            ['attendee_id' => $this->attendee()->id, 'programme_session_id' => $session->id, 'rating' => 4, 'highlights' => '[]', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $q = $this->admin(StaffRole::Moderator)->getJson('/api/v1/admin/testimonies')->assertOk();
        $this->assertSame(['Chidi Okafor'], array_column($q->json('data'), 'author_name'));
        $this->assertSame('A delegate from Oyo', $q->json('data.0.display_name'));
        $this->assertSame(1, $q->json('meta.counts.pending'));
        $this->assertSame(4.5, $q->json('meta.average_rating'));
        $this->assertSame(2, $q->json('meta.responses'));

        $this->admin(StaffRole::Moderator)->postJson("/api/v1/admin/testimonies/{$t->id}", ['action' => 'feature'])->assertUnprocessable();
        $this->admin(StaffRole::Moderator)->postJson("/api/v1/admin/testimonies/{$t->id}", ['action' => 'publish'])->assertOk()->assertJsonPath('data.status', 'approved');
        $this->assertNotNull($t->fresh()->published_at);
        $this->getJson('/api/v1/testimonies')->assertJsonFragment(['body' => 'I was healed.']);
        $this->admin(StaffRole::Moderator)->postJson("/api/v1/admin/testimonies/{$t->id}", ['action' => 'feature'])->assertOk()->assertJsonPath('data.featured', true);
        $this->admin(StaffRole::Moderator)->postJson("/api/v1/admin/testimonies/{$t->id}", ['action' => 'hide'])->assertOk()->assertJsonPath('data.featured', false);
        $this->getJson('/api/v1/testimonies')->assertJsonMissing(['body' => 'I was healed.']);
        $this->admin(StaffRole::Moderator)->postJson("/api/v1/admin/testimonies/{$t->id}", ['action' => 'explode'])->assertUnprocessable();
    }

    public function test_an_uploaded_image_becomes_the_sizes_the_committee_ticked(): void
    {
        Storage::fake('public');
        $res = $this->admin(StaffRole::Content)->post('/api/v1/admin/publicity', [
            'title' => 'Countdown · 7 days', 'type' => 'status', 'caption' => 'One week to go!', 'sizes' => ['square', 'status'],
            'file' => UploadedFile::fake()->image('countdown.png', 1600, 900), 'publish' => 'now',
        ], ['Accept' => 'application/json'])->assertCreated();

        $item = PublicityItem::first();
        $this->assertSame('countdown-7-days', $item->slug);
        $this->assertSame(['square', 'status'], array_column($item->sizes, 'key'));
        $this->assertSame('Square · Status', $item->meta);
        Storage::disk('public')->assertExists(['publicity/countdown-7-days/original.png', 'publicity/countdown-7-days/square.jpg', 'publicity/countdown-7-days/status.jpg']);
        [$w, $h] = getimagesize(Storage::disk('public')->path('publicity/countdown-7-days/status.jpg'));
        $this->assertSame([1080, 1920], [$w, $h]);
        $this->assertSame('published', $res->json('data.status'));
        $this->getJson('/api/v1/publicity')->assertJsonFragment(['slug' => 'countdown-7-days']);
    }

    public function test_publicity_can_be_scheduled_drafted_edited_and_removed(): void
    {
        Storage::fake('public');
        $upload = fn (string $title, array $extra) => $this->admin(StaffRole::Content)->post('/api/v1/admin/publicity', $extra + [
            'title' => $title, 'type' => 'video', 'caption' => 'Watch', 'file' => UploadedFile::fake()->create('promo.mp4', 2000, 'video/mp4'),
        ], ['Accept' => 'application/json']);

        $when = now()->addDays(3)->toDateTimeString();
        $scheduled = $upload('Promo video', ['publish' => 'schedule', 'publish_at' => $when])->assertCreated();
        $this->assertSame('scheduled', $scheduled->json('data.status'));
        $draft = $upload('Draft', ['publish' => 'draft'])->assertCreated();
        $this->assertSame('draft', $draft->json('data.status'));
        $this->assertTrue(PublicityItem::where('title', 'Promo video')->first()->is_video);
        $this->getJson('/api/v1/publicity')->assertJsonMissing(['slug' => 'promo-video']);
        $upload('Late', ['publish' => 'schedule'])->assertUnprocessable()->assertJsonValidationErrors('publish_at');
        $upload('Exe', ['publish' => 'now', 'file' => UploadedFile::fake()->create('x.exe', 10)])->assertUnprocessable();

        $id = $draft->json('data.id');
        $this->admin(StaffRole::Content)->patchJson("/api/v1/admin/publicity/{$id}", ['publish' => 'now', 'caption' => 'Updated'])->assertOk()->assertJsonPath('data.status', 'published');
        $this->getJson('/api/v1/publicity')->assertJsonFragment(['caption' => 'Updated']);
        $this->admin(StaffRole::Content)->patchJson("/api/v1/admin/publicity/{$id}", ['publish' => 'draft'])->assertJsonPath('data.status', 'draft');

        $list = $this->admin(StaffRole::Content)->getJson('/api/v1/admin/publicity')->assertOk();
        $this->assertSame(0, $list->json('meta.downloads'));
        $this->admin(StaffRole::Content)->deleteJson("/api/v1/admin/publicity/{$id}")->assertNoContent();
        Storage::disk('public')->assertMissing('publicity/draft');
        $this->assertSame(1, PublicityItem::count());
    }

    public function test_going_live_needs_a_stream_and_replays_can_be_managed(): void
    {
        $c = StaffRole::Content;
        $this->admin($c)->putJson('/api/v1/admin/settings/live', ['is_live' => true])->assertUnprocessable();
        $res = $this->admin($c)->putJson('/api/v1/admin/settings/live', ['is_live' => true, 'video_url' => 'https://youtu.be/dQw4w9WgXcQ', 'title' => 'Royal Conference'])->assertOk();
        $this->assertSame('embed', $res->json('data.video_kind'));
        $this->assertTrue(LiveState::current()->is_live);
        $this->admin($c)->putJson('/api/v1/admin/settings/live', ['is_live' => false, 'video_url' => 'javascript:alert(1)'])->assertUnprocessable();

        $r = $this->admin($c)->postJson('/api/v1/admin/replays', ['title' => 'Day 1', 'recorded_on' => '2027-01-20', 'duration_seconds' => 7200])->assertCreated();
        $id = $r->json('data.id');
        $this->admin($c)->patchJson("/api/v1/admin/replays/{$id}", ['video_url' => 'https://cdn.example.com/d1.m3u8'])->assertOk()->assertJsonPath('data.video_url', 'https://cdn.example.com/d1.m3u8');
        $this->assertCount(1, $this->admin($c)->getJson('/api/v1/admin/settings')->json('data.replays'));
        $this->admin($c)->deleteJson("/api/v1/admin/replays/{$id}")->assertNoContent();
        $this->admin($c)->postJson('/api/v1/admin/replays', ['title' => 'x'])->assertUnprocessable();
    }

    public function test_only_admins_manage_staff_and_nobody_can_lock_themselves_out(): void
    {
        $this->admin(StaffRole::Content)->getJson('/api/v1/admin/staff')->assertForbidden();

        $created = $this->admin()->postJson('/api/v1/admin/staff', ['name' => 'Ruth', 'email' => 'Ruth@Example.com', 'role' => 'moderator', 'title' => 'Media team'])->assertCreated();
        $this->assertSame('ruth@example.com', $created->json('data.email'));
        $this->admin()->postJson('/api/v1/admin/staff', ['name' => 'Dupe', 'email' => 'ruth@example.com', 'role' => 'admin'])->assertUnprocessable();
        $this->admin()->postJson('/api/v1/admin/staff', ['name' => 'Bad', 'email' => 'bad@example.com', 'role' => 'god'])->assertUnprocessable();

        $ruth = StaffUser::where('email', 'ruth@example.com')->first();
        $token = $ruth->createToken('t')->plainTextToken;
        $this->admin()->patchJson("/api/v1/admin/staff/{$ruth->id}", ['role' => 'registration', 'active' => false])->assertOk();
        $this->assertSame(0, $ruth->tokens()->count(), 'deactivating signs them out everywhere');
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/admin/me')->assertUnauthorized();

        $me = StaffUser::where('email', 'admin@example.com')->first();
        $this->admin()->patchJson("/api/v1/admin/staff/{$me->id}", ['active' => false])->assertUnprocessable();
        $this->admin()->patchJson("/api/v1/admin/staff/{$me->id}", ['role' => 'moderator'])->assertUnprocessable();
        $this->admin()->patchJson("/api/v1/admin/staff/{$me->id}", ['title' => 'Chief'])->assertOk();
        $this->assertCount(3, $this->admin()->getJson('/api/v1/admin/staff')->json('data')); // admin, content, ruth
    }

    public function test_every_role_only_reaches_its_own_areas(): void
    {
        $matrix = [
            'registration' => ['registrants' => 200, 'approvals' => 200, 'teams' => 200, 'orders' => 200, 'broadcasts' => 403, 'testimonies' => 403, 'publicity' => 403, 'settings' => 403, 'staff' => 403],
            'content' => ['registrants' => 403, 'approvals' => 403, 'teams' => 403, 'orders' => 403, 'broadcasts' => 200, 'testimonies' => 200, 'publicity' => 200, 'settings' => 200, 'staff' => 403],
            'moderator' => ['registrants' => 403, 'approvals' => 403, 'teams' => 403, 'orders' => 403, 'broadcasts' => 403, 'testimonies' => 200, 'publicity' => 403, 'settings' => 403, 'staff' => 403],
            'admin' => ['registrants' => 200, 'approvals' => 200, 'teams' => 200, 'orders' => 200, 'broadcasts' => 200, 'testimonies' => 200, 'publicity' => 200, 'settings' => 200, 'staff' => 200],
        ];
        foreach ($matrix as $role => $areas) {
            foreach ($areas as $area => $status) {
                $this->admin(StaffRole::from($role))->getJson("/api/v1/admin/{$area}")->assertStatus($status);
            }
        }
    }
}
