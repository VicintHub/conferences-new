<?php

namespace App\Http\Resources;

use App\Domain\Applications\Enums\ApplicationStatus;
use App\Domain\Applications\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Application */
class ApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'role' => $this->role,
            'role_label' => $this->role->label(),
            'heading' => $this->role->heading(),
            'summary' => $this->summary(),
            'status' => $this->status,
            'status_label' => $this->status->label(),
            'requested_info' => $this->requested_info,
            'decision_note' => $this->decision_note,
            'timeline' => $this->timeline(),
            'documents' => $this->documents->map(fn ($d) => ['id' => $d->id, 'name' => $d->original_name, 'size' => $d->size])->values(),
        ];
    }

    /** The four steps of the "tracked like a delivery" view. Each is done, current or upcoming. */
    private function timeline(): array
    {
        $step = $this->status->step();
        $approved = $this->status === ApplicationStatus::Approved;
        $declined = $this->status === ApplicationStatus::Declined;

        $state = fn (int $n) => $n < $step || ($n === $step && $this->status->isFinal()) ? 'done' : ($n === $step ? 'current' : 'upcoming');
        $at = fn ($t) => $t?->toIso8601String();

        return [
            ['key' => 'submitted', 'title' => 'Submitted', 'at' => $at($this->created_at), 'note' => null, 'state' => 'done'],
            ['key' => 'documents_checked', 'title' => 'Documents checked', 'at' => $at($this->documents_checked_at), 'note' => null, 'state' => $state(2)],
            [
                'key' => 'in_review', 'title' => 'Committee review', 'at' => $at($this->review_started_at),
                'note' => $this->requested_info ? 'Waiting on you' : null, 'state' => $state(3),
            ],
            [
                'key' => 'decision', 'title' => 'Decision by email', 'at' => $at($this->decided_at),
                'note' => $approved ? 'Approved' : ($declined ? 'Not approved' : 'Pass issued if approved'),
                'state' => $state(4),
            ],
        ];
    }
}
