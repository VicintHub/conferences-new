<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class ImportTeamMembersRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $rows = collect($this->input('members', []))
            ->map(fn ($row) => is_array($row) ? [...$row, 'email' => strtolower(trim((string) ($row['email'] ?? '')))] : $row)
            ->all();
        $this->merge(['members' => $rows]);
    }

    public function rules(): array
    {
        $rules = ['members' => ['required', 'array', 'min:1', 'max:100']];
        foreach (AddTeamMemberRequest::memberRules() as $field => $rule) {
            $rules["members.*.{$field}"] = $rule;
        }

        return $rules;
    }
}
