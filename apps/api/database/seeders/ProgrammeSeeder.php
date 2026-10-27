<?php

namespace Database\Seeders;

use App\Domain\Programme\Models\ProgrammeSession;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/** Placeholder programme from the design handoff; the committee replaces it through the admin console. */
class ProgrammeSeeder extends Seeder
{
    public function run(): void
    {
        $tz = 'Africa/Lagos';
        $plenaries = [
            ['09:00', '13:00', 'Morning Plenary Session', 'Main hall', 'plenary'],
            ['13:00', '14:00', 'Lunch', 'Meal points 1–3', 'meal'],
            ['17:00', '18:00', 'Breakout Session', 'Breakout halls · Zoom', 'breakout'],
            ['18:00', '20:00', 'Evening Plenary Session', 'Main hall', 'plenary'],
        ];
        $days = [
            '2027-01-19' => [['17:00', '20:00', 'Evening of Worship', 'Main hall', 'worship']],
            '2027-01-20' => $plenaries,
            '2027-01-21' => $plenaries,
            '2027-01-22' => $plenaries,
            '2027-01-23' => [
                ['07:00', '09:00', 'Arrival & check-in', 'Gates A and B', 'arrival'],
                ['09:00', '13:00', 'Royal Conference', 'Main hall · until 1 PM', 'plenary'],
                ['13:00', '14:00', 'Lunch', 'Meal points 1–3', 'meal'],
                ['14:00', '20:00', 'IYLC', 'Main hall · ages 16–45 · until 8 PM', 'iylc'],
            ],
            '2027-01-24' => [['09:00', '13:00', 'IMLC Closing', 'Main hall', 'plenary']],
        ];

        ProgrammeSession::query()->delete();
        foreach ($days as $day => $sessions) {
            foreach ($sessions as [$start, $end, $title, $subtitle, $kind]) {
                ProgrammeSession::create([
                    'day' => $day,
                    'starts_at' => Carbon::parse("{$day} {$start}", $tz)->setTimezone(config('app.timezone')),
                    'ends_at' => Carbon::parse("{$day} {$end}", $tz)->setTimezone(config('app.timezone')),
                    'title' => $title,
                    'subtitle' => $subtitle,
                    'kind' => $kind,
                ]);
            }
        }
    }
}
