<?php

namespace App\Http\Resources;

use App\Domain\Teams\Models\TeamMember;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TeamMember */
class TeamMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $viewer = $request->user();
        $isLeader = $viewer && $this->team->leader_id === $viewer->id;
        $reg = $this->attendee->registration;

        return [
            'id' => $this->id,
            'name' => $this->attendee->full_name,
            'role' => $this->role,
            'role_label' => $this->role->label(),
            'title' => $this->title,
            'category' => $reg?->category,
            'mode' => $reg?->mode,
            'status' => $this->isConfirmed() ? 'confirmed' : 'invited',
            'is_you' => $viewer?->id === $this->attendee_id,
            // Contact details are for the leader only; teammates see names and status.
            'email' => $this->when($isLeader, $this->attendee->email),
            'phone' => $this->when($isLeader, $this->attendee->phone),
            'badge_collected' => (bool) $reg?->badge_printed_at,
        ];
    }
}
