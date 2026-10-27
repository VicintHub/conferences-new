<?php

namespace App\Domain\Broadcasts\Models;

use App\Domain\Staff\Models\StaffUser;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Broadcast extends Model
{
    /** Channels the console offers, and which of them can actually deliver today. */
    public const CHANNELS = ['push' => 'Push', 'sms' => 'SMS', 'email' => 'Email', 'whatsapp' => 'WhatsApp'];

    public const AVAILABLE = ['email'];

    /** Who a broadcast can go to. They add up: choosing Onsite and IYLC reaches both groups. */
    public const AUDIENCES = ['onsite' => 'Onsite', 'online' => 'Online', 'iylc' => 'IYLC', 'ministers' => 'Ministers', 'team_leaders' => 'Team leaders', 'everyone' => 'Everyone'];

    protected $guarded = [];

    protected function casts(): array
    {
        return ['channels' => 'array', 'audience' => 'array', 'scheduled_at' => 'datetime', 'sent_at' => 'datetime'];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(StaffUser::class, 'created_by');
    }
}
