<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Publicity\Actions\StorePublicityItem;
use App\Http\Controllers\Api\V1\PublicityController;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePublicityItemRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:2', 'max:120'],
            'type' => ['required', Rule::in(array_keys(PublicityController::TYPES))],
            'caption' => ['required', 'string', 'min:2', 'max:1000'],
            'sizes' => ['nullable', 'array'],
            'sizes.*' => [Rule::in(array_keys(StorePublicityItem::SIZES))],
            // up to 500 MB (the server's upload limits must allow it too)
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf,mp4', 'max:512000'],
            'publish' => ['required', Rule::in(['now', 'schedule', 'draft'])],
            'publish_at' => ['required_if:publish,schedule', 'nullable', 'date', 'after:now'],
        ];
    }
}
