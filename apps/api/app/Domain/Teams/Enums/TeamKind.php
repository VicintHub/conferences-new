<?php

namespace App\Domain\Teams\Enums;

enum TeamKind: string
{
    case Church = 'church';
    case Minister = 'minister';

    public function max(): int
    {
        return match ($this) {
            self::Church => (int) config('conference.team_max'),
            self::Minister => 2 + (int) config('conference.minister_aides_max'),
        };
    }
}
