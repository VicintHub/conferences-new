<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SessionReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public string $firstName, public string $title, public string $startsAt, public string $link) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "{$this->title} starts at {$this->startsAt}");
    }

    public function content(): Content
    {
        return new Content(view: 'mail.session-reminder');
    }
}
