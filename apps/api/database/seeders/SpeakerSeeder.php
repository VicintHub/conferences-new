<?php

namespace Database\Seeders;

use App\Domain\Speakers\Models\Speaker;
use Illuminate\Database\Seeder;

/** Hosts and IMLC 2026 speakers from the design handoff (bios are the client's verbatim text). */
class SpeakerSeeder extends Seeder
{
    public function run(): void
    {
        $samson = [
            'Rev. Samson Ajetomobi, the President of The Men of Issachar Vision Incorporated (MIV), which commenced in 1989 and the Overseer of the Redemption Faith Churches is a man called by God with the mandate to reach the unreached at all cost and reawaken the Church to her responsibilities.',
            'Rev. Ajetomobi, a trained Agricultural Engineer is a certified Professional Manager who is a member of the International Professional Managers Association (United Kingdom) and a fellow of Certified International Professional Managers. He is also a member of the Development Associate Institute and an alumnus of Haggai Institute (Maui, U.S.A.).',
            'A leadership developer to the core, Rev. Samson founded and heads The Mission and Leadership Academy, The Leadership Update for strategic leaders, The Compact Leadership Training and the ROOTED Apex Leadership Training.',
            'His One-Body orientation and commitment to the Kingdom growth have brought him to the fore as the Chairman, Pentecostal Fellowship of Nigeria (PFN), Oyo State Chapter, The Chairman, Movement for Africa National Initiatives (MANI), Oyo State and a frontline member of the Nigeria Evangelical Missions Association (NEMA). The love for his host community made him establish and oversee The Issachar Medical Center and The Issachar Vision International Schools.',
            'A long time televangelist, Rev. Ajetomobi is the producer of the Awakening Word Telecast and the viral Awakening Word Weekly Blessings. He is also the director of This Same Jesus Crusade.',
            'Having been married to Rev. Stella Ajetomobi for decades and blessed with four young adults, Rev. Samson founded and coordinates the Issachar School of Marriage and the Family Healing Season Conference to help believers lead their homes as God intends.',
            'Rev. Samson Ajetomobi is gripped with a great passion for God and His kingdom. Little wonder, he has helped several lives to discover the essence of living for God and is much sought after in several training, conferences, crusades and church revivals across the continents.',
        ];
        $stella = [
            'Rev. Stellamaris Ajetomobi is the Vice President of The Men of Issachar Vision Inc. with the headquarters in Ibadan. She is a seasoned woman of God who has been supporting her husband in Ministry right from inception.',
            'She answered the full time ministerial call in 1997 after she had worked with International Institute of Tropical Agriculture (IITA) as a Food Technologist. She holds a Masters degree in Personnel Psychology. The Lord has bestowed upon Rev Stella grace in the teaching and prophetic ministry. She has passion for teaching and preaching Christian character, discipleship and missions. She is the author of life changing books such as Dressing for Your Destination, Solitude, Bridging the Gap among others.',
            "Rev. Stella is the host of Back to Bethel Retreats a specialized retreat for minister's wives, elect ladies and female leaders across different locations. She also coordinates Divine Well Global Foundation. She is married to Rev. Samson Ajetomobi and they are blessed with four children.",
        ];

        $rows = [
            ['samson-ajetomobi', 'Rev. Samson Ajetomobi', 'President of the Men of Issachar Vision Inc.', 'Host · President, MIV', 'host', '/images/photos/lp-host-1.webp', '/images/photos/lp-host-1m.webp', $samson],
            ['stellamaris-ajetomobi', 'Rev. Stellamaris Ajetomobi', 'Vice-President of the Men of Issachar Vision Inc.', 'Host · Vice-President, MIV', 'host', '/images/photos/lp-host-2.webp', '/images/photos/lp-host-2m.webp', $stella],
        ];

        $past = [
            ['steve-mensah', 'Rev. Steve Mensah', 'General Overseer of the Charismatic Evangelistic Ministry (CEM)'],
            ['david-ogbueli', 'Dr. David Ogbueli', 'Senior Pastor of Dominion City Worldwide.'],
            ['yemi-osinbajo', 'Prof. Yemi Osinbajo SAN', 'Pastor, Lawyer, and Former Vice President of Nigeria.'],
            ['kingsley-enakirerhi', 'Bishop Kingsley Enakirerhi', 'The presiding Bishop of Heroes of Faith Ministries Int.'],
            ['poju-oyemade', 'Pastor Poju Oyemade', 'Senior Pastor and Founder of The Covenant Nation (TCN).'],
            ['emmanuel-iren', 'Apostle Emmanuel Iren', 'Founder of Celebration Church International'],
        ];
        foreach ($past as [$slug, $name, $role]) {
            $rows[] = [$slug, $name, $role, 'IMLC 2026', 'imlc_2026', null, null, [$role]];
        }

        foreach ($rows as $i => [$slug, $name, $role, $short, $group, $photo, $mobile, $bio]) {
            Speaker::updateOrCreate(['slug' => $slug], [
                'name' => $name, 'role' => $role, 'short_role' => $short, 'group' => $group,
                'photo' => $photo, 'photo_mobile' => $mobile, 'bio' => $bio, 'sort' => $i, 'published_at' => now()->subDay(),
            ]);
        }
    }
}
