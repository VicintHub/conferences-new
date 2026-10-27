<?php

namespace App\Domain\Applications\Models;

use App\Domain\Applications\Enums\ApplicationRole;
use App\Domain\Applications\Enums\ApplicationStatus;
use App\Domain\Registration\Models\Attendee;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Application extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'role' => ApplicationRole::class,
            'status' => ApplicationStatus::class,
            'payload' => 'array',
            'documents_checked_at' => 'datetime',
            'review_started_at' => 'datetime',
            'decided_at' => 'datetime',
        ];
    }

    public function attendee(): BelongsTo
    {
        return $this->belongsTo(Attendee::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ApplicationDocument::class)->orderBy('id');
    }

    /** The one-line summary under the heading, e.g. "Faith Lens TV · 2 crew". */
    public function summary(): string
    {
        $p = $this->payload;

        return match ($this->role) {
            ApplicationRole::Media => trim(($p['organisation'] ?? '').' · '.($p['crew_size'] ?? 1).' crew', ' ·'),
            ApplicationRole::Vendor => trim(($p['business_name'] ?? '').' · Stall '.strtoupper($p['stall_size'] ?? ''), ' ·'),
            ApplicationRole::Speaker => (string) ($p['topic'] ?? ''),
            ApplicationRole::Vip => trim(($p['title'] ?? '').' · '.(1 + (int) ($p['guests'] ?? 0)).' attending', ' ·'),
        };
    }
}
