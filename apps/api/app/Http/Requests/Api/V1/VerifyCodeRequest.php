<?php

namespace App\Http\Requests\Api\V1;

class VerifyCodeRequest extends EmailRequest
{
    public function rules(): array
    {
        return parent::rules() + ['code' => ['required', 'digits:6']];
    }
}
