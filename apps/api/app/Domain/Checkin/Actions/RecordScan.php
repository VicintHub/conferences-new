<?php

namespace App\Domain\Checkin\Actions;

use App\Domain\Checkin\Models\Scan;
use App\Domain\Programme\Models\ProgrammeSession;
use App\Domain\Registration\Enums\AttendanceMode;
use App\Domain\Registration\Models\Registration;
use App\Domain\Staff\Models\StaffUser;
use App\Domain\Store\Enums\OrderStatus;
use App\Domain\Store\Models\Order;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Decides one scan at a checkpoint and records it, whatever the outcome. Safe to replay: a scan seen before (same
 * client_uuid) returns what was decided the first time, so a phone that lost its connection mid-sync can simply resend.
 *
 * Rules: gate and hall admit confirmed onsite attendees; a meal is once per meal window; merchandise is released
 * once, against a paid order's pickup QR. A supervisor can override a refusal that is a judgement call, never an
 * unknown code or an unconfirmed registration.
 */
class RecordScan
{
    /** A meal scan counts for this long before and after the meal's scheduled window. */
    public const MEAL_GRACE_MINUTES = 15;

    private const TZ = 'Africa/Lagos';

    /**
     * @param  array{client_uuid: string, code: string, checkpoint: string, scanned_at: string, device?: ?string, override?: bool}  $item
     * @return array<string, mixed>
     */
    public function __invoke(StaffUser $staff, array $item): array
    {
        if ($seen = Scan::where('client_uuid', $item['client_uuid'])->first()) {
            return $this->payload($seen, $staff, duplicate: true);
        }

        try {
            $scan = DB::transaction(fn () => $this->record($staff, $item));
        } catch (UniqueConstraintViolationException) {
            // Two requests carried the same scan at once; the other one won.
            return $this->payload(Scan::where('client_uuid', $item['client_uuid'])->firstOrFail(), $staff, duplicate: true);
        }

        return $this->payload($scan, $staff);
    }

    private function record(StaffUser $staff, array $item): Scan
    {
        $at = Carbon::parse($item['scanned_at']);
        $code = strtoupper(trim($item['code']));
        $checkpoint = $item['checkpoint'];

        $v = match ($checkpoint) {
            'merch' => $this->merch($code, $at),
            default => $this->person($checkpoint, $code, $at),
        };

        $overridden = false;
        if (! $v['ok'] && ($item['override'] ?? false) && $v['overridable'] && $staff->role->can('override')) {
            $v['ok'] = true;
            $overridden = true;
            $v['detail'] = trim("Override ({$v['reason']}). ".($v['detail'] ?? ''));
            // A refusal carries no label of its own ("Gate", "Lunch"), but the phone shows one for an accepted scan.
            $v['label'] ??= Scan::CHECKPOINTS[$checkpoint];
        }

        if ($v['ok'] && isset($v['order'])) {
            $v['order']->transitionTo(OrderStatus::Collected);
            $v['order']->forceFill(['collected_at' => $at])->save();
        }

        $scan = Scan::create([
            'client_uuid' => $item['client_uuid'],
            'code' => mb_substr($code, 0, 40),
            'checkpoint' => $checkpoint,
            'registration_id' => $v['registration']?->id,
            'order_id' => ($v['order'] ?? null)?->id,
            'result' => $v['ok'] ? 'ok' : 'refused',
            'reason' => $v['ok'] && ! $overridden ? null : $v['reason'],
            'label' => $v['label'] ?? null,
            'detail' => $v['detail'] ?? null,
            'window_key' => $v['window'] ?? null,
            'device' => isset($item['device']) ? mb_substr($item['device'], 0, 40) : null,
            'staff_id' => $staff->id,
            'overridden' => $overridden,
            'scanned_at' => $at,
        ]);

        return $scan;
    }

