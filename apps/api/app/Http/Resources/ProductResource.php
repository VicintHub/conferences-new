<?php

namespace App\Http\Resources;

use App\Domain\Store\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
class ProductResource extends JsonResource
{
    public function __construct($resource, private bool $detail = false)
    {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        $base = [
            'slug' => $this->slug,
            'name' => $this->name,
            'category' => $this->category,
            'price_kobo' => $this->price_kobo,
            'tag' => $this->tag,
            'image' => $this->images[0] ?? null,
            'in_stock' => $this->variants->sum('stock') > 0,
        ];

        if (! $this->detail) {
            return $base;
        }

        return $base + [
            'description' => $this->description,
            'images' => $this->images,
            'colors' => $this->colors,
            'sizes' => $this->sizes,
            'facts' => $this->facts,
            'variants' => $this->variants->map(fn ($v) => ['id' => $v->id, 'size' => $v->size, 'color' => $v->color, 'stock' => $v->stock])->values(),
        ];
    }
}
