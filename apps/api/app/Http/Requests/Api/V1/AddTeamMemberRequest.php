<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Registration\Enums\AttendanceMode;
use App\Domain\Registration\Enums\RegistrationCategory;
use App\Domain\Teams\Enums\MemberRole;
use App\Domain\Teams\Enums\TeamKind;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** One person to add, either to a church team or (as spouse / aide) to a minister's team. */
class AddTeamMemberRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['email' => strtolower(trim((string) $this->input('email')))]);
    }

    public static function memberRules(): array
    {
        return [
            'full_name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:190'],
            'phone' => ['nullable', 'string', 'regex:/^\+[1-9]\d{7,14}$/'],
            'category' => ['sometimes', Rule::enum(RegistrationCategory::class)],
            'mode' => ['required', Rule::enum(AttendanceMode::class)],
        ];
    }

    public function rules(): array
    {
        if ($this->route('kind') === TeamKind::Minister->value) {
            $role = $this->input('role');

            return [
                'role' => ['required', Rule::in([MemberRole::Spouse->value, MemberRole::Aide->value])],
                'title' => [$role === MemberRole::Aide->value ? 'required' : 'nullable', 'string', 'max:80'],
            ] + self::memberRules();
        }

        return self::memberRules();
    }
}
