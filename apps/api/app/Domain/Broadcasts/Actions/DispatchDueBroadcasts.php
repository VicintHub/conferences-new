<?php

namespace App\Domain\Broadcasts\Actions;

use App\Domain\Broadcasts\Models\Broadcast;

class DispatchDueBroadcasts
{
    public function __construct(private SendBroadcast $send) {}

    public function __invoke(): int
    {
        $sent = 0;
        Broadcast::where('status', 'scheduled')->whereNotNull('scheduled_at')->where('scheduled_at', '<=', now())->orderBy('scheduled_at')->each(function (Broadcast $b) use (&$sent) {
            ($this->send)($b);
            $sent++;
        });

        return $sent;
    }
}
