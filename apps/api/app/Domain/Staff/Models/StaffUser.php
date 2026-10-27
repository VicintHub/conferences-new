<?php

namespace App\Domain\Staff\Models;

use App\Domain\Staff\Enums\StaffRole;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class StaffUser extends Authenticatable
{
    use HasApiTokens;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['role' => StaffRole::class, 'active' => 'boolean'];
    }
}
