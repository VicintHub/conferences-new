<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Registration\Enums\AgeBand;
use App\Domain\Registration\Enums\AttendanceMode;
use App\Domain\Registration\Enums\RegistrationCategory;
use Illuminate\Validation\Rule;

class RegisterRequest extends EmailRequest
{
    public const DAYS = ['2027-01-19', '2027-01-20', '2027-01-21', '2027-01-22', '2027-01-23', '2027-01-24'];

    public function rules(): array
    {
        return parent::rules() + [
            'category' => ['required', Rule::enum(RegistrationCategory::class)],
            'full_name' => ['required', 'string', 'min:2', 'max:120'],
            'phone' => ['nullable', 'string', 'regex:/^\+[1-9]\d{7,14}$/'],
            'church' => ['nullable', 'string', 'max:160'],
            'location' => ['nullable', 'string', 'max:120'],
            'age_band' => ['required', Rule::enum(AgeBand::class)],
            'mode' => ['required', Rule::enum(AttendanceMode::class)],
            'days' => ['required', 'array', 'min:1'],
            'days.*' => ['string', Rule::in(self::DAYS)],
            'needs_accommodation' => ['boolean'],
            'consent' => ['accepted'],
        ];
    }
}
