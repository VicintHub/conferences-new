<?php

namespace App\Domain\Registration\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

class RegistrationException extends RuntimeException
{
    public function __construct(string $message, public readonly int $status, public readonly string $errorCode, public readonly array $extra = [])
    {
        parent::__construct($message);
    }

    public static function onsiteFull(): self
    {
        return new self('Onsite places are full.', 409, 'onsite_full');
    }

    public static function invalidCode(): self
    {
        return new self('That code or link is incorrect or has expired.', 422, 'invalid_otp');
    }

    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage(), 'code' => $this->errorCode, ...$this->extra], $this->status);
    }
}
