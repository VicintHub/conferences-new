<?php

namespace App\Http\Resources;

use App\Domain\Speakers\Models\Speaker;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Speaker */
class SpeakerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'slug' => $this->slug,
            'name' => $this->name,
            'role' => $this->role,
            'short_role' => $this->short_role,
            'group' => $this->group,
            'photo' => $this->photo,
            'photo_mobile' => $this->photo_mobile ?? $this->photo,
            'bio' => $this->bio,
        ];
    }
}
