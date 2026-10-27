<?php

namespace Tests\Feature;

use App\Domain\Publicity\Models\PublicityItem;
use Database\Seeders\PublicitySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicityApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_lists_published_items_newest_first_with_new_flags_and_counts(): void
    {
        $this->seed(PublicitySeeder::class);
        PublicityItem::where('slug', 'meet-the-hosts')->update(['published_at' => now()->addDay()]);

        $res = $this->getJson('/api/v1/publicity')->assertOk();

        $this->assertSame(['official-flyer', 'logo-pack'], array_column($res->json('data'), 'slug'));
        $this->assertTrue($res->json('data.0.new'));
        $this->assertFalse($res->json('data.1.new'));
        $this->assertSame(1, $res->json('meta.new_count'));
        $this->assertSame('Flyers', $res->json('meta.types.flyer'));
        $this->assertCount(3, $res->json('data.0.sizes'));
        $this->assertSame('square', $res->json('data.0.sizes.0.key'));
    }

    public function test_filters_by_type_and_ignores_unknown_types(): void
    {
        $this->seed(PublicitySeeder::class);

        $this->assertSame(['logo-pack'], array_column($this->getJson('/api/v1/publicity?type=logo')->json('data'), 'slug'));
        $this->assertCount(3, $this->getJson('/api/v1/publicity?type=bogus')->json('data'));
    }

    public function test_shows_one_item_and_hides_unpublished(): void
    {
        $this->seed(PublicitySeeder::class);
        PublicityItem::where('slug', 'logo-pack')->update(['published_at' => null]);

        $this->getJson('/api/v1/publicity/official-flyer')->assertOk()->assertJsonPath('data.title', 'Official flyer');
        $this->getJson('/api/v1/publicity/logo-pack')->assertNotFound();
        $this->getJson('/api/v1/publicity/nope')->assertNotFound();
    }

    public function test_tracks_downloads_and_shares_without_a_login(): void
    {
        $this->seed(PublicitySeeder::class);

        $this->postJson('/api/v1/publicity/official-flyer/track', ['event' => 'download'])->assertNoContent();
        $this->postJson('/api/v1/publicity/official-flyer/track', ['event' => 'download'])->assertNoContent();
        $this->postJson('/api/v1/publicity/official-flyer/track', ['event' => 'share'])->assertNoContent();

        $item = PublicityItem::where('slug', 'official-flyer')->first();
        $this->assertSame(2, $item->downloads_count);
        $this->assertSame(1, $item->shares_count);
        $this->postJson('/api/v1/publicity/official-flyer/track', ['event' => 'hack'])->assertJsonValidationErrors('event');
        $this->postJson('/api/v1/publicity/nope/track', ['event' => 'share'])->assertNotFound();
    }
}
