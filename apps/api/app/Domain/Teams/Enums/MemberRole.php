<?php

namespace App\Domain\Teams\Enums;

enum MemberRole: string
{
    case Leader = 'leader';
    case Member = 'member';
    case Spouse = 'spouse';
    case Aide = 'aide';

    public function label(): string
    {
        return match ($this) {
            self::Leader => 'Team leader',
            self::Member => 'Delegate',
            self::Spouse => 'Spouse',
            self::Aide => 'Aide',
        };
    }
}
