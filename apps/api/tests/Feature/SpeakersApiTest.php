<?php

namespace Tests\Feature;

use App\Domain\Speakers\Models\Speaker;
use Database\Seeders\SpeakerSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SpeakersApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_lists_hosts_first_then_past_speakers_in_order(): void
    {
        $this->seed(SpeakerSeeder::class);

        $res = $this->getJson('/api/v1/speakers')->assertOk();

        $data = $res->json('data');
        $this->assertCount(8, $data);
        $this->assertSame(['host', 'host'], array_column(array_slice($data, 0, 2), 'group'));
        $this->assertSame('Rev. Samson Ajetomobi', $data[0]['name']);
        $this->assertSame('IMLC 2026', $data[2]['short_role']);
        $this->assertCount(7, $data[0]['bio']);
        $this->assertNull($data[2]['photo']);
    }

    public function test_shows_one_speaker_by_slug_with_a_mobile_photo_fallback(): void
    {
        $this->seed(SpeakerSeeder::class);

        $this->getJson('/api/v1/speakers/stellamaris-ajetomobi')->assertOk()
            ->assertJsonPath('data.name', 'Rev. Stellamaris Ajetomobi')
            ->assertJsonPath('data.photo_mobile', '/images/photos/lp-host-2m.webp');

        Speaker::where('slug', 'poju-oyemade')->update(['photo' => '/x.webp']);
        $this->getJson('/api/v1/speakers/poju-oyemade')->assertJsonPath('data.photo_mobile', '/x.webp');
    }

    public function test_unknown_and_unpublished_speakers_are_not_found(): void
    {
        $this->seed(SpeakerSeeder::class);
        Speaker::where('slug', 'poju-oyemade')->update(['published_at' => now()->addDay()]);

        $this->getJson('/api/v1/speakers/nobody')->assertNotFound();
        $this->getJson('/api/v1/speakers/poju-oyemade')->assertNotFound();
        $this->assertCount(7, $this->getJson('/api/v1/speakers')->json('data'));
    }
}
