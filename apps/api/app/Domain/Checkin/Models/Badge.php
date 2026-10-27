<?php

namespace App\Domain\Checkin\Models;

use Illuminate\Database\Eloquent\Model;

class Badge extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['reprint' => 'boolean', 'printed_at' => 'datetime'];
    }
}
