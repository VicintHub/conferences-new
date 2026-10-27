<?php

namespace App\Domain\Store\Payments;

final class InitializedPayment
{
    public function __construct(public readonly string $authorizationUrl, public readonly ?string $accessCode = null) {}
}
