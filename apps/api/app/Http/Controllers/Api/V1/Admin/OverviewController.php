<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Admin\Queries\Badges;
use App\Domain\Applications\Enums\ApplicationStatus;
use App\Domain\Applications\Models\Application;
use App\Domain\Registration\Enums\AttendanceMode;
use App\Domain\Registration\Enums\RegistrationCategory;
use App\Domain\Registration\Models\Registration;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class OverviewController extends Controller
{
    private const DAYS = 14;

    public function __invoke(): JsonResponse
    {
        $confirmed = fn () => Registration::where('status', 'confirmed');
        $today = now()->startOfDay();

        $capacity = (int) config('conference.onsite_capacity');
        $onsiteTaken = (int) DB::table('capacity_counters')->where('name', 'onsite')->value('taken');

        [$ministers, $applications] = Badges::pendingApprovals();
        $oldest = collect([$ministers->min('created_at'), $applications->min('created_at')])->filter()->map(fn ($t) => Carbon::parse($t))->min();

        $byDay = $confirmed()->where('created_at', '>=', $today->copy()->subDays(self::DAYS - 1))->get(['created_at'])
            ->countBy(fn ($r) => $r->created_at->toDateString());
        $series = collect(range(self::DAYS - 1, 0))->map(function ($ago) use ($today, $byDay) {
            $day = $today->copy()->subDays($ago);

            return ['date' => $day->toDateString(), 'count' => (int) ($byDay[$day->toDateString()] ?? 0)];
        })->values();

        $count = fn ($category) => $confirmed()->where('category', $category->value)->count();
        $iylc = $confirmed()->whereHas('attendee', fn ($q) => $q->whereIn('age_band', ['16-17', '18-45']))->count();

        return response()->json(['data' => [
            'days_to_opening' => max(0, (int) ceil(now()->floatDiffInDays(Carbon::parse(config('conference.starts_at')), false))),
            'kpis' => [
                'registered' => ['value' => $confirmed()->count(), 'today' => $confirmed()->where('created_at', '>=', $today)->count()],
                'onsite' => ['value' => $confirmed()->where('mode', AttendanceMode::Onsite->value)->count(), 'percent_of_cap' => $capacity ? (int) round($onsiteTaken / $capacity * 100) : 0],
                'online' => ['value' => $confirmed()->where('mode', AttendanceMode::Online->value)->count(), 'today' => $confirmed()->where('mode', AttendanceMode::Online->value)->where('created_at', '>=', $today)->count()],
                'awaiting_approval' => ['value' => $ministers->count() + $applications->count(), 'oldest_days' => $oldest ? (int) $oldest->diffInDays(now()) : null],
            ],
            'series' => $series,
            'capacity' => ['taken' => $onsiteTaken, 'total' => $capacity, 'percent' => $capacity ? (int) round($onsiteTaken / $capacity * 100) : 0],
            'categories' => [
                ['key' => 'delegate', 'label' => 'Delegates', 'count' => $count(RegistrationCategory::Delegate)],
                ['key' => 'minister', 'label' => 'Ministers', 'count' => $count(RegistrationCategory::Minister)],
                ['key' => 'international', 'label' => 'International', 'count' => $count(RegistrationCategory::International)],
                ['key' => 'iylc', 'label' => 'IYLC (16–45)', 'count' => $iylc],
                ['key' => 'invited', 'label' => 'VIP · Speaker · Vendor · Media', 'count' => Application::where('status', ApplicationStatus::Approved->value)->count()],
            ],
        ]]);
    }
}
