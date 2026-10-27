<?php

namespace App\Domain\Registration\Actions;

use Illuminate\Support\Facades\DB;

/**
 * Takes one onsite place under a row lock. Must run inside a transaction.
 * Returns false when the cap is reached (caller falls back to online).
 */
class ClaimOnsiteSeat
{
    public function __invoke(): bool
    {
        DB::table('capacity_counters')->insertOrIgnore(['name' => 'onsite', 'taken' => 0]);

        $row = DB::table('capacity_counters')->where('name', 'onsite')->lockForUpdate()->first();
        if ($row->taken >= (int) config('conference.onsite_capacity')) {
            return false;
        }

        DB::table('capacity_counters')->where('name', 'onsite')->increment('taken');

        return true;
    }
}
