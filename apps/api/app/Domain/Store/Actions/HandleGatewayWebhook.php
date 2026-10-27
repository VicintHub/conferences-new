<?php

namespace App\Domain\Store\Actions;

use App\Domain\Store\Models\Payment;
use App\Domain\Store\Payments\PaymentGateway;

class HandleGatewayWebhook
{
    public function __construct(private PaymentGateway $gateway, private ApplyPaymentResult $apply) {}

    /**
     * Returns false only when the signature is wrong. Unknown events and references are acknowledged (and ignored)
     * so the provider doesn't keep retrying them. The body is never trusted for the outcome: we ask the provider.
     */
    public function __invoke(string $rawBody, ?string $signature): bool
    {
        if (! $this->gateway->validSignature($rawBody, $signature)) {
            return false;
        }

        $event = json_decode($rawBody, true) ?: [];
        $reference = $event['data']['reference'] ?? null;
        if (! is_string($reference) || ! str_starts_with((string) ($event['event'] ?? ''), 'charge.')) {
            return true;
        }

        $payment = Payment::where('reference', $reference)->first();
        if ($payment) {
            ($this->apply)($payment, $this->gateway->verify($reference));
        }

        return true;
    }
}
