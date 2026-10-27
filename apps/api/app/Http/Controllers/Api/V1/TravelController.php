<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Travel\Models\Hotel;
use App\Domain\Travel\Models\Shuttle;
use App\Http\Controllers\Controller;
use App\Http\Resources\HotelResource;
use Illuminate\Http\JsonResponse;

class TravelController extends Controller
{
    /** Hotels (nearest first), shuttles and the venue in one small payload, so the screen works offline from one copy. */
    public function __invoke(): JsonResponse
    {
        return response()->json(['data' => [
            'venue' => [
                'name' => 'Leadership & Missions Conference Centre',
                'address' => 'Olororo, Ojoo, Ibadan',
                'lat' => config('conference.venue_lat'),
                'lng' => config('conference.venue_lng'),
            ],
            'hotels' => HotelResource::collection(Hotel::where('active', true)->orderBy('distance_km')->orderBy('sort')->get()),
            'shuttles' => Shuttle::where('active', true)->orderBy('sort')->get(['id', 'name', 'schedule']),
        ]]);
    }
}
