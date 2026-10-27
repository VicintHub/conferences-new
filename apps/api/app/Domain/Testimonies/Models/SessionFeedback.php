<?php

namespace App\Domain\Testimonies\Models;

use Illuminate\Database\Eloquent\Model;

class SessionFeedback extends Model
{
    protected $table = 'session_feedback';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['highlights' => 'array'];
    }
}
