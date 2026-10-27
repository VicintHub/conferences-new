<?php

namespace App\Domain\Live\Actions;

use App\Domain\Live\Models\SessionReminder;
use App\Mail\SessionReminderMail;
use Illuminate\Support\Facades\Mail;

/** Emails everyone who asked to be reminded, once, shortly before their session starts. Run every minute. */
class SendSessionReminders
{
    public const LEAD_MINUTES = 15;

    public function __invoke(): int
    {
        $sent = 0;

        SessionReminder::with(['session', 'attendee'])
            ->whereNull('sent_at')
            ->whereHas('session', fn ($q) => $q->where('starts_at', '>', now())->where('starts_at', '<=', now()->addMinutes(self::LEAD_MINUTES)))
            ->orderBy('id')
            ->each(function (SessionReminder $reminder) use (&$sent) {
                // Claim it first so an overlapping run cannot email the same person twice.
                if (SessionReminder::whereKey($reminder->id)->whereNull('sent_at')->update(['sent_at' => now()]) === 0) {
                    return;
                }
                Mail::to($reminder->attendee->email)->queue(new SessionReminderMail(
                    firstName: explode(' ', trim($reminder->attendee->full_name))[0],
                    title: $reminder->session->title,
                    startsAt: $reminder->session->starts_at->copy()->setTimezone('Africa/Lagos')->format('g:i A'),
                    link: rtrim((string) config('app.frontend_url'), '/').'/app/live',
                ));
                $sent++;
            });

        return $sent;
    }
}
