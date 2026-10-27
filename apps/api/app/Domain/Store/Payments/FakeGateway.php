<?php

namespace App\Domain\Store\Payments;

use App\Domain\Store\Models\Order;
use App\Domain\Store\Models\Payment;
use Illuminate\Support\Facades\Cache;

/**
 * Stand-in for Paystack in development, tests and demos. It speaks the same interface, sends customers to a mock
 * hosted-payment page in the web app, and settles through the same webhook code path as the real thing.
 */
class FakeGateway implements PaymentGateway
{
    public function __construct(private string $secret) {}

    public function name(): string
    {
        return 'fake';
    }

    public function initialize(Order $order, string $reference, string $callbackUrl): InitializedPayment
    {
        $base = rtrim((string) config('app.frontend_url'), '/');
        $query = http_build_query(['reference' => $reference, 'callback' => $callbackUrl]);

        return new InitializedPayment("{$base}/shop/pay/mock?{$query}", 'fake_access_'.$reference);
    }

    public function verify(string $reference): VerifiedPayment
    {
        $state = Cache::get($this->key($reference)) ?? [];
        $outcome = $state['outcome'] ?? null;
        $payment = Payment::where('reference', $reference)->first();
        // Normally the "customer" pays exactly what was asked; tests can override to simulate an under/over-payment.
        $amount = $state['amount'] ?? $payment?->amount_kobo ?? 0;

        return match ($outcome) {
            'success' => new VerifiedPayment('success', $amount, 'card', ['simulated' => true]),
            'failed', 'abandoned' => new VerifiedPayment('failed', $amount, 'card', ['simulated' => true, 'outcome' => $outcome]),
            default => new VerifiedPayment('pending', $amount),
        };
    }

    public function validSignature(string $payload, ?string $signature): bool
    {
        return $signature !== null && hash_equals(hash_hmac('sha512', $payload, $this->secret), $signature);
    }

    /** Test/mock-page helper: records what the "customer" did on the fake payment page. */
    public function simulate(string $reference, string $outcome, ?int $amountKobo = null): void
    {
        Cache::put($this->key($reference), ['outcome' => $outcome, 'amount' => $amountKobo], now()->addDay());
    }

    public function sign(string $payload): string
    {
        return hash_hmac('sha512', $payload, $this->secret);
    }

    private function key(string $reference): string
    {
        return "fake-paystack:{$reference}";
    }
}
