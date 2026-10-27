<?php

namespace App\Domain\Teams\Models;

use App\Domain\Registration\Models\Attendee;
use App\Domain\Teams\Enums\MemberRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeamMember extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['role' => MemberRole::class];
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function attendee(): BelongsTo
    {
        return $this->belongsTo(Attendee::class);
    }

    /** "Confirmed" once they have verified their email; "Invited" until then. */
    public function isConfirmed(): bool
    {
        return $this->attendee->registration?->status === 'confirmed';
    }
}
