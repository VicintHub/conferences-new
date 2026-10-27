<?php

namespace App\Domain\Testimonies\Models;

use App\Domain\Registration\Models\Attendee;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Testimony extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['tags' => 'array', 'show_name' => 'boolean', 'featured' => 'boolean', 'published_at' => 'datetime'];
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', 'approved')->whereNotNull('published_at')->where('published_at', '<=', now());
    }

    public function attendee(): BelongsTo
    {
        return $this->belongsTo(Attendee::class);
    }
}
