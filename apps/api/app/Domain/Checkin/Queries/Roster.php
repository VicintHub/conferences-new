<?php

namespace App\Domain\Checkin\Queries;

use App\Domain\Checkin\Models\Scan;
use App\Domain\Programme\Models\ProgrammeSession;
use App\Domain\Registration\Enums\AttendanceMode;
use App\Domain\Registration\Models\Registration;
use App\Domain\Store\Enums\OrderStatus;
use App\Domain\Store\Models\Order;

/**
 * Everything a scanner needs to keep deciding with no signal: who is on the onsite list, which orders are waiting
 * to be collected, when the meals are, and who has already been served. The server still has the last word when
 * the phone reconnects and replays what it did.
 */
class Roster
{
    /** @return array<string, mixed> */
    public function __invoke(): array
    {
        $people = Registration::with('attendee:id,full_name')->where('status', 'confirmed')->where('mode', AttendanceMode::Onsite->value)
            ->get(['id', 'attendee_id', 'claim_code', 'category'])
            ->mapWithKeys(fn (Registration $r) => [$r->claim_code => ['n' => $r->attendee->full_name, 'c' => $r->category->value]]);

        $orders = Order::whereIn('status', [OrderStatus::Paid->value, OrderStatus::Collected->value])->get(['code', 'customer_name', 'status'])
            ->mapWithKeys(fn (Order $o) => [$o->code => ['n' => $o->customer_name, 's' => $o->status->value]]);

        $meals = ProgrammeSession::where('kind', 'meal')->where('ends_at', '>=', now()->subDay())->where('starts_at', '<=', now()->addDays(2))->orderBy('starts_at')
            ->get(['id', 'title', 'starts_at', 'ends_at'])
            ->map(fn ($s) => ['id' => $s->id, 'title' => $s->title, 'starts_at' => $s->starts_at->toIso8601String(), 'ends_at' => $s->ends_at->toIso8601String()]);

        $served = Scan::where('checkpoint', 'meal')->where('result', 'ok')->whereIn('window_key', $meals->map(fn ($m) => "meal:{$m['id']}"))
            ->with('registration:id,claim_code')->get(['registration_id', 'window_key'])
            ->groupBy('window_key')->map(fn ($g) => $g->pluck('registration.claim_code')->filter()->values());

        return [
            'generated_at' => now()->toIso8601String(),
            'people' => $people,
            'orders' => $orders,
            'meals' => $meals,
            'served' => $served,
            'grace_minutes' => 15,
        ];
    }
}
