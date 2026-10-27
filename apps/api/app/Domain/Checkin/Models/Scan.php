<?php

namespace App\Domain\Checkin\Models;

use App\Domain\Registration\Models\Registration;
use App\Domain\Store\Models\Order;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Scan extends Model
{
    public const CHECKPOINTS = ['gate' => 'Gate', 'hall' => 'Hall', 'meal' => 'Meal', 'merch' => 'Merch'];

    protected $guarded = [];

    protected function casts(): array
    {
        return ['overridden' => 'boolean', 'scanned_at' => 'datetime'];
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
