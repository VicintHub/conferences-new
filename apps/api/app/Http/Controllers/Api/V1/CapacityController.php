<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CapacityController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $limit = (int) config('conference.onsite_capacity');
        $taken = (int) DB::table('capacity_counters')->where('name', 'onsite')->value('taken');

        return response()->json(['data' => ['onsite' => ['taken' => $taken, 'limit' => $limit, 'full' => $taken >= $limit]]]);
    }
}
