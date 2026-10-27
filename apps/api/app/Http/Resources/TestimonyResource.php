<?php

namespace App\Http\Resources;

use App\Domain\Testimonies\Models\Testimony;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin Testimony */
class TestimonyResource extends JsonResource
{
    /** @param  array<int, true>  $amened  testimony ids the signed-in attendee has said Amen to */
    public function __construct($resource, private array $amened = [])
    {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        $url = fn (?string $path) => $path ? (str_starts_with($path, '/') || str_starts_with($path, 'http') ? $path : Storage::disk('public')->url($path)) : null;

        return [
            'id' => $this->id,
            'type' => $this->type,
            'body' => $this->body,
            'display_name' => $this->display_name,
            'label' => $this->label,
            'tags' => $this->tags,
            'tag' => $this->tags[0] ?? null,
            'amen_count' => $this->amen_count,
            'amened' => isset($this->amened[$this->id]),
            'featured' => $this->featured,
            'media_url' => $url($this->media_path),
            'poster_url' => $url($this->poster_path),
            'duration_seconds' => $this->duration_seconds,
        ];
    }
}
