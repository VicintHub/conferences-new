<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Broadcasts\Models\Broadcast;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBroadcastRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:2', 'max:120'],
            'body' => ['required', 'string', 'min:2', 'max:1000'],
            'channels' => ['required', 'array', 'min:1'],
            'channels.*' => ['string', Rule::in(array_keys(Broadcast::CHANNELS)), Rule::in(Broadcast::AVAILABLE)],
            'audience' => ['required', 'array', 'min:1'],
            'audience.*' => ['string', Rule::in(array_keys(Broadcast::AUDIENCES))],
            // Empty = send now.
            'scheduled_at' => ['nullable', 'date', 'after:now'],
        ];
    }

    public function messages(): array
    {
        return ['channels.*.in' => 'That channel isn’t connected yet. Only email can be sent for now.'];
    }
}
