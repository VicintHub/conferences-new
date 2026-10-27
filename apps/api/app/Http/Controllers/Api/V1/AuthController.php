<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Registration\Actions\CompleteSignIn;
use App\Domain\Registration\Actions\IssueLoginCode;
use App\Domain\Registration\Actions\VerifyLoginCode;
use App\Domain\Registration\Models\Registration;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\EmailRequest;
use App\Http\Requests\Api\V1\VerifyCodeRequest;
use App\Http\Requests\Api\V1\VerifyLinkRequest;
use App\Http\Resources\RegistrationResource;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    /** Sign-in and "resend": always 202, never reveals whether the email is registered. */
    public function otp(EmailRequest $request, IssueLoginCode $issue): JsonResponse
    {
        $issue($request->validated('email'));

        return response()->json(['resend_after' => IssueLoginCode::RESEND_AFTER_SECONDS], 202);
    }

    public function verify(VerifyCodeRequest $request, VerifyLoginCode $verify, CompleteSignIn $complete): JsonResponse
    {
        return $this->respond($complete($verify->withCode($request->validated('email'), $request->validated('code'))));
    }

    public function verifyLink(VerifyLinkRequest $request, VerifyLoginCode $verify, CompleteSignIn $complete): JsonResponse
    {
        return $this->respond($complete($verify->withLink($request->validated('email'), $request->validated('token'))));
    }

    /** @param  array{registration: Registration, token: string, downgraded: bool, existing: bool}  $result */
    private function respond(array $result): JsonResponse
    {
        return (new RegistrationResource($result['registration']))
            ->additional(['meta' => ['token' => $result['token'], 'downgraded_to_online' => $result['downgraded'], 'existing_account' => $result['existing']]])
            ->response();
    }
}
