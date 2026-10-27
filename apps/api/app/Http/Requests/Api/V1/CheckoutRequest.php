<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckoutRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1', 'max:20'],
            'items.*.variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.qty' => ['required', 'integer', 'between:1,'.config('shop.max_qty_per_line')],
            'customer.name' => ['required', 'string', 'min:2', 'max:120'],
            'customer.email' => ['required', 'email:rfc', 'max:190'],
            'customer.phone' => ['nullable', 'string', 'regex:/^\+?[0-9 ]{7,20}$/'],
            'method' => ['required', Rule::in(array_keys(config('shop.methods')))],
        ];
    }
}
