<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Registration\Actions\ChangeAttendanceMode;
use App\Domain\Registration\Enums\AttendanceMode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\UpdateRegistrationRequest;
use App\Http\Resources\RegistrationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function show(Request $request): RegistrationResource
    {
        $attendee = $request->user();

        return new RegistrationResource($attendee->registration->setRelation('attendee', $attendee));
    }

    public function updateRegistration(UpdateRegistrationRequest $request, ChangeAttendanceMode $change): RegistrationResource
    {
        $attendee = $request->user();
        $registration = $change($attendee->registration, AttendanceMode::from($request->validated('mode')));

        return new RegistrationResource($registration->setRelation('attendee', $attendee));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(status: 204);
    }
}
