<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Programme\Models\ProgrammeSession;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ProgrammeController extends Controller
{
    /** The whole week, grouped by day. Public and cacheable: the app also keeps a copy for offline use. */
    public function __invoke(): JsonResponse
    {
        $days = ProgrammeSession::orderBy('starts_at')->get()->groupBy(fn ($s) => $s->day->toDateString())
            ->map(fn ($sessions, $day) => [
                'date' => $day,
                'title' => config("conference.day_titles.{$day}"),
                'sessions' => $sessions->map(fn ($s) => [
                    'id' => $s->id,
                    'title' => $s->title,
                    'subtitle' => $s->subtitle,
                    'kind' => $s->kind,
                    'starts_at' => $s->starts_at->toIso8601String(),
                    'ends_at' => $s->ends_at->toIso8601String(),
                ])->values(),
            ])->values();

        return response()->json(['data' => $days])->header('Cache-Control', 'public, max-age=60');
    }
}
