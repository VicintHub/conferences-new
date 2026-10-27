<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Testimonies\Models\SessionFeedback;
use App\Domain\Testimonies\Models\Testimony;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class TestimonyModerationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $status = $request->validate(['status' => ['nullable', Rule::in(['pending', 'approved', 'rejected'])]])['status'] ?? 'pending';
        $url = fn (?string $p) => $p ? (str_starts_with($p, '/') || str_starts_with($p, 'http') ? $p : Storage::disk('public')->url($p)) : null;

        $items = Testimony::where('status', $status)->orderByRaw($status === 'pending' ? 'id asc' : 'id desc')->limit(60)->get()->map(fn (Testimony $t) => [
            'id' => $t->id,
            'type' => $t->type,
            'body' => $t->body,
            // Moderators see who really wrote it, even when the author asked to be anonymous in public.
            'author_name' => $t->author_name,
            'display_name' => $t->display_name,
            'label' => $t->label,
            'tags' => $t->tags,
            'tag' => $t->tags[0] ?? null,
            'media_url' => $url($t->media_path),
            'duration_seconds' => $t->duration_seconds,
            'status' => $t->status,
            'featured' => $t->featured,
            'created_at' => $t->created_at->toIso8601String(),
        ])->values();

        return response()->json(['data' => $items, 'meta' => [
            'counts' => Testimony::selectRaw('status, count(*) as n')->groupBy('status')->pluck('n', 'status'),
            'average_rating' => round((float) SessionFeedback::avg('rating'), 1),
            'responses' => SessionFeedback::count(),
        ]]);
    }

    /** publish | hide | feature | unfeature */
    public function update(Request $request, int $testimony): JsonResponse
    {
        $action = $request->validate(['action' => ['required', Rule::in(['publish', 'hide', 'feature', 'unfeature'])]])['action'];
        $t = Testimony::findOrFail($testimony);

        match ($action) {
            'publish' => $t->forceFill(['status' => 'approved', 'published_at' => $t->published_at ?? now()])->save(),
            'hide' => $t->forceFill(['status' => 'rejected', 'featured' => false])->save(),
            'feature' => abort_unless($t->status === 'approved', 422, 'Publish it before featuring it.') ?: $t->forceFill(['featured' => true])->save(),
            'unfeature' => $t->forceFill(['featured' => false])->save(),
        };

        return response()->json(['data' => ['id' => $t->id, 'status' => $t->status, 'featured' => $t->featured]]);
    }
}
