<?php

namespace App\Http\Resources;

use App\Domain\Checkin\Models\Scan;
use App\Domain\Registration\Models\Registration;
use App\Domain\Store\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Registration */
class RegistrationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'claim_code' => $this->claim_code,
            'category' => $this->category,
            'mode' => $this->mode,
            'days' => $this->days,
            'needs_accommodation' => $this->needs_accommodation,
            'status' => $this->status,
            'minister_verified' => (bool) $this->minister_verified_at,
            'badge' => $this->badge_printed_at ? ['printed_at' => $this->badge_printed_at->toIso8601String()] : null,
            'access' => $this->access(),
            'attendee' => [
                'full_name' => $this->attendee->full_name,
                'first_name' => explode(' ', trim($this->attendee->full_name))[0],
                'email' => $this->attendee->email,
                'church' => $this->attendee->church,
            ],
        ];
    }

    /** What the person has used today, from the door and meal scans (and merchandise they have collected). */
    private function access(): array
    {
        $today = now()->startOfDay();
        $used = Scan::where('registration_id', $this->id)->where('result', 'ok')->where('scanned_at', '>=', $today)->pluck('checkpoint')->unique()->all();
        $merch = Order::where('attendee_id', $this->attendee_id)->where('status', 'collected')->exists();

        return collect(['gate' => 'Gate', 'hall' => 'Hall', 'meal' => 'Meal', 'merch' => 'Merch'])
            ->map(fn ($label, $key) => ['key' => $key, 'label' => $label, 'used' => $key === 'merch' ? $merch : in_array($key, $used, true)])
            ->values()->all();
    }
}
