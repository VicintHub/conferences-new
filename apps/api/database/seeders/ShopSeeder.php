<?php

namespace Database\Seeders;

use App\Domain\Store\Models\Product;
use Illuminate\Database\Seeder;

/**
 * The Revival (37th IMLC) merchandise. Photos are the committee's own mock-ups. The face cap has no photo yet
 * (the shop shows a placeholder until one is uploaded) and stock levels are starting figures to be corrected.
 */
class ShopSeeder extends Seeder
{
    public const SLUGS = ['revival-hoodie', 'revival-polo', 'revival-baseball-shirt', 'revival-t-shirt', 'revival-face-cap', 'ministers-journal'];

    public function run(): void
    {
        $facts = [['k' => 'Pickup', 'v' => 'Merchandise desk, venue'], ['k' => 'Design', 'v' => 'Revival · IMLC 37th'], ['k' => 'Returns', 'v' => 'Size swap at the desk']];
        $sizes = ['S', 'M', 'L', 'XL', 'XXL'];
        $img = fn (string ...$names) => array_map(fn ($n) => "/images/merch/{$n}.jpg", $names);

        $products = [
            ['revival-hoodie', 'Revival Hoodie', 'apparel', 2000000, 'New', $img('revival-hoodie', 'revival-hoodie-alt'), [['name' => 'Black', 'hex' => '#16181d']], $sizes],
            ['revival-polo', 'Revival Polo', 'apparel', 1300000, null, $img('revival-polo-white', 'revival-polo-navy'), [['name' => 'White', 'hex' => '#ffffff', 'image' => 0], ['name' => 'Navy', 'hex' => '#0b2a5b', 'image' => 1]], $sizes],
            ['revival-baseball-shirt', 'Revival Baseball Shirt', 'apparel', 1600000, null, $img('revival-baseball'), [['name' => 'Cream', 'hex' => '#f3ead3']], $sizes],
            ['revival-t-shirt', 'Revival T-shirt', 'apparel', 1300000, null, $img('revival-tee'), [['name' => 'Black wash', 'hex' => '#2a2c31']], $sizes],
            ['revival-face-cap', 'Revival Face Cap', 'apparel', 800000, null, [], [], []],
            ['ministers-journal', 'Ministers Syllabus & Prophetic Journal', 'books', 600000, null, [], [], []],
        ];

        foreach ($products as $i => [$slug, $name, $category, $price, $tag, $images, $colors, $productSizes]) {
            $product = Product::updateOrCreate(['slug' => $slug], [
                'name' => $name, 'category' => $category, 'price_kobo' => $price, 'tag' => $tag, 'images' => $images,
                'colors' => $colors, 'sizes' => $productSizes, 'facts' => $category === 'books' ? [['k' => 'Pickup', 'v' => 'Merchandise desk, venue']] : $facts,
                'description' => null, 'active' => true, 'sort' => $i,
            ]);

            // Re-seeding refreshes variants and stock; orders keep their own snapshots, so nothing already sold changes.
            $product->variants()->delete();
            foreach ($productSizes ?: [null] as $size) {
                foreach ($colors ?: [['name' => null]] as $color) {
                    $product->variants()->create(['size' => $size, 'color' => $color['name'], 'stock' => $category === 'books' ? 100 : ($size === 'L' ? 46 : 30)]);
                }
            }
        }

        // Earlier placeholder products are retired rather than deleted, because past orders refer to them.
        Product::whereNotIn('slug', self::SLUGS)->update(['active' => false]);
    }
}
