<?php

namespace App\Domain\Speakers\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Speaker extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['bio' => 'array', 'published_at' => 'datetime'];
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->whereNotNull('published_at')->where('published_at', '<=', now());
    }
}
