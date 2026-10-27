<?php

namespace App\Domain\Registration\Actions;

use App\Domain\Registration\Enums\RegistrationCategory;
use App\Domain\Registration\Models\Registration;

class GenerateClaimCode
{
    public function __invoke(RegistrationCategory $category): string
    {
        do {
            $code = sprintf('JC27-%s-%05d', $category->codeSegment(), random_int(0, 99999));
        } while (Registration::where('claim_code', $code)->exists());

        return $code;
    }
}
