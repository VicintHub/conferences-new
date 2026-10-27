<?php

namespace App\Domain\Live\Models;

use App\Domain\Programme\Models\ProgrammeSession;
use App\Domain\Registration\Models\Attendee;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionReminder extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['sent_at' => 'datetime'];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(ProgrammeSession::class, 'session_id');
    }

    public function attendee(): BelongsTo
    {
        return $this->belongsTo(Attendee::class);
    }
}
