<?php

namespace App\Http\Resources;

use App\Domain\Store\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Order */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $pending = $this->payments->firstWhere('status', 'initialized');

        return [
            'code' => $this->code,
            'status' => $this->status,
            'method' => $this->method,
            'customer_name' => $this->customer_name,
            'subtotal_kobo' => $this->subtotal_kobo,
            'fee_kobo' => $this->fee_kobo,
            'total_kobo' => $this->total_kobo,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'collected_at' => $this->collected_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            // What the pickup QR encodes. Only meaningful once paid.
            'pickup_code' => $this->code,
            // Lets an unfinished order resume on the provider's page.
            'pay_url' => $this->status->value === 'pending' ? $pending?->authorization_url : null,
            'items' => $this->items->map(fn ($i) => [
                'name' => $i->name,
                'variant_label' => $i->variant_label,
                'image' => $i->image,
                'unit_price_kobo' => $i->unit_price_kobo,
                'qty' => $i->qty,
            ])->values(),
        ];
    }
}
