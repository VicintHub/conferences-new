<?php

namespace App\Mail;

use App\Domain\Store\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderReceiptMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Your Jan. Conf order {$this->order->code} is confirmed");
    }

    public function content(): Content
    {
        return new Content(view: 'mail.order-receipt', with: [
            'link' => rtrim((string) config('app.frontend_url'), '/')."/shop/orders/{$this->order->code}?k={$this->order->access_token}",
        ]);
    }
}
