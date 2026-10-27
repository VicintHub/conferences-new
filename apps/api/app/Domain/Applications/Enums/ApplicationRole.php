<?php

namespace App\Domain\Applications\Enums;

enum ApplicationRole: string
{
    case Vip = 'vip';
    case Speaker = 'speaker';
    case Vendor = 'vendor';
    case Media = 'media';

    public function label(): string
    {
        return match ($this) {
            self::Vip => 'VIP',
            self::Speaker => 'Speaker',
            self::Vendor => 'Vendor',
            self::Media => 'Media',
        };
    }

    /** Title of the status page, e.g. "Media accreditation". */
    public function heading(): string
    {
        return match ($this) {
            self::Vip => 'VIP guest',
            self::Speaker => 'Speaker invitation',
            self::Vendor => 'Vendor stall',
            self::Media => 'Media accreditation',
        };
    }

    public function blurb(): string
    {
        return match ($this) {
            self::Vip => 'Dignitaries & guests of honour',
            self::Speaker => 'Invited to minister',
            self::Vendor => 'Sell at the venue',
            self::Media => 'Press & broadcast crews',
        };
    }
}
