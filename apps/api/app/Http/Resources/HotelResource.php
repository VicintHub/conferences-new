<?php

namespace App\Http\Resources;

use App\Domain\Travel\Models\Hotel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Hotel */
class HotelResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'slug' => $this->slug,
            'name' => $this->name,
            'area' => $this->area,
            'lat' => $this->lat !== null ? (float) $this->lat : null,
            'lng' => $this->lng !== null ? (float) $this->lng : null,
            // Null until the committee has the hotel's rate; the app then says "ask for the rate".
            'price_kobo' => $this->price_kobo,
            'distance_km' => $this->distance_km,
            'drive_minutes' => $this->drive_minutes,
            'conference_rate' => $this->conference_rate,
            // The code is only worth something with the hotel, so it is only shown where the discount applies.
            'rate_code' => $this->conference_rate ? config('conference.hotel_rate_code') : null,
            'image' => $this->image,
            'amenities' => $this->amenities,
            'shuttle_note' => $this->shuttle_note,
            'phone' => $this->phone,
            'whatsapp' => $this->whatsapp,
        ];
    }
}
