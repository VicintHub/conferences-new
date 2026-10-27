<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Applications\Enums\ApplicationRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** The role decides which fields are asked, mirroring the forms on the apply screen. */
class StoreApplicationRequest extends FormRequest
{
    public const FILE_RULES = ['file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'];

    public function rules(): array
    {
        $role = ApplicationRole::tryFrom((string) $this->input('role'));

        return ['role' => ['required', Rule::enum(ApplicationRole::class)]]
            + ($role ? $this->roleRules($role) : [])
            + ['documents' => ['sometimes', 'array', 'max:6'], 'documents.*' => self::FILE_RULES];
    }

    /** @return array<string, list<mixed>> */
    private function roleRules(ApplicationRole $role): array
    {
        $common = [
            'contact_name' => ['required', 'string', 'min:2', 'max:120'],
            'phone' => ['required', 'string', 'regex:/^\+[1-9]\d{7,14}$/'],
        ];

        return $common + match ($role) {
            ApplicationRole::Vip => [
                'title' => ['required', 'string', 'max:120'],
                'organisation' => ['nullable', 'string', 'max:160'],
                'guests' => ['required', 'integer', 'min:0', 'max:10'],
                'notes' => ['nullable', 'string', 'max:1000'],
            ],
            ApplicationRole::Speaker => [
                'ministry' => ['required', 'string', 'max:160'],
                'topic' => ['required', 'string', 'max:160'],
                'bio' => ['required', 'string', 'max:1500'],
            ],
            ApplicationRole::Vendor => [
                'business_name' => ['required', 'string', 'max:160'],
                'category' => ['required', Rule::in(['food', 'books', 'apparel', 'other'])],
                'stall_size' => ['required', Rule::in(['s', 'm', 'l'])],
                'notes' => ['nullable', 'string', 'max:1000'],
            ],
            ApplicationRole::Media => [
                'organisation' => ['required', 'string', 'max:160'],
                'crew_size' => ['required', 'integer', 'min:1', 'max:20'],
                'coverage_plan' => ['required', 'string', 'max:500'],
            ],
        };
    }

    /** The validated answers for the role, minus the role itself and the files. */
    public function payload(): array
    {
        return collect($this->validated())->except(['role', 'documents'])->all();
    }
}
