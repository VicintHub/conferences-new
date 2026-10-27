<?php

namespace App\Domain\Travel\Models;

use Illuminate\Database\Eloquent\Model;

class Shuttle extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }
}
