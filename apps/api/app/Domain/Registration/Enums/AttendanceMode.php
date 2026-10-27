<?php

namespace App\Domain\Registration\Enums;

enum AttendanceMode: string
{
    case Onsite = 'onsite';
    case Online = 'online';
}
