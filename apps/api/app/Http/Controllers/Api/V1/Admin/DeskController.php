<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Checkin\Actions\PrintBadge;
use App\Domain\Checkin\Models\Badge;
use App\Domain\Registration\Models\Registration;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeskController extends Controller
{
    /** Find who is at the desk: a scanned or typed claim code, or a phone number, email or name. */
    public function lookup(Request $request): JsonResponse
    {
        $q = trim($request->validate(['q' => ['required', 'string', 'min:2', 'max:120']])['q']);
        $digits = preg_replace('/\D/', '', $q);

        $query = Registration::with(['attendee.teamMembership.team'])->where('status', '!=', 'cancelled');
        if (preg_match('/^JC27-[A-Z]{3}-\d{5}$/i', $q)) {
            $query->where('claim_code', strtoupper($q));
        } else {
            $like = '%'.addcslashes($q, '%_\\').'%';
            $query->whereHas('attendee', fn ($a) => $a
                // 0803… and +234803… are the same number, so match on the last nine digits.
                ->when(strlen($digits) >= 6, fn ($w) => $w->where('phone', 'like', '%'.substr($digits, -9).'%'))
                ->when(strlen($digits) < 6, fn ($w) => $w->where(fn ($n) => $n->where('full_name', 'like', $like)->orWhere('email', 'like', $like)))
            );
        }

        return response()->json(['data' => $query->limit(6)->get()->map(fn (Registration $r) => $this->card($r))->values()]);
    }

    public function print(Request $request, PrintBadge $print): JsonResponse
    {
        $in = $request->validate([
            'registration_id' => ['required', 'integer'],
            'desk' => ['nullable', 'string', 'max:40'],
            'reprint' => ['sometimes', 'boolean'],
            'reason' => ['nullable', 'string', 'max:200'],
        ]);
        $reg = Registration::with('attendee.teamMembership.team')->findOrFail($in['registration_id']);

        $print($reg, $request->user('staff'), $in['desk'] ?? null, (bool) ($in['reprint'] ?? false), $in['reason'] ?? null);

        return response()->json(['data' => $this->card($reg->refresh()->load('attendee.teamMembership.team'))]);
    }

    public function summary(): JsonResponse
    {
        return response()->json(['data' => [
            'printed_today' => Badge::where('printed_at', '>=', now()->startOfDay())->count(),
            'printed_total' => Badge::count(),
        ]]);
    }

    private function card(Registration $r): array
    {
        $a = $r->attendee;
        $team = $a->teamMembership?->team;

        return [
            'registration_id' => $r->id,
            'claim_code' => $r->claim_code,
            'name' => $a->full_name,
            'church' => $a->church,
            'category' => $r->category->value,
            'mode' => $r->mode->value,
            'days' => $r->days,
            'team_code' => $team?->code,
            'phone_last4' => $a->phone ? substr(preg_replace('/\D/', '', $a->phone), -4) : null,
            'valid' => $r->status === 'confirmed',
            'status' => $r->status,
            'badge_printed_at' => $r->badge_printed_at?->toIso8601String(),
        ];
    }
}
