<?php

namespace App\Domain\Registration\Models;

use App\Domain\Registration\Enums\AttendanceMode;
use App\Domain\Registration\Enums\RegistrationCategory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Registration extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'category' => RegistrationCategory::class,
            'mode' => AttendanceMode::class,
            'days' => 'array',
            'needs_accommodation' => 'boolean',
            'consented_at' => 'datetime',
            'minister_verified_at' => 'datetime',
            'badge_printed_at' => 'datetime',
        ];
    }

    public function attendee(): BelongsTo
    {
        return $this->belongsTo(Attendee::class);
    }
}
