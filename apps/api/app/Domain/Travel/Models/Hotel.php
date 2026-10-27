<?php

namespace App\Domain\Travel\Models;

use Illuminate\Database\Eloquent\Model;

class Hotel extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['amenities' => 'array', 'conference_rate' => 'boolean', 'active' => 'boolean', 'distance_km' => 'float', 'lat' => 'float', 'lng' => 'float'];
    }
}
