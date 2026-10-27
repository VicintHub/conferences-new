<?php

namespace App\Domain\Store\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariant extends Model
{
    protected $guarded = [];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function label(): ?string
    {
        $parts = array_filter([$this->size ? "Size {$this->size}" : null, $this->color]);

        return $parts ? implode(' · ', $parts) : null;
    }
}
