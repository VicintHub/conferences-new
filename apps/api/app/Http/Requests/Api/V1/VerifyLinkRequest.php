<?php

namespace App\Http\Requests\Api\V1;

class VerifyLinkRequest extends EmailRequest
{
    public function rules(): array
    {
        return parent::rules() + ['token' => ['required', 'string', 'size:48']];
    }
}
