<?php

namespace Database\Seeders;

use App\Domain\Publicity\Models\PublicityItem;
use Illuminate\Database\Seeder;

/**
 * Items that ship with real files today: the official flyer (generated square/status/print sizes), the hosts card
 * (portrait photo placeholder) and the logo pack. Videos and status graphics arrive through the admin upload.
 */
class PublicitySeeder extends Seeder
{
    public function run(): void
    {
        $caption = 'The 37th IMLC & IYLC holds 19–24 January 2027 at the Leadership & Missions Conference Centre, Olororo, Ojoo, Ibadan. Registration is free. #JanConf2027 #IMLC2027';

        $items = [
            [
                'slug' => 'official-flyer', 'title' => 'Official flyer', 'type' => 'flyer', 'meta' => 'Square · Status · Print', 'ratio' => '16/9',
                'preview' => '/images/publicity/flyer-preview.jpg', 'caption' => $caption, 'published_at' => now()->subDay(),
                'sizes' => [
                    ['key' => 'square', 'label' => 'Square', 'dims' => '1080×1080', 'url' => '/images/publicity/flyer-square.jpg'],
                    ['key' => 'status', 'label' => 'Status', 'dims' => '1080×1920', 'url' => '/images/publicity/flyer-status.jpg'],
                    ['key' => 'print', 'label' => 'Print', 'dims' => 'A4', 'url' => '/images/publicity/flyer-print.jpg'],
                ],
            ],
            [
                'slug' => 'meet-the-hosts', 'title' => 'Meet the hosts card', 'type' => 'design', 'meta' => 'Square · Status', 'ratio' => '1/1',
                'preview' => '/images/photos/lp-host-1.webp', 'published_at' => now()->subDays(3),
                'caption' => 'Meet our hosts, Rev. Samson and Rev. Stella Ajetomobi, at the 37th IMLC & IYLC, 19–24 January 2027, Ibadan. Registration is free. #JanConf2027',
                'sizes' => [
                    ['key' => 'square', 'label' => 'Square', 'dims' => '1080×1080', 'url' => '/images/photos/lp-host-1.webp'],
                    ['key' => 'status', 'label' => 'Status', 'dims' => '1080×1920', 'url' => '/images/photos/lp-host-1.webp'],
                ],
            ],
            [
                'slug' => 'logo-pack', 'title' => 'Logo pack', 'type' => 'logo', 'meta' => 'PNG', 'ratio' => '16/9',
                'preview' => '/images/miv-logo.png', 'published_at' => now()->subDays(30),
                'caption' => 'The official Men of Issachar Vision logo. Please use it unchanged.',
                'sizes' => [['key' => 'png', 'label' => 'PNG', 'dims' => '225×225', 'url' => '/images/miv-logo.png']],
            ],
        ];

        foreach ($items as $item) {
            PublicityItem::updateOrCreate(['slug' => $item['slug']], $item);
        }
    }
}
