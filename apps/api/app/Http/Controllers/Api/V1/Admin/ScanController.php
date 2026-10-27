<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Checkin\Actions\RecordScan;
use App\Domain\Checkin\Models\Scan;
use App\Domain\Checkin\Queries\Roster;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ScanController extends Controller
{
    /** Up to 100 scans, in the order they were made. Each gets its own result, so one bad scan never blocks the rest. */
    public function batch(Request $request, RecordScan $record): JsonResponse
    {
        $in = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.client_uuid' => ['required', 'string', 'min:8', 'max:64'],
            'items.*.code' => ['required', 'string', 'max:60'],
            'items.*.checkpoint' => ['required', Rule::in(array_keys(Scan::CHECKPOINTS))],
            // A phone may be offline for days, but never in the future and never absurdly old.
            'items.*.scanned_at' => ['required', 'date', 'after:-14 days', 'before:+10 minutes'],
            'items.*.device' => ['nullable', 'string', 'max:40'],
            'items.*.override' => ['sometimes', 'boolean'],
        ]);

        $staff = $request->user('staff');

        return response()->json(['data' => collect($in['items'])->map(fn ($item) => $record($staff, $item))->values()]);
    }

    public function roster(Roster $roster): JsonResponse
    {
        return response()->json(['data' => $roster()]);
    }
}
