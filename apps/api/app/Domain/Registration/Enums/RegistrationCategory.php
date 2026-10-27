<?php

namespace App\Domain\Registration\Enums;

enum RegistrationCategory: string
{
    case Delegate = 'delegate';
    case International = 'international';
    case Minister = 'minister';

    /** Three-letter segment of the claim code, e.g. JC27-DLG-48213. */
    public function codeSegment(): string
    {
        return match ($this) {
            self::Delegate => 'DLG',
            self::International => 'INT',
            self::Minister => 'MIN',
        };
    }
}
