<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class CreateTeamRequest extends FormRequest
{
    public function rules(): array
    {
        return ['name' => ['nullable', 'string', 'min:2', 'max:120']];
    }
}
