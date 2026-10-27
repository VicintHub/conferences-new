<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LoginCodeMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public string $firstName, public string $code, public string $link, public int $minutes) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Your Jan. Conf 2027 code: {$this->code}");
    }

    public function content(): Content
    {
        return new Content(view: 'mail.login-code');
    }
}
