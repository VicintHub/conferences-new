<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Registration\Actions\IssueLoginCode;
use App\Domain\Staff\Actions\IssueStaffCode;
use App\Domain\Staff\Actions\VerifyStaffCode;
use App\Domain\Staff\Models\StaffUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\EmailRequest;
use App\Http\Requests\Api\V1\VerifyCodeRequest;
use App\Http\Requests\Api\V1\VerifyLinkRequest;
use App\Http\Resources\StaffResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffAuthController extends Controller
{
    /** Always 202, so it never reveals who is on the staff list. */
    public function otp(EmailRequest $request, IssueStaffCode $issue): JsonResponse
    {
        $issue($request->validated('email'));

        return response()->json(['resend_after' => IssueLoginCode::RESEND_AFTER_SECONDS], 202);
    }

    public function verify(VerifyCodeRequest $request, VerifyStaffCode $verify): JsonResponse
    {
        return $this->respond($verify->withCode($request->validated('email'), $request->validated('code')));
    }

    public function verifyLink(VerifyLinkRequest $request, VerifyStaffCode $verify): JsonResponse
    {
        return $this->respond($verify->withLink($request->validated('email'), $request->validated('token')));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user('staff')->currentAccessToken()->delete();

        return response()->json(status: 204);
    }

    /** @param  array{staff: StaffUser, token: string}  $result */
    private function respond(array $result): JsonResponse
    {
        return (new StaffResource($result['staff']))->additional(['meta' => ['token' => $result['token']]])->response();
    }
}
