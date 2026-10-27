<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Hand stock back from unpaid orders whose hold has lapsed.
Schedule::command('shop:expire-orders')->everyFiveMinutes()->withoutOverlapping();

// Email "starts soon" reminders to people who asked for them.
Schedule::command('live:send-reminders')->everyMinute()->withoutOverlapping();
// Heartbeat rows are only meaningful for a minute or two; keep the table small.
Schedule::call(fn () => DB::table('live_viewers')->where('seen_at', '<', now()->subDay())->delete())->daily();
// Send scheduled broadcasts when their time comes.
Schedule::command('broadcasts:dispatch')->everyMinute()->withoutOverlapping();
