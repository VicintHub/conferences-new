<?php

namespace App\Domain\Publicity\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class PublicityItem extends Model
{
    /** Items published within this many days are flagged "new". */
    public const NEW_FOR_DAYS = 14;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['sizes' => 'array', 'is_video' => 'boolean', 'published_at' => 'datetime'];
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->whereNotNull('published_at')->where('published_at', '<=', now());
    }

    public function isNew(): bool
    {
        return $this->published_at?->gte(now()->subDays(self::NEW_FOR_DAYS)) ?? false;
    }
}
