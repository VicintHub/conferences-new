<?php

namespace App\Domain\Applications\Actions;

use App\Domain\Applications\Enums\ApplicationRole;
use App\Domain\Applications\Enums\ApplicationStatus;
use App\Domain\Applications\Models\Application;
use App\Domain\Registration\Models\Attendee;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubmitApplication
{
    public function __construct(private AttachDocuments $attach) {}

    /**
     * @param  array<string, mixed>  $payload  already validated for the role
     * @param  list<UploadedFile>  $files
     */
    public function __invoke(Attendee $attendee, ApplicationRole $role, array $payload, array $files = []): Application
    {
        return DB::transaction(function () use ($attendee, $role, $payload, $files) {
            // Lock the attendee row so a double tap cannot create two applications for the same role.
            Attendee::whereKey($attendee->id)->lockForUpdate()->first();

            $open = Application::where('attendee_id', $attendee->id)->where('role', $role->value)
                ->where('status', '!=', ApplicationStatus::Declined->value)->exists();
            if ($open) {
                throw ValidationException::withMessages(['role' => "You already have a {$role->label()} application."]);
            }

            $application = Application::create([
                'attendee_id' => $attendee->id,
                'role' => $role,
                'payload' => $payload,
                'status' => ApplicationStatus::Submitted,
            ]);
            ($this->attach)($application, $files);

            return $application;
        });
    }
}
