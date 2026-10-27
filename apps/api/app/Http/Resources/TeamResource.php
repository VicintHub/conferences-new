<?php

namespace App\Http\Resources;

use App\Domain\Registration\Enums\AttendanceMode;
use App\Domain\Teams\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Team */
class TeamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $members = $this->members;
        $confirmed = $members->filter(fn ($m) => $m->isConfirmed());

        return [
            'id' => $this->id,
            'name' => $this->name,
            'kind' => $this->kind,
            'code' => $this->code,
            'share_url' => rtrim((string) config('app.frontend_url'), '/').'/app/team?join='.$this->code,
            'is_leader' => $request->user()?->id === $this->leader_id,
            'members' => TeamMemberResource::collection($members),
            'stats' => [
                'members' => $members->count(),
                'confirmed' => $confirmed->count(),
                'invited' => $members->count() - $confirmed->count(),
                'onsite' => $members->filter(fn ($m) => $m->attendee->registration?->mode === AttendanceMode::Onsite)->count(),
                'badges_collected' => $members->filter(fn ($m) => $m->attendee->registration?->badge_printed_at)->count(),
            ],
            'limits' => [
                'members' => $this->kind->max(),
                'aides' => (int) config('conference.minister_aides_max'),
            ],
        ];
    }
}
