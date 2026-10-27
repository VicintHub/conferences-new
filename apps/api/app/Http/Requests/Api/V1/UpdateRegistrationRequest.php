<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Registration\Enums\AttendanceMode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRegistrationRequest extends FormRequest
{
    public function rules(): array
    {
        return ['mode' => ['required', Rule::enum(AttendanceMode::class)]];
    }
}