    /** gate | hall | meal: a person's badge or claim ticket. */
    private function person(string $checkpoint, string $code, Carbon $at): array
    {
        $none = fn (string $reason) => ['ok' => false, 'reason' => $reason, 'overridable' => false, 'detail' => null, 'registration' => null];

        if (preg_match('/^MV-\d+$/', $code)) {
            return $none('That’s a merchandise pickup code');
        }
        $reg = Registration::with('attendee')->where('claim_code', $code)->lockForUpdate()->first();
        if (! $reg) {
            return $none('Unknown code');
        }
        $base = ['registration' => $reg, 'overridable' => true];
        $category = $reg->category->value === 'international' ? 'International' : ucfirst($reg->category->value);

        if ($reg->status !== 'confirmed') {
            return ['ok' => false, 'reason' => 'Registration not confirmed', 'detail' => null] + $base + ['overridable' => false];
        }
        if ($reg->mode === AttendanceMode::Online) {
            return ['ok' => false, 'reason' => 'Registered as online', 'detail' => 'Not an onsite place.'] + $base;
        }

        $dayStart = $at->copy()->setTimezone(self::TZ)->startOfDay();

        if ($checkpoint !== 'meal') {
            $again = Scan::where('registration_id', $reg->id)->where('checkpoint', $checkpoint)->where('result', 'ok')
                ->whereBetween('scanned_at', [$dayStart, $dayStart->copy()->endOfDay()])->exists();

            return ['ok' => true, 'label' => Scan::CHECKPOINTS[$checkpoint], 'detail' => $category.($again ? ' · Back in' : ''), 'reason' => null] + $base;
        }

        $session = $this->mealWindow($at);
        if (! $session) {
            return ['ok' => false, 'reason' => 'No meal service right now', 'detail' => null] + $base;
        }
        $window = "meal:{$session->id}";

        $served = Scan::where('registration_id', $reg->id)->where('checkpoint', 'meal')->where('window_key', $window)->where('result', 'ok')->orderBy('id')->first();
        if ($served) {
            $where = $served->device ?: 'a meal point';
            $when = $served->scanned_at->copy()->setTimezone(self::TZ)->format('g:i A');

            return ['ok' => false, 'reason' => 'Already served', 'label' => $session->title, 'window' => $window, 'detail' => "{$session->title} collected at {$where}\n{$when} today"] + $base;
        }

        $nth = Scan::where('registration_id', $reg->id)->where('checkpoint', 'meal')->where('result', 'ok')
            ->whereBetween('scanned_at', [$dayStart, $dayStart->copy()->endOfDay()])->count() + 1;

        return ['ok' => true, 'reason' => null, 'label' => $session->title, 'window' => $window, 'detail' => "{$category} · ".self::ordinal($nth).' meal today'] + $base;
    }

    /** merch: a paid order's pickup QR (the order code). */
    private function merch(string $code, Carbon $at): array
    {
        if (! preg_match('/^MV-\d+$/', $code)) {
            $known = Registration::where('claim_code', $code)->exists();

            return ['ok' => false, 'reason' => $known ? 'Scan the pickup QR from the order' : 'Unknown code', 'overridable' => false, 'detail' => null, 'registration' => null];
        }
        $order = Order::with('items')->where('code', $code)->lockForUpdate()->first();
        if (! $order) {
            return ['ok' => false, 'reason' => 'Unknown order', 'overridable' => false, 'detail' => null, 'registration' => null];
        }

        $items = $order->items->map(fn ($i) => trim("{$i->name} ×{$i->qty}"))->implode(', ');
        $v = ['label' => 'Merchandise', 'registration' => null, 'overridable' => false, 'order' => $order];

        if ($order->status === OrderStatus::Paid) {
            return $v + ['ok' => true, 'reason' => null, 'detail' => $order->customer_name."\n".$items];
        }
        unset($v['order']); // only a paid order is handed over, so only then does the scan touch it

        return $order->status === OrderStatus::Collected
            ? $v + ['ok' => false, 'reason' => 'Already collected', 'detail' => $order->customer_name."\nCollected ".($order->collected_at?->copy()->setTimezone(self::TZ)->format('g:i A') ?? 'earlier')]
            : $v + ['ok' => false, 'reason' => 'Not paid ('.str_replace('_', ' ', $order->status->value).')', 'detail' => $order->customer_name];
    }

    private function mealWindow(Carbon $at): ?ProgrammeSession
    {
        $grace = self::MEAL_GRACE_MINUTES;

        return ProgrammeSession::where('kind', 'meal')
            ->where('starts_at', '<=', $at->copy()->addMinutes($grace))->where('ends_at', '>=', $at->copy()->subMinutes($grace))
            ->orderBy('starts_at')->first();
    }

    private static function ordinal(int $n): string
    {
        return $n.(in_array($n % 100, [11, 12, 13], true) ? 'th' : match ($n % 10) {
            1 => 'st', 2 => 'nd', 3 => 'rd', default => 'th'
        });
    }

    /** @return array<string, mixed> */
    private function payload(Scan $scan, StaffUser $staff, bool $duplicate = false): array
    {
        $scan->loadMissing('registration.attendee');
        $reg = $scan->registration;

        return [
            'client_uuid' => $scan->client_uuid,
            'result' => $scan->result,
            'reason' => $scan->reason,
            'label' => $scan->label,
            'detail' => $scan->detail ?? null,
            'checkpoint' => $scan->checkpoint,
            'overridden' => $scan->overridden,
            'duplicate' => $duplicate,
            'attendee' => $reg ? ['name' => $reg->attendee->full_name, 'category' => $reg->category->value, 'mode' => $reg->mode->value] : null,
            'can_override' => $scan->result === 'refused' && ! $scan->overridden && $staff->role->can('override') && $this->overridable($scan),
        ];
    }

    private function overridable(Scan $scan): bool
    {
        return $scan->registration_id !== null && in_array($scan->reason, ['Registered as online', 'No meal service right now', 'Already served'], true);
    }
}
