<?php

namespace App\Domain\Store\Payments;

final class VerifiedPayment
{
    /** @param  'success'|'failed'|'pending'  $status  abandoned/ongoing collapse into pending/failed by the gateway */
    public function __construct(
        public readonly string $status,
        public readonly int $amountKobo,
        public readonly ?string $channel = null,
        public readonly array $raw = [],
    ) {}

    public function succeeded(): bool
    {
        return $this->status === 'success';
    }
}
