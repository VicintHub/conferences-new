<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Publicity\Models\PublicityItem;
use App\Http\Controllers\Controller;
use App\Http\Resources\PublicityItemResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class PublicityController extends Controller
{
    public const TYPES = ['flyer' => 'Flyers', 'status' => 'Status', 'video' => 'Videos', 'design' => 'Designs', 'logo' => 'Logos'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $type = $request->query('type');
        $query = PublicityItem::published()->orderByDesc('published_at')->orderByDesc('id');
        if (is_string($type) && array_key_exists($type, self::TYPES)) {
            $query->where('type', $type);
        }

        $newCount = PublicityItem::published()->where('published_at', '>=', now()->subDays(PublicityItem::NEW_FOR_DAYS))->count();

        return PublicityItemResource::collection($query->get())->additional(['meta' => ['types' => self::TYPES, 'new_count' => $newCount]]);
    }

    public function show(string $slug): PublicityItemResource
    {
        return new PublicityItemResource(PublicityItem::published()->where('slug', $slug)->firstOrFail());
    }

    /** Counts downloads and shares for the admin dashboard. Anyone can post; it is only a counter. */
    public function track(Request $request, string $slug): JsonResponse
    {
        $event = $request->validate(['event' => ['required', Rule::in(['download', 'share'])]])['event'];
        $item = PublicityItem::published()->where('slug', $slug)->firstOrFail();
        $item->increment($event === 'download' ? 'downloads_count' : 'shares_count');

        return response()->json(status: 204);
    }
}
