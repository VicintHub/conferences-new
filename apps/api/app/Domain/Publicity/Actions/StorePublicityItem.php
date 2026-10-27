<?php

namespace App\Domain\Publicity\Actions;

use App\Domain\Publicity\Models\PublicityItem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Turns an uploaded file into a publicity item. For images it renders the sizes the committee ticked (square
 * 1080, status 1080×1920, print A4 at 300 dpi), cropped to fill. Videos, PDFs and logos are offered as uploaded.
 */
class StorePublicityItem
{
    public const SIZES = [
        'square' => ['label' => 'Square', 'dims' => '1080×1080', 'w' => 1080, 'h' => 1080],
        'status' => ['label' => 'Status', 'dims' => '1080×1920', 'w' => 1080, 'h' => 1920],
        'print' => ['label' => 'Print', 'dims' => 'A4', 'w' => 2480, 'h' => 3508],
    ];

    /**
     * @param  array{title: string, type: string, caption: string, sizes?: list<string>}  $data
     * @param  string  $when  'now' | 'schedule' | 'draft'
     */
    public function __invoke(array $data, UploadedFile $file, string $when, ?Carbon $publishAt): PublicityItem
    {
        $slug = $this->slug($data['title']);
        $dir = "publicity/{$slug}";
        $mime = (string) $file->getMimeType();
        $original = $file->storeAs($dir, 'original.'.($file->guessExtension() ?: 'bin'), 'public');
        $url = fn (string $path) => Storage::disk('public')->url($path);

        $isImage = str_starts_with($mime, 'image/') && in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true);
        $isVideo = str_starts_with($mime, 'video/');
        $wanted = array_values(array_intersect($data['sizes'] ?? [], array_keys(self::SIZES)));

        $sizes = [];
        $preview = null;
        if ($isImage) {
            foreach ($wanted ?: ['square'] as $key) {
                $spec = self::SIZES[$key];
                $path = "{$dir}/{$key}.jpg";
                if ($this->render($file->getRealPath(), $mime, $spec['w'], $spec['h'], Storage::disk('public')->path($path), $dir)) {
                    $sizes[] = ['key' => $key, 'label' => $spec['label'], 'dims' => $spec['dims'], 'url' => $url($path)];
                    $preview ??= $url($path);
                }
            }
        }
        if ($sizes === []) {
            $sizes[] = ['key' => 'original', 'label' => $isVideo ? 'Video' : 'File', 'dims' => $isVideo ? 'MP4' : strtoupper($file->guessExtension() ?: 'file'), 'url' => $url($original)];
            $preview ??= $isImage ? $url($original) : null;
        }

        return PublicityItem::create([
            'slug' => $slug,
            'title' => $data['title'],
            'type' => $data['type'],
            'caption' => $data['caption'],
            'meta' => collect($sizes)->pluck('label')->implode(' · '),
            'ratio' => $isVideo ? '16/9' : (($wanted[0] ?? 'square') === 'status' ? '9/16' : '1/1'),
            'preview' => $preview,
            'is_video' => $isVideo,
            'sizes' => $sizes,
            'published_at' => match ($when) {
                'now' => now(),
                'schedule' => $publishAt,
                default => null,
            },
        ]);
    }

    private function slug(string $title): string
    {
        $base = Str::slug($title) ?: 'item';
        $slug = $base;
        for ($i = 2; PublicityItem::where('slug', $slug)->exists(); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }

    /** Fill-and-crop to the target size and save as JPEG. Returns false if the image can't be read. */
    private function render(string $source, string $mime, int $w, int $h, string $target, string $dir): bool
    {
        $src = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($source),
            'image/png' => @imagecreatefrompng($source),
            'image/webp' => @imagecreatefromwebp($source),
            default => false,
        };
        if (! $src) {
            return false;
        }

        [$sw, $sh] = [imagesx($src), imagesy($src)];
        $scale = max($w / $sw, $h / $sh);
        [$cw, $ch] = [(int) round($w / $scale), (int) round($h / $scale)];
        $out = imagecreatetruecolor($w, $h);
        imagefill($out, 0, 0, imagecolorallocate($out, 255, 255, 255));
        imagecopyresampled($out, $src, 0, 0, (int) (($sw - $cw) / 2), (int) (($sh - $ch) / 2), $w, $h, $cw, $ch);

        Storage::disk('public')->makeDirectory($dir);
        $ok = imagejpeg($out, $target, 88);
        imagedestroy($src);
        imagedestroy($out);

        return $ok;
    }
}
