<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Applications\Actions\AttachDocuments;
use App\Domain\Applications\Actions\SubmitApplication;
use App\Domain\Applications\Enums\ApplicationRole;
use App\Domain\Applications\Models\Application;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreApplicationRequest;
use App\Http\Requests\Api\V1\UploadApplicationDocumentsRequest;
use App\Http\Resources\ApplicationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ApplicationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $apps = Application::with('documents')->where('attendee_id', $request->user()->id)->latest('id')->get();

        return ApplicationResource::collection($apps)->additional(['meta' => [
            'roles' => collect(ApplicationRole::cases())->map(fn ($r) => ['key' => $r->value, 'label' => $r->label(), 'blurb' => $r->blurb()])->values(),
        ]]);
    }

    public function store(StoreApplicationRequest $request, SubmitApplication $submit): JsonResponse
    {
        $application = $submit(
            $request->user(),
            ApplicationRole::from($request->validated('role')),
            $request->payload(),
            $request->file('documents', []),
        );

        return (new ApplicationResource($application->load('documents')))->response()->setStatusCode(201);
    }

    /** "Upload now": the applicant sends what the committee asked for. */
    public function documents(UploadApplicationDocumentsRequest $request, int $application, AttachDocuments $attach): ApplicationResource
    {
        $application = Application::where('attendee_id', $request->user()->id)->findOrFail($application);
        abort_if($application->status->isFinal(), 422, 'This application has already been decided.');
        $attach($application, $request->file('documents'));

        return new ApplicationResource($application->load('documents'));
    }
}
