<?php

namespace Tests\Feature;

use App\Domain\Checkin\Models\Badge;
use App\Domain\Checkin\Models\Scan;
use App\Domain\Programme\Models\ProgrammeSession;
use App\Domain\Registration\Models\Attendee;
use App\Domain\Staff\Enums\StaffRole;
use App\Domain\Staff\Models\StaffUser;
use App\Domain\Store\Models\Order;
use App\Domain\Store\Models\Product;
use App\Domain\Teams\Actions\CreateTeam;
use App\Domain\Teams\Enums\TeamKind;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Tests\TestCase;

class CheckinApiTest extends TestCase
{
    use RefreshDatabase;

    private int $n = 0;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2027-01-23 13:20:00');
        // Saturday: lunch 13:00-14:00 Lagos time.
        ProgrammeSession::create(['day' => '2027-01-23', 'starts_at' => '2027-01-23 13:00:00', 'ends_at' => '2027-01-23 14:00:00', 'title' => 'Lunch', 'kind' => 'meal']);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function as(StaffRole $role = StaffRole::Desk): static
    {
        $staff = StaffUser::firstOrCreate(['email' => "{$role->value}@example.com"], ['name' => ucfirst($role->value).' Person', 'role' => $role]);
        $this->app['auth']->forgetGuards();

        return $this->withToken($staff->createToken('t')->plainTextToken);
    }

    private function person(array $over = [], array $reg = []): Attendee
    {
        $this->n++;
        $a = Attendee::create($over + ['full_name' => "Person {$this->n}", 'email' => "p{$this->n}@example.com", 'phone' => '+23480312345'.str_pad((string) $this->n, 2, '0', STR_PAD_LEFT), 'church' => 'Christ Life Assembly', 'age_band' => '18-45', 'email_verified_at' => now()]);
        $a->registration()->create($reg + ['category' => 'delegate', 'mode' => 'onsite', 'days' => ['2027-01-19'], 'status' => 'confirmed', 'claim_code' => 'JC27-DLG-'.str_pad((string) $this->n, 5, '0', STR_PAD_LEFT)]);

        return $a;
    }

    private function scan(string $code, string $checkpoint = 'gate', array $over = [], StaffRole $role = StaffRole::Desk): array
    {
        $res = $this->as($role)->postJson('/api/v1/admin/scans/batch', ['items' => [array_merge([
            'client_uuid' => (string) Str::uuid(), 'code' => $code, 'checkpoint' => $checkpoint, 'scanned_at' => now()->toIso8601String(), 'device' => 'Meal point 2',
        ], $over)]])->assertOk();

        return $res->json('data.0');
    }

    public function test_the_gate_admits_confirmed_onsite_attendees_and_notes_a_return(): void
    {
        $a = $this->person();

        $first = $this->scan($a->registration->claim_code);
        $this->assertSame('ok', $first['result']);
        $this->assertSame('Person 1', $first['attendee']['name']);
        $this->assertSame('Delegate', $first['detail']);

        $again = $this->scan($a->registration->claim_code);
        $this->assertSame('ok', $again['result']);
        $this->assertSame('Delegate · Back in', $again['detail']);
        $this->assertSame('ok', $this->scan($a->registration->claim_code, 'hall')['result']);
    }

    public function test_refusals_say_why_and_only_judgement_calls_can_be_overridden(): void
    {
        $online = $this->person(reg: ['mode' => 'online']);
        $pending = $this->person(reg: ['status' => 'pending_verification']);

        $r = $this->scan($online->registration->claim_code);
        $this->assertSame(['refused', 'Registered as online'], [$r['result'], $r['reason']]);
        $this->assertFalse($r['can_override'], 'a door scanner cannot override');
        $this->assertTrue($this->scan($online->registration->claim_code, role: StaffRole::Supervisor)['can_override']);

        $this->assertSame('Registration not confirmed', $this->scan($pending->registration->claim_code, role: StaffRole::Supervisor)['reason']);
        $this->assertFalse($this->scan($pending->registration->claim_code, role: StaffRole::Supervisor)['can_override']);
        $unknown = $this->scan('JC27-DLG-99999', role: StaffRole::Supervisor);
        $this->assertSame(['refused', 'Unknown code', false], [$unknown['result'], $unknown['reason'], $unknown['can_override']]);
        $this->assertSame('That’s a merchandise pickup code', $this->scan('MV-00012')['reason']);
    }

