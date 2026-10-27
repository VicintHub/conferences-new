<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class EventController extends Controller
{
    /** Public event facts the web app needs (countdown target, venue, capacity). */
    public function __invoke(): JsonResponse
    {
        return response()->json(['data' => [
            'name' => config('conference.name'),
            'organiser' => config('conference.organiser'),
            'starts_at' => config('conference.starts_at'),
            'ends_at' => config('conference.ends_at'),
            'venue' => config('conference.venue'),
            'onsite_capacity' => config('conference.onsite_capacity'),
        ]]);
    }
}
