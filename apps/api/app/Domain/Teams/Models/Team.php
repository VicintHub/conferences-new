<?php

namespace App\Domain\Teams\Models;

use App\Domain\Registration\Models\Attendee;
use App\Domain\Teams\Enums\TeamKind;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Team extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['kind' => TeamKind::class];
    }

    public function leader(): BelongsTo
    {
        return $this->belongsTo(Attendee::class, 'leader_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(TeamMember::class)->orderBy('id');
    }
}