    public function test_a_supervisor_override_admits_and_is_recorded_as_one(): void
    {
        $online = $this->person(reg: ['mode' => 'online']);

        $desk = $this->scan($online->registration->claim_code, over: ['override' => true]);
        $this->assertSame('refused', $desk['result'], 'a desk role asking for an override is ignored');

        $sup = $this->scan($online->registration->claim_code, over: ['override' => true], role: StaffRole::Supervisor);
        $this->assertSame(['ok', true, 'Gate'], [$sup['result'], $sup['overridden'], $sup['label']]);
        $this->assertStringContainsString('Registered as online', $sup['detail']);
        $this->assertSame(1, Scan::where('overridden', true)->count());

        $unknown = $this->scan('JC27-DLG-99999', over: ['override' => true], role: StaffRole::Supervisor);
        $this->assertSame('refused', $unknown['result'], 'an unknown code is never overridable');
    }

    public function test_a_meal_is_once_per_window_and_says_where_it_was_taken(): void
    {
        $a = $this->person();
        $code = $a->registration->claim_code;

        $first = $this->scan($code, 'meal');
        $this->assertSame(['ok', 'Lunch', 'Delegate · 1st meal today'], [$first['result'], $first['label'], $first['detail']]);

        Carbon::setTestNow('2027-01-23 13:30:00');
        $second = $this->scan($code, 'meal', ['device' => 'Meal point 3']);
        $this->assertSame(['refused', 'Already served'], [$second['result'], $second['reason']]);
        $this->assertSame("Lunch collected at Meal point 2\n1:20 PM today", $second['detail']);
        $this->assertSame(1, Scan::where('checkpoint', 'meal')->where('result', 'ok')->count());
    }

    public function test_meal_scans_follow_the_programme_with_a_few_minutes_of_grace(): void
    {
        $a = $this->person();
        $code = $a->registration->claim_code;

        Carbon::setTestNow('2027-01-23 12:50:00');
        $this->assertSame('ok', $this->scan($code, 'meal')['result']); // 10 min before

        $b = $this->person();
        Carbon::setTestNow('2027-01-23 12:30:00');
        $this->assertSame('No meal service right now', $this->scan($b->registration->claim_code, 'meal')['reason']);
        Carbon::setTestNow('2027-01-23 14:20:00');
        $this->assertSame('No meal service right now', $this->scan($b->registration->claim_code, 'meal')['reason']);
        Carbon::setTestNow('2027-01-23 14:10:00');
        $this->assertSame('ok', $this->scan($b->registration->claim_code, 'meal')['result']); // 10 min after
    }

    public function test_a_supervisor_can_serve_a_second_plate_and_the_meal_count_follows(): void
    {
        $a = $this->person();
        $code = $a->registration->claim_code;
        $this->scan($code, 'meal');

        $again = $this->scan($code, 'meal', ['override' => true], StaffRole::Supervisor);
        $this->assertSame(['ok', true], [$again['result'], $again['overridden']]);
        $this->assertStringContainsString('Override (Already served)', $again['detail']);
        $this->assertSame(2, Scan::where('checkpoint', 'meal')->where('result', 'ok')->count());
    }

