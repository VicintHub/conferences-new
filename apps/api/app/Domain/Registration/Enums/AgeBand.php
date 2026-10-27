<?php

namespace App\Domain\Registration\Enums;

enum AgeBand: string
{
    case Teen = '16-17';
    case Adult = '18-45';
    case Senior = '46+';
}
