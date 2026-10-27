<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MinisterVerificationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public string $firstName, public bool $approved, public ?string $note) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->approved ? 'You’re verified as a minister' : 'About your minister registration');
    }

    public function content(): Content
    {
        return new Content(view: 'mail.minister-verification');
    }
}