    public function test_merchandise_is_released_once_against_a_paid_order(): void
    {
        $paid = Order::create(['code' => 'MV-00012', 'access_token' => 'x', 'customer_name' => 'Ada Obi', 'customer_email' => 'a@example.com', 'status' => 'paid', 'method' => 'card', 'subtotal_kobo' => 1, 'fee_kobo' => 0, 'total_kobo' => 1]);
        $product = Product::create(['slug' => 'tee', 'name' => 'Conference T-shirt', 'category' => 'apparel', 'price_kobo' => 1, 'images' => [], 'colors' => [], 'sizes' => [], 'facts' => []]);
        $variant = $product->variants()->create(['size' => 'L', 'color' => null, 'stock' => 5]);
        $paid->items()->create(['product_id' => $product->id, 'product_variant_id' => $variant->id, 'name' => 'Conference T-shirt', 'variant_label' => 'Size L', 'unit_price_kobo' => 1, 'qty' => 2]);
        Order::create(['code' => 'MV-00013', 'access_token' => 'y', 'customer_name' => 'Bola', 'customer_email' => 'b@example.com', 'status' => 'pending', 'method' => 'card', 'subtotal_kobo' => 1, 'fee_kobo' => 0, 'total_kobo' => 1]);

        $ok = $this->scan('MV-00012', 'merch');
        $this->assertSame(['ok', 'Merchandise'], [$ok['result'], $ok['label']]);
        $this->assertSame("Ada Obi\nConference T-shirt ×2", $ok['detail']);
        $this->assertSame('collected', $paid->fresh()->status->value);
        $this->assertNotNull($paid->fresh()->collected_at);

        $again = $this->scan('MV-00012', 'merch');
        $this->assertSame(['refused', 'Already collected'], [$again['result'], $again['reason']]);
        $this->assertSame('Not paid (pending)', $this->scan('MV-00013', 'merch')['reason']);
        $this->assertSame('Unknown order', $this->scan('MV-99999', 'merch')['reason']);
        $this->assertSame('Scan the pickup QR from the order', $this->scan($this->person()->registration->claim_code, 'merch')['reason']);
        $this->assertFalse($this->scan('MV-00012', 'merch', role: StaffRole::Supervisor)['can_override']);
    }

    public function test_replaying_a_batch_is_harmless_and_each_scan_gets_its_own_answer(): void
    {
        $a = $this->person();
        $items = [
            ['client_uuid' => 'uuid-aaaaaaaa', 'code' => $a->registration->claim_code, 'checkpoint' => 'meal', 'scanned_at' => now()->toIso8601String(), 'device' => 'Meal point 2'],
            ['client_uuid' => 'uuid-bbbbbbbb', 'code' => 'JC27-DLG-99999', 'checkpoint' => 'gate', 'scanned_at' => now()->toIso8601String()],
        ];

        $first = $this->as()->postJson('/api/v1/admin/scans/batch', ['items' => $items])->assertOk()->json('data');
        $this->assertSame(['ok', 'refused'], array_column($first, 'result'));

        $replay = $this->as()->postJson('/api/v1/admin/scans/batch', ['items' => $items])->assertOk()->json('data');
        $this->assertSame(['ok', 'refused'], array_column($replay, 'result'), 'the first decision stands');
        $this->assertSame([true, true], array_column($replay, 'duplicate'));
        $this->assertSame(2, Scan::count());
        $this->assertSame('Person 1', $replay[0]['attendee']['name']);
    }

    public function test_a_phone_that_was_offline_is_judged_at_the_time_it_scanned(): void
    {
        $a = $this->person();
        Carbon::setTestNow('2027-01-23 18:00:00'); // synced hours later, long after lunch

        $late = $this->scan($a->registration->claim_code, 'meal', ['scanned_at' => '2027-01-23 13:10:00']);

        $this->assertSame('ok', $late['result']);
        $this->assertSame('2027-01-23 13:10:00', Scan::first()->scanned_at->format('Y-m-d H:i:s'));
    }

    public function test_the_batch_checks_its_input(): void
    {
        $item = ['client_uuid' => 'uuid-cccccccc', 'code' => 'JC27-DLG-00001', 'checkpoint' => 'gate', 'scanned_at' => now()->toIso8601String()];
        $post = fn (array $over) => $this->as()->postJson('/api/v1/admin/scans/batch', ['items' => [$over + $item]]);

        $post(['checkpoint' => 'kitchen'])->assertUnprocessable();
        $post(['scanned_at' => now()->addHour()->toIso8601String()])->assertUnprocessable();
        $post(['scanned_at' => now()->subDays(30)->toIso8601String()])->assertUnprocessable();
        $post(['client_uuid' => 'x'])->assertUnprocessable();
        $this->as()->postJson('/api/v1/admin/scans/batch', ['items' => []])->assertUnprocessable();
        $this->as()->postJson('/api/v1/admin/scans/batch', ['items' => array_fill(0, 101, $item)])->assertUnprocessable();
    }

