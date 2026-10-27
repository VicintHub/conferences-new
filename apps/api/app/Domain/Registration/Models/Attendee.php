<?php

namespace App\Domain\Registration\Models;

use App\Domain\Registration\Enums\AgeBand;
use App\Domain\Teams\Models\TeamMember;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Attendee extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'age_band' => AgeBand::class,
            'email_verified_at' => 'datetime',
        ];
    }

    public function teamMembership(): HasOne
    {
        return $this->hasOne(TeamMember::class);
    }

    public function registration(): HasOne
    {
        return $this->hasOne(Registration::class);
    }
}
