<?php

namespace Tests\Feature;

use App\Domain\Store\Models\Product;
use Database\Seeders\ShopSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShopSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_revival_merchandise_has_the_agreed_prices(): void
    {
        $this->seed(ShopSeeder::class);

        $prices = Product::where('active', true)->orderBy('sort')->pluck('price_kobo', 'slug')->all();

        $this->assertSame(2000000, $prices['revival-hoodie']);          // ₦20,000
        $this->assertSame(1300000, $prices['revival-polo']);            // ₦13,000
        $this->assertSame(1300000, $prices['revival-t-shirt']);         // ₦13,000
        $this->assertSame(1600000, $prices['revival-baseball-shirt']);  // ₦16,000
        $this->assertSame(800000, $prices['revival-face-cap']);         // ₦8,000
    }

    public function test_the_photos_exist_and_the_cap_waits_for_one(): void
    {
        $this->seed(ShopSeeder::class);

        foreach (Product::where('active', true)->get() as $product) {
            foreach ($product->images as $path) {
                $this->assertFileExists(base_path('../web/public'.$path), "{$product->slug} points at {$path}");
            }
        }
        $this->assertSame([], Product::where('slug', 'revival-face-cap')->first()->images);
        $this->assertCount(2, Product::where('slug', 'revival-hoodie')->first()->images);
    }

    public function test_the_polo_comes_in_white_and_navy_with_stock_in_every_size(): void
    {
        $this->seed(ShopSeeder::class);

        $polo = Product::where('slug', 'revival-polo')->first();
        $this->assertSame(['White', 'Navy'], array_column($polo->colors, 'name'));
        $this->assertSame(10, $polo->variants()->count());
        $this->assertSame(0, $polo->variants()->where('stock', '<=', 0)->count());
        $this->assertSame(1, Product::where('slug', 'revival-face-cap')->first()->variants()->count()); // one size
    }

    public function test_reseeding_retires_old_placeholders_without_deleting_them_and_is_repeatable(): void
    {
        Product::create(['slug' => 'executive-polo', 'name' => 'Old', 'category' => 'apparel', 'price_kobo' => 1, 'images' => [], 'colors' => [], 'sizes' => [], 'facts' => [], 'active' => true]);

        $this->seed(ShopSeeder::class);
        $this->seed(ShopSeeder::class);

        $this->assertFalse(Product::where('slug', 'executive-polo')->first()->active);
        $this->assertSame(6, Product::where('active', true)->count());
        $this->assertSame(7, Product::count());
    }
}
