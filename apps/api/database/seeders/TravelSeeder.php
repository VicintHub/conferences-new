<?php

namespace Database\Seeders;

use App\Domain\Travel\Models\Hotel;
use App\Domain\Travel\Models\Shuttle;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Hotels closest to the venue, taken from Google Maps around the church's pin (straight-line distance).
 * Rates, phone numbers, amenities and any conference-rate deal are not public: the committee adds them
 * as each hotel confirms, and the app says "ask for the rate" until then. Shuttles are placeholders from the design.
 */
class TravelSeeder extends Seeder
{
    /** @var list<array{string, string, float, float}> name, area, lat, lng */
    private const HOTELS = [
        ['Josiah Inn', 'NISER, Ojoo', 7.459812, 3.909894],
        ['Classicus Inn', 'Ojoo, Ibadan', 7.454809, 3.908133],
        ['Dopad Hills Hotel and Suites', 'Ojoo, Ibadan', 7.453246, 3.925120],
        ['UI Hotels', 'University of Ibadan area', 7.448563, 3.900813],
        ['Ayotoz Hotel', 'Ibadan', 7.441481, 3.907441],
        ['Dominion City Guest House', 'Ibadan', 7.444392, 3.926548],
        ['Top Blue Roof Inn', 'Ibadan', 7.480910, 3.905250],
        ['Bible Guest House', 'Ibadan', 7.432117, 3.904411],
    ];

    public function run(): void
    {
        $venue = [(float) config('conference.venue_lat'), (float) config('conference.venue_lng')];

        Hotel::query()->delete();
        $rows = collect(self::HOTELS)->map(fn ($h) => [...$h, self::km($venue, [$h[2], $h[3]])])->sortBy(4)->values();
        foreach ($rows as $i => [$name, $area, $lat, $lng, $km]) {
            Hotel::create([
                'slug' => Str::slug($name), 'name' => $name, 'area' => $area, 'lat' => $lat, 'lng' => $lng,
                'distance_km' => round($km, 1), 'amenities' => [], 'conference_rate' => false, 'sort' => $i,
            ]);
        }

        Shuttle::query()->delete();
        foreach ([
            ['Ojoo roundabout', 'Every 20 min · 6:30 AM – 10 PM'],
            ['Iwo Road interchange', 'Every 45 min · 6 AM – 9 PM'],
            ['Partner hotels', 'Every 30 min from 7 AM'],
        ] as $i => [$name, $schedule]) {
            Shuttle::create(['name' => $name, 'schedule' => $schedule, 'sort' => $i]);
        }
    }

    /** Great-circle distance in kilometres. */
    public static function km(array $a, array $b): float
    {
        [$la1, $lo1, $la2, $lo2] = array_map('deg2rad', [$a[0], $a[1], $b[0], $b[1]]);
        $h = sin(($la2 - $la1) / 2) ** 2 + cos($la1) * cos($la2) * sin(($lo2 - $lo1) / 2) ** 2;

        return 12742 * asin(sqrt($h));
    }
}
