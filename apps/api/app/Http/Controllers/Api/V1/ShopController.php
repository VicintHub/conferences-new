<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Store\Models\Product;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    public const CATEGORIES = ['apparel' => 'Apparel', 'books' => 'Books'];

    public function index(Request $request): JsonResponse
    {
        $category = $request->query('category');
        $q = trim((string) $request->query('q', ''));

        $products = Product::with('variants')->where('active', true)
            ->when(is_string($category) && isset(self::CATEGORIES[$category]), fn ($query) => $query->where('category', $category))
            ->when($q !== '', fn ($query) => $query->where('name', 'like', '%'.str_replace(['%', '_'], ['\%', '\_'], $q).'%'))
            ->orderBy('sort')->orderBy('id')->get();

        $counts = Product::where('active', true)->selectRaw('category, count(*) as n')->groupBy('category')->pluck('n', 'category');

        return response()->json([
            'data' => $products->map(fn ($p) => (new ProductResource($p))->resolve())->values(),
            'meta' => [
                'categories' => collect(self::CATEGORIES)->map(fn ($label, $key) => ['key' => $key, 'label' => $label, 'count' => (int) ($counts[$key] ?? 0)])->values(),
                'total' => (int) $counts->sum(),
                // So the checkout page can show the fee before the server prices the order.
                'fee' => ['percent' => (float) config('shop.fee_percent'), 'flat_kobo' => (int) config('shop.fee_flat_kobo')],
                'methods' => config('shop.methods'),
            ],
        ]);
    }

    public function show(string $slug): ProductResource
    {
        return new ProductResource(Product::with('variants')->where('active', true)->where('slug', $slug)->firstOrFail(), detail: true);
    }
}
