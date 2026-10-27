<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTestimonyRequest extends FormRequest
{
    public function rules(): array
    {
        $guest = $this->user('sanctum') === null;
        $max = (int) config('testimonies.max_body');
        $type = $this->input('type');

        return [
            'type' => ['required', Rule::in(['write', 'voice', 'video'])],
            'name' => [$guest ? 'required' : 'nullable', 'string', 'min:2', 'max:120'],
            'place' => ['nullable', 'string', 'max:120'],
            'body' => [$type === 'write' ? 'required' : 'nullable', 'string', 'min:10', "max:{$max}"],
            'tags' => ['nullable', 'array', 'max:'.config('testimonies.max_tags')],
            'tags.*' => ['string', Rule::in(config('testimonies.tags'))],
            'show_name' => ['nullable', 'boolean'],
            'media' => [
                in_array($type, ['voice', 'video'], true) ? 'required' : 'nullable',
                'file',
                'max:'.config('testimonies.max_media_kb'),
                $type === 'voice' ? 'mimetypes:audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/webm,audio/ogg,audio/wav,audio/x-wav,video/webm' : 'mimetypes:video/mp4,video/quicktime,video/webm,video/x-m4v',
            ],
        ];
    }
}