    public function test_the_roster_carries_what_a_scanner_needs_offline(): void
    {
        $a = $this->person();
        $this->person(reg: ['mode' => 'online']);
        $this->person(reg: ['status' => 'pending_verification']);
        Order::create(['code' => 'MV-00012', 'access_token' => 'x', 'customer_name' => 'Ada', 'customer_email' => 'a@example.com', 'status' => 'paid', 'method' => 'card', 'subtotal_kobo' => 1, 'fee_kobo' => 0, 'total_kobo' => 1]);
        Order::create(['code' => 'MV-00013', 'access_token' => 'y', 'customer_name' => 'Bola', 'customer_email' => 'b@example.com', 'status' => 'pending', 'method' => 'card', 'subtotal_kobo' => 1, 'fee_kobo' => 0, 'total_kobo' => 1]);
        $this->scan($a->registration->claim_code, 'meal');

        $d = $this->as()->getJson('/api/v1/admin/scans/roster')->assertOk()->json('data');

        $this->assertSame([$a->registration->claim_code => ['n' => 'Person 1', 'c' => 'delegate']], $d['people']);
        $this->assertSame(['MV-00012' => ['n' => 'Ada', 's' => 'paid']], $d['orders']);
        $this->assertSame('Lunch', $d['meals'][0]['title']);
        $this->assertSame([$a->registration->claim_code], array_values($d['served'])[0]);
        $this->assertSame(15, $d['grace_minutes']);
    }

    public function test_only_door_staff_can_scan_and_use_the_desk(): void
    {
        $this->as(StaffRole::Moderator)->getJson('/api/v1/admin/scans/roster')->assertForbidden();
        $this->as(StaffRole::Content)->getJson('/api/v1/admin/desk/summary')->assertForbidden();
        $this->as(StaffRole::Desk)->getJson('/api/v1/admin/checkin')->assertForbidden();
        $this->as(StaffRole::Desk)->getJson('/api/v1/admin/registrants')->assertForbidden();
        $this->as(StaffRole::Supervisor)->getJson('/api/v1/admin/checkin')->assertOk();
        $this->app['auth']->forgetGuards();
        $this->flushHeaders();
        $this->getJson('/api/v1/admin/scans/roster')->assertUnauthorized();
    }

    public function test_the_desk_finds_people_by_code_phone_or_name(): void
    {
        $a = $this->person(['full_name' => 'Adebayo Ogunleye', 'phone' => '+2348034567821']);
        $this->person(['full_name' => 'Funmi Adeleke']);
        app(CreateTeam::class)($a, TeamKind::Church, 'Christ Life Assembly');

        $byCode = $this->as()->getJson('/api/v1/admin/desk/lookup?q=jc27-dlg-00001')->assertOk()->json('data');
        $this->assertCount(1, $byCode);
        $this->assertSame('Adebayo Ogunleye', $byCode[0]['name']);
        $this->assertSame('7821', $byCode[0]['phone_last4']);
        $this->assertMatchesRegularExpression('/^CLA-/', $byCode[0]['team_code']);
        $this->assertTrue($byCode[0]['valid']);
        $this->assertNull($byCode[0]['badge_printed_at']);

        $this->assertSame('Adebayo Ogunleye', $this->as()->getJson('/api/v1/admin/desk/lookup?q='.urlencode('0803 456 7821'))->json('data.0.name'));
        $this->assertSame('Adebayo Ogunleye', $this->as()->getJson('/api/v1/admin/desk/lookup?q=2348034567821')->json('data.0.name'));
        $this->assertCount(2, $this->as()->getJson('/api/v1/admin/desk/lookup?q=ade')->json('data')); // Adebayo and Adeleke
        $this->assertSame('Funmi Adeleke', $this->as()->getJson('/api/v1/admin/desk/lookup?q=funmi')->json('data.0.name'));
        $this->assertSame([], $this->as()->getJson('/api/v1/admin/desk/lookup?q=nobody-here')->json('data'));
        $this->as()->getJson('/api/v1/admin/desk/lookup?q=a')->assertUnprocessable();
    }

