<?php

namespace App\Console\Commands;

use App\Domain\Live\Actions\SendSessionReminders as Send;
use Illuminate\Console\Command;

class SendSessionReminders extends Command
{
    protected $signature = 'live:send-reminders';

    protected $description = 'Email reminders for sessions about to start';

    public function handle(Send $send): int
    {
        $this->info('Sent '.$send().' reminder(s).');

        return self::SUCCESS;
    }
}
