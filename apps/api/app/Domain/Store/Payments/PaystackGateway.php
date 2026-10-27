<?php

namespace App\Domain\Store\Payments;

use App\Domain\Store\Models\Order;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PaystackGateway implements PaymentGateway
{
    public function __construct(private string $secretKey, private string $baseUrl) {}

    public function name(): string
    {
        return 'paystack';
    }

    public function initialize(Order $order, string $reference, string $callbackUrl): InitializedPayment
    {
        $response = Http::withToken($this->secretKey)->acceptJson()->post("{$this->baseUrl}/transaction/initialize", [
            'email' => $order->customer_email,
            'amount' => $order->total_kobo,
            'currency' => 'NGN',
            'reference' => $reference,
            'callback_url' => $callbackUrl,
            // Only offer the method the customer chose on our checkout page.
            'channels' => [$order->method],
            'metadata' => ['order_code' => $order->code, 'customer_name' => $order->customer_name],
        ]);

        if (! $response->successful() || ! $response->json('status')) {
            throw new RuntimeException('Paystack could not start the payment: '.($response->json('message') ?? $response->status()));
        }

        return new InitializedPayment($response->json('data.authorization_url'), $response->json('data.access_code'));
    }

    public function verify(string $reference): VerifiedPayment
    {
        $response = Http::withToken($this->secretKey)->acceptJson()->get("{$this->baseUrl}/transaction/verify/".rawurlencode($reference));

        if (! $response->successful()) {
            // A lookup problem must not fail the order: report "still pending" and let a retry or webhook settle it.
            return new VerifiedPayment('pending', 0, null, ['error' => $response->status()]);
        }

        $data = (array) $response->json('data');
        $status = match ($data['status'] ?? null) {
            'success' => 'success',
            'failed', 'abandoned', 'reversed' => 'failed',
            default => 'pending', // ongoing, pending, queued, processing
        };

        return new VerifiedPayment($status, (int) ($data['amount'] ?? 0), $data['channel'] ?? null, $data);
    }

    public function validSignature(string $payload, ?string $signature): bool
    {
        return $signature !== null && hash_equals(hash_hmac('sha512', $payload, $this->secretKey), $signature);
    }
}
