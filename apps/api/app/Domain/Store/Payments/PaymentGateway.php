<?php

namespace App\Domain\Store\Payments;

use App\Domain\Store\Models\Order;

interface PaymentGateway
{
    public function name(): string;

    /** Starts a payment and returns where to send the customer. */
    public function initialize(Order $order, string $reference, string $callbackUrl): InitializedPayment;

    /** Asks the provider what happened to a reference. Never trust a client or webhook body for this. */
    public function verify(string $reference): VerifiedPayment;

    /** HMAC check for webhook bodies. */
    public function validSignature(string $payload, ?string $signature): bool;
}
