<?php

namespace Database\Seeders;

use App\Domain\Live\Models\LiveState;
use App\Domain\Live\Models\Replay;
use Illuminate\Database\Seeder;

/**
 * Placeholder replays from the design handoff. They have no video yet: real recordings are published
 * through the admin console after each session. The stream starts off-air.
 */
class LiveSeeder extends Seeder
{
    public function run(): void
    {
        LiveState::current();

        Replay::query()->delete();
        foreach ([
            ['IMLC Day 3 · Evening plenary', '2027-01-22', 8048, 'lp-about-2'],
            ['IMLC Day 2 · Morning plenary', '2027-01-21', 6760, 'lp-about-1'],
            ['Evening of Worship', '2027-01-19', 9075, 'lp-hero-m'],
        ] as $i => [$title, $date, $seconds, $img]) {
            Replay::create(['title' => $title, 'recorded_on' => $date, 'duration_seconds' => $seconds, 'thumbnail' => "/images/photos/{$img}.webp", 'sort' => $i]);
        }
    }
}
