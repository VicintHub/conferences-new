<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class UploadApplicationDocumentsRequest extends FormRequest
{
    public function rules(): array
    {
        return ['documents' => ['required', 'array', 'min:1', 'max:6'], 'documents.*' => StoreApplicationRequest::FILE_RULES];
    }
}
