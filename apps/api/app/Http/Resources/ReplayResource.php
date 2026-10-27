<?php

namespace App\Http\Resources;

use App\Domain\Live\Models\Replay;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Replay */
class ReplayResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $kind = null;
        if ($this->video_url) {
            $kind = str_contains((string) parse_url($this->video_url, PHP_URL_PATH), '.m3u8') ? 'hls' : 'file';
        }

        return [
            'id' => $this->id,
            'title' => $this->title,
            'recorded_on' => $this->recorded_on->toDateString(),
            'duration_seconds' => $this->duration_seconds,
            'thumbnail' => $this->thumbnail,
            'video' => $this->video_url ? ['kind' => $kind, 'url' => $this->video_url] : null,
        ];
    }
}
