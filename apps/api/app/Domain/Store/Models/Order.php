<?php

namespace App\Domain\Store\Models;

use App\Domain\Registration\Models\Attendee;
use App\Domain\Store\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use LogicException;

class Order extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['status' => OrderStatus::class, 'expires_at' => 'datetime', 'paid_at' => 'datetime', 'collected_at' => 'datetime'];
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function attendee(): BelongsTo
    {
        return $this->belongsTo(Attendee::class);
    }

    /** The only way status changes, so an illegal jump (e.g. refunded → paid) can never happen quietly. */
    public function transitionTo(OrderStatus $next): void
    {
        if (! $this->status->canBecome($next)) {
            throw new LogicException("Order {$this->code} cannot go from {$this->status->value} to {$next->value}.");
        }
        $this->status = $next;
        $this->save();
    }
}
