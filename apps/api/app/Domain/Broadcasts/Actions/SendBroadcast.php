<?php

namespace App\Domain\Broadcasts\Actions;

use App\Domain\Broadcasts\Models\Broadcast;
use App\Mail\BroadcastMail;
use Illuminate\Support\Facades\Mail;

/** Delivers a broadcast to everyone in its audience, once. Only email is connected so far. */
class SendBroadcast
{
    public function __construct(private ResolveAudience $audience) {}

    public function __invoke(Broadcast $broadcast): Broadcast
    {
        // Claim it first: a second worker (or a double click) finds nothing left to send.
        $claimed = Broadcast::whereKey($broadcast->id)->where('status', 'scheduled')->update(['status' => 'sending']);
        if ($claimed === 0) {
            return $broadcast->refresh();
        }

        $recipients = 0;
        if (in_array('email', $broadcast->channels, true)) {
            ($this->audience)($broadcast->audience)->orderBy('id')->select(['id', 'email'])->chunkById(200, function ($chunk) use ($broadcast, &$recipients) {
                foreach ($chunk as $attendee) {
                    Mail::to($attendee->email)->queue(new BroadcastMail($broadcast->title, $broadcast->body));
                    $recipients++;
                }
            });
        }

        $broadcast->forceFill(['status' => 'sent', 'sent_at' => now(), 'recipients_count' => $recipients])->save();

        return $broadcast;
    }
}
