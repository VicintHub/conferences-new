<?php

namespace App\Domain\Applications\Actions;

use App\Domain\Applications\Enums\ApplicationStatus;
use App\Domain\Applications\Models\Application;
use App\Mail\ApplicationDecisionMail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use LogicException;

/**
 * Moves an application forward along the tracker (used by the admin console, build step 9).
 * Steps only ever go forward and a decision is final.
 */
class AdvanceApplication
{
    public function __invoke(Application $application, ApplicationStatus $to, ?string $note = null, ?string $requestedInfo = null): Application
    {
        $application = DB::transaction(function () use ($application, $to, $note, $requestedInfo) {
            $fresh = Application::whereKey($application->id)->lockForUpdate()->firstOrFail();

            if ($fresh->status->isFinal()) {
                throw new LogicException('This application has already been decided.');
            }
            if ($to->step() <= $fresh->status->step()) {
                throw new LogicException("Cannot move an application from {$fresh->status->value} back to {$to->value}.");
            }

            $at = now();
            $fresh->status = $to;
            match ($to) {
                ApplicationStatus::DocumentsChecked => $fresh->documents_checked_at = $at,
                ApplicationStatus::InReview => $fresh->review_started_at = $at,
                ApplicationStatus::Approved, ApplicationStatus::Declined => $fresh->decided_at = $at,
                default => null,
            };
            if ($to->isFinal()) {
                $fresh->decision_note = $note;
                $fresh->requested_info = null;
            } elseif ($requestedInfo !== null) {
                $fresh->requested_info = $requestedInfo;
            }
            $fresh->save();

            return $fresh;
        });

        if ($to->isFinal()) {
            $application->loadMissing('attendee');
            Mail::to($application->attendee->email)->queue(new ApplicationDecisionMail(
                firstName: explode(' ', trim($application->attendee->full_name))[0],
                heading: $application->role->heading(),
                approved: $to === ApplicationStatus::Approved,
                note: $note,
            ));
        }

        return $application;
    }

    /** The committee asks the applicant for something, e.g. a missing document. Shown on their status page. */
    public function requestInfo(Application $application, string $what): Application
    {
        $application->forceFill(['requested_info' => $what])->save();

        return $application;
    }
}
