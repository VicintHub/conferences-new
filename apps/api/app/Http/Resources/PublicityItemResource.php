<?php

namespace App\Http\Resources;

use App\Domain\Publicity\Models\PublicityItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin PublicityItem */
class PublicityItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'slug' => $this->slug,
            'title' => $this->title,
            'type' => $this->type,
            'meta' => $this->meta,
            'ratio' => $this->ratio,
            'preview' => $this->preview,
            'is_video' => $this->is_video,
            'caption' => $this->caption,
            'sizes' => $this->sizes,
            'new' => $this->isNew(),
            'published_at' => $this->published_at?->toIso8601String(),
        ];
    }
}
