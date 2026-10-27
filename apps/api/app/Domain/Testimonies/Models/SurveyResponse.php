<?php

namespace App\Domain\Testimonies\Models;

use Illuminate\Database\Eloquent\Model;

class SurveyResponse extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['answers' => 'array'];
    }
}
