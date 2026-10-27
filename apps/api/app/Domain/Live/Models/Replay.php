<?php

namespace App\Domain\Live\Models;

use Illuminate\Database\Eloquent\Model;

class Replay extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['recorded_on' => 'date:Y-m-d', 'active' => 'boolean'];
    }
}
