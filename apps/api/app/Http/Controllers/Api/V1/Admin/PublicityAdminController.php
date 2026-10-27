<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Publicity\Actions\StorePublicityItem;
use App\Domain\Publicity\Models\PublicityItem;
use App\Http\Controllers\Api\V1\PublicityController;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StorePublicityItemRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class PublicityAdminController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => PublicityItem::orderByRaw('published_at is null desc')->orderByDesc('published_at')->orderByDesc('id')->get()->map(fn ($i) => $this->row($i))->values(),
            'meta' => [
                'downloads' => (int) PublicityItem::sum('downloads_count'),
                'shares' => (int) PublicityItem::sum('shares_count'),
                'types' => PublicityController::TYPES,
                'sizes' => collect(StorePublicityItem::SIZES)->map(fn ($s, $k) => ['key' => $k, 'label' => $s['label'], 'dims' => $s['dims']])->values(),
            ],
        ]);
    }

    public function store(StorePublicityItemRequest $request, StorePublicityItem $store): JsonResponse
    {
        $item = $store(
            $request->safe()->only(['title', 'type', 'caption', 'sizes']),
            $request->file('file'),
            $request->validated('publish'),
            $request->filled('publish_at') ? Carbon::parse($request->validated('publish_at')) : null,
        );

        return response()->json(['data' => $this->row($item)], 201);
    }

    /** Edit the words, or change when it is visible: publish now, schedule, or take it down. */
    public function update(Request $request, int $item): JsonResponse
    {
        $in = $request->validate([
            'title' => ['sometimes', 'string', 'min:2', 'max:120'],
            'caption' => ['sometimes', 'string', 'min:2', 'max:1000'],
            'publish' => ['sometimes', Rule::in(['now', 'schedule', 'draft'])],
            'publish_at' => ['required_if:publish,schedule', 'nullable', 'date', 'after:now'],
        ]);
        $i = PublicityItem::findOrFail($item);

        $i->fill(collect($in)->only(['title', 'caption'])->all());
        if (isset($in['publish'])) {
            $i->published_at = match ($in['publish']) {
                'now' => $i->published_at && $i->published_at->isPast() ? $i->published_at : now(),
                'schedule' => Carbon::parse($in['publish_at']),
                'draft' => null,
            };
        }
        $i->save();

        return response()->json(['data' => $this->row($i)]);
    }

    public function destroy(int $item): JsonResponse
    {
        $i = PublicityItem::findOrFail($item);
        // Files live under publicity/{slug}/ for uploads; the seeded items point at the web app and have none.
        if (Storage::disk('public')->exists("publicity/{$i->slug}")) {
            Storage::disk('public')->deleteDirectory("publicity/{$i->slug}");
        }
        $i->delete();

        return response()->json(status: 204);
    }

    private function row(PublicityItem $i): array
    {
        $status = ! $i->published_at ? 'draft' : ($i->published_at->isFuture() ? 'scheduled' : 'published');

        return [
            'id' => $i->id,
            'slug' => $i->slug,
            'title' => $i->title,
            'type' => $i->type,
            'meta' => $i->meta,
            'preview' => $i->preview,
            'caption' => $i->caption,
            'status' => $status,
            'published_at' => $i->published_at?->toIso8601String(),
            'downloads' => $i->downloads_count,
            'shares' => $i->shares_count,
        ];
    }
}
