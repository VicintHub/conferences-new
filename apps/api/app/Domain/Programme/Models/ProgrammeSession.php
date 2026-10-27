<?php

namespace App\Domain\Programme\Models;

use Illuminate\Database\Eloquent\Model;

class ProgrammeSession extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['day' => 'date:Y-m-d', 'starts_at' => 'datetime', 'ends_at' => 'datetime'];
    }
}
