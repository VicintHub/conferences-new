<?php

namespace App\Domain\Live\Models;

use Illuminate\Database\Eloquent\Model;

class LiveState extends Model
{
    protected $table = 'live_state';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['is_live' => 'boolean'];
    }

    /** The single row, created off-air on first use. */
    public static function current(): self
    {
        return static::query()->firstOrCreate([], ['is_live' => false]);
    }

    /**
     * How the player should load the video: HLS needs hls.js outside Safari, YouTube/Vimeo links become an
     * iframe, anything else is a plain video file. Only those two embed hosts are ever framed.
     *
     * @return array{kind: string, url: string}|null
     */
    public function video(): ?array
    {
        $url = trim((string) $this->video_url);
        if ($url === '') {
            return null;
        }

        if (preg_match('~^https?://(?:www\.)?(?:youtube\.com/(?:watch\?v=|live/|embed/)|youtu\.be/)([\w-]{11})~', $url, $m)) {
            return ['kind' => 'embed', 'url' => "https://www.youtube-nocookie.com/embed/{$m[1]}?autoplay=1&rel=0"];
        }
        if (preg_match('~^https?://(?:www\.)?vimeo\.com/(\d+)~', $url, $m)) {
            return ['kind' => 'embed', 'url' => "https://player.vimeo.com/video/{$m[1]}?autoplay=1"];
        }

        return ['kind' => str_contains(parse_url($url, PHP_URL_PATH) ?? '', '.m3u8') ? 'hls' : 'file', 'url' => $url];
    }
}
