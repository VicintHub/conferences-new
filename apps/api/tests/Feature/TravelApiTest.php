<?php

namespace Tests\Feature;

use App\Domain\Registration\Models\Attendee;
use App\Domain\Travel\Models\Hotel;
use Database\Seeders\TravelSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TravelApiTest extends TestCase
{
    use RefreshDatabase;

    private function signedIn(): static
    {
        $a = Attendee::create(['full_name' => 'Ade', 'email' => 'ade@example.com', 'age_band' => '18-45', 'email_verified_at' => now()]);
        $a->registration()->create(['category' => 'delegate', 'mode' => 'online', 'days' => ['2027-01-19'], 'status' => 'confirmed', 'claim_code' => 'JC27-DLG-12345']);

        return $this->withToken($a->createToken('t')->plainTextToken);
    }

    public function test_travel_is_for_signed_in_attendees(): void
    {
        $this->getJson('/api/v1/travel')->assertUnauthorized();
    }

    public function test_the_venue_is_the_churchs_map_pin(): void
    {
        $venue = $this->signedIn()->getJson('/api/v1/travel')->json('data.venue');

        $this->assertEqualsWithDelta(7.4619, $venue['lat'], 0.001);
        $this->assertEqualsWithDelta(3.9125, $venue['lng'], 0.001);
    }

    public function test_hotels_come_nearest_first_with_distances_measured_from_the_venue(): void
    {
        $this->seed(TravelSeeder::class);

        $hotels = $this->signedIn()->getJson('/api/v1/travel')->assertOk()->json('data.hotels');

        $this->assertSame('Josiah Inn', $hotels[0]['name']);
        $this->assertSame(0.4, $hotels[0]['distance_km']);
        $this->assertSame($hotels, collect($hotels)->sortBy('distance_km')->values()->all());
        $this->assertLessThan(4.0, max(array_column($hotels, 'distance_km')));
        $this->assertCount(8, $hotels);
    }

    public function test_unknown_rates_and_contacts_stay_empty_rather_than_invented(): void
    {
        $this->seed(TravelSeeder::class);

        $first = $this->signedIn()->getJson('/api/v1/travel')->json('data.hotels.0');

        foreach (['price_kobo', 'drive_minutes', 'phone', 'whatsapp', 'rate_code'] as $field) {
            $this->assertNull($first[$field], $field);
        }
        $this->assertFalse($first['conference_rate']);
        $this->assertEqualsWithDelta(7.4598, $first['lat'], 0.001);
    }

    public function test_a_hotel_with_a_rate_and_the_conference_deal_shows_its_price_and_code(): void
    {
        $this->seed(TravelSeeder::class);
        Hotel::where('slug', 'josiah-inn')->update(['price_kobo' => 1800000, 'conference_rate' => true, 'phone' => '+2348080854818']);

        $first = $this->signedIn()->getJson('/api/v1/travel')->json('data.hotels.0');

        $this->assertSame(1800000, $first['price_kobo']);
        $this->assertSame('JANCONF27', $first['rate_code']);
        $this->assertSame('+2348080854818', $first['phone']);
    }

    public function test_the_payload_includes_the_shuttles_and_hides_inactive_hotels(): void
    {
        $this->seed(TravelSeeder::class);
        Hotel::where('slug', 'bible-guest-house')->update(['active' => false]);

        $res = $this->signedIn()->getJson('/api/v1/travel');

        $this->assertCount(7, $res->json('data.hotels'));
        $this->assertSame(['Ojoo roundabout', 'Iwo Road interchange', 'Partner hotels'], array_column($res->json('data.shuttles'), 'name'));
    }

    public function test_seeding_is_repeatable(): void
    {
        $this->seed(TravelSeeder::class);
        $this->seed(TravelSeeder::class);
        $this->assertSame(8, Hotel::count());
    }
}
