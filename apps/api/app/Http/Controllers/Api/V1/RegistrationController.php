<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Registration\Actions\IssueLoginCode;
use App\Domain\Registration\Actions\StartRegistration;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\RegisterRequest;
use Illuminate\Http\JsonResponse;

class RegistrationController extends Controller
{
    /** Always 202 with the same body, whether or not the email was already registered. */
    public function store(RegisterRequest $request, StartRegistration $start): JsonResponse
    {
        $start($request->validated());

        return response()->json(['resend_after' => IssueLoginCode::RESEND_AFTER_SECONDS], 202);
    }
}
