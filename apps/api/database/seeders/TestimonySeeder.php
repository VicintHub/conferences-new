<?php

namespace Database\Seeders;

use App\Domain\Testimonies\Models\Testimony;
use Illuminate\Database\Seeder;

/** Approved sample testimonies from the design handoff (placeholders until real ones are submitted). */
class TestimonySeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['Rev. Daniel O.', 'Ilorin · IMLC 2026', 'The breakout on church planting gave our team a clear plan. We have started two outreach cells since the conference.', ['Ministry'], 214],
            ['Abena K.', 'Accra · Online', 'I watched online from Accra. The stream held all week and the radio option saved my data.', ['Online'], 96],
            ['Tobi E.', 'Lagos · IYLC 2026', 'My first IYLC. I made friends from five states and found my place in missions.', ['IYLC'], 158],
            ['A delegate from Oyo', 'IMLC 2026', 'During the Thursday evening session I received healing in my back. I can now stand through a full service.', ['Healing'], 402],
            ['Mrs. Ngozi U.', 'Enugu · Delegate', 'Registration and badge collection took less than ten minutes. Everything was in order.', ['Experience'], 61],
            ['Pastor Tola B.', 'Ibadan · Team leader', 'We came as a team of fourteen. The team code meant one person handled everything and every member got their own ticket.', ['Experience'], 73],
        ];

        Testimony::query()->delete();
        foreach ($rows as $i => [$name, $label, $body, $tags, $amen]) {
            Testimony::create([
                'author_name' => $name, 'display_name' => $name, 'label' => $label, 'type' => 'write', 'body' => $body,
                'tags' => $tags, 'amen_count' => $amen, 'status' => 'approved', 'published_at' => now()->subDays(10 - $i),
            ]);
        }

        // The featured video card. No media file ships with the handoff, so it shows its poster only.
        Testimony::create([
            'author_name' => 'Pastor Femi A.', 'display_name' => 'Pastor Femi A.', 'label' => 'Abeokuta', 'type' => 'video',
            'body' => '“I came weary. I left commissioned.”', 'poster_path' => '/images/photos/lp-about-1.webp', 'duration_seconds' => 160,
            'tags' => ['Ministry'], 'amen_count' => 120, 'status' => 'approved', 'featured' => true, 'published_at' => now()->subDays(11),
        ]);
    }
}
