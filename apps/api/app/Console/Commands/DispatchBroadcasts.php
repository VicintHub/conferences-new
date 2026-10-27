<?php

namespace App\Console\Commands;

use App\Domain\Broadcasts\Actions\DispatchDueBroadcasts;
use Illuminate\Console\Command;

class DispatchBroadcasts extends Command
{
    protected $signature = 'broadcasts:dispatch';

    protected $description = 'Send broadcasts whose scheduled time has come';

    public function handle(DispatchDueBroadcasts $dispatch): int
    {
        $this->info('Sent '.$dispatch().' broadcast(s).');

        return self::SUCCESS;
    }
}