    public function test_printing_a_badge_is_recorded_and_a_second_print_needs_a_supervisor_and_a_reason(): void
    {
        $a = $this->person();
        $id = $a->registration->id;

        $first = $this->as()->postJson('/api/v1/admin/desk/print', ['registration_id' => $id, 'desk' => 'Print desk 3'])->assertOk();
        $this->assertNotNull($first->json('data.badge_printed_at'));
        $this->assertNotNull($a->registration->fresh()->badge_printed_at);
        $this->assertSame(1, Badge::where('desk', 'Print desk 3')->where('reprint', false)->count());

        $this->as()->postJson('/api/v1/admin/desk/print', ['registration_id' => $id])->assertStatus(409);
        $this->as()->postJson('/api/v1/admin/desk/print', ['registration_id' => $id, 'reprint' => true, 'reason' => 'Torn'])->assertForbidden();
        $this->as(StaffRole::Supervisor)->postJson('/api/v1/admin/desk/print', ['registration_id' => $id, 'reprint' => true])->assertUnprocessable()->assertJsonValidationErrors('reason');
        $this->as(StaffRole::Supervisor)->postJson('/api/v1/admin/desk/print', ['registration_id' => $id, 'reprint' => true, 'reason' => 'Torn by the rain'])->assertOk();

        $this->assertSame(2, Badge::count());
        $this->assertSame(1, Badge::where('reprint', true)->where('reason', 'Torn by the rain')->count());
        $this->assertSame(['printed_today' => 2, 'printed_total' => 2], $this->as()->getJson('/api/v1/admin/desk/summary')->json('data'));
    }

    public function test_no_badge_for_an_unconfirmed_registration(): void
    {
        $p = $this->person(reg: ['status' => 'pending_verification']);
        $this->as()->postJson('/api/v1/admin/desk/print', ['registration_id' => $p->registration->id])->assertUnprocessable();
        $this->assertSame(0, Badge::count());
    }

    public function test_the_checkin_page_summarises_the_day(): void
    {
        $a = $this->person();
        $b = $this->person(reg: ['mode' => 'online']);
        $this->scan($a->registration->claim_code, 'gate');
        $this->scan($a->registration->claim_code, 'meal');
        $this->scan($b->registration->claim_code, 'gate');
        $this->scan($b->registration->claim_code, 'gate', ['override' => true], StaffRole::Supervisor);
        $this->as()->postJson('/api/v1/admin/desk/print', ['registration_id' => $a->registration->id]);

        $d = $this->as(StaffRole::Supervisor)->getJson('/api/v1/admin/checkin')->assertOk()->json('data');

        $gate = collect($d['checkpoints'])->firstWhere('key', 'gate');
        $this->assertSame([2, 1], [$gate['ok'], $gate['refused']]);
        $this->assertSame(['Lunch' => 1], $d['meals']);
        $this->assertSame(['Registered as online' => 1], $d['refusals']);
        $this->assertSame(1, $d['overrides']);
        $this->assertSame(['today' => 1, 'total' => 1, 'reprints' => 0], $d['badges']);
        $this->assertCount(4, $d['recent']);
        $this->assertSame('Person 2', $d['recent'][0]['who']);
    }

    public function test_the_attendees_pass_shows_what_they_have_used(): void
    {
        $a = $this->person();
        $token = $a->createToken('t')->plainTextToken;
        $this->scan($a->registration->claim_code, 'gate');
        $this->scan($a->registration->claim_code, 'meal');

        $this->app['auth']->forgetGuards();
        $access = $this->withToken($token)->getJson('/api/v1/me')->assertOk()->json('data.access');

        $this->assertSame(['gate' => true, 'hall' => false, 'meal' => true, 'merch' => false], collect($access)->pluck('used', 'key')->all());
    }
}
