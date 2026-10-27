<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Checkin\Models\Badge;
use App\Domain\Checkin\Models\Scan;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class CheckinController extends Controller
{
    /** Check-in & meals: what the door and the meal points have done today. */
    public function __invoke(): JsonResponse
    {
        $today = now()->startOfDay();
        $scans = Scan::where('scanned_at', '>=', $today);

        $byCheckpoint = collect(Scan::CHECKPOINTS)->map(fn ($label, $key) => [
            'key' => $key, 'label' => $label,
            'ok' => (clone $scans)->where('checkpoint', $key)->where('result', 'ok')->count(),
            'refused' => (clone $scans)->where('checkpoint', $key)->where('result', 'refused')->count(),
        ])->values();

        return response()->json(['data' => [
            'checkpoints' => $byCheckpoint,
            'meals' => (clone $scans)->where('checkpoint', 'meal')->where('result', 'ok')->whereNotNull('label')->selectRaw('label, count(*) as n')->groupBy('label')->pluck('n', 'label'),
            'refusals' => (clone $scans)->where('result', 'refused')->selectRaw('reason, count(*) as n')->groupBy('reason')->orderByDesc('n')->pluck('n', 'reason'),
            'overrides' => (clone $scans)->where('overridden', true)->count(),
            'badges' => ['today' => Badge::where('printed_at', '>=', $today)->count(), 'total' => Badge::count(), 'reprints' => Badge::where('reprint', true)->count()],
            'recent' => Scan::with('registration.attendee', 'order')->latest('scanned_at')->limit(20)->get()->map(fn (Scan $s) => [
                'id' => $s->id,
                'checkpoint' => $s->checkpoint,
                'result' => $s->result,
                'reason' => $s->reason,
                'overridden' => $s->overridden,
                'who' => $s->registration?->attendee->full_name ?? $s->order?->customer_name ?? $s->code,
                'device' => $s->device,
                'scanned_at' => $s->scanned_at->toIso8601String(),
            ])->values(),
        ]]);
    }
}
