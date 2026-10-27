<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Testimonies\Actions\SubmitTestimony;
use App\Domain\Testimonies\Models\Testimony;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreTestimonyRequest;
use App\Http\Resources\TestimonyResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TestimonyController extends Controller
{
    /** Approved testimonies, newest first, optionally by tag. Cursor-paginated; signed-in callers also get their Amens. */
    public function index(Request $request): JsonResponse
    {
        $tag = $request->query('tag');
        // The featured testimony is returned separately (it opens the feed), so it isn't repeated in the list.
        $query = Testimony::approved()->where('featured', false)->orderByDesc('published_at')->orderByDesc('id');
        if (is_string($tag) && in_array($tag, config('testimonies.tags'), true)) {
            $query->whereJsonContains('tags', $tag);
        }

        $page = $query->cursorPaginate(12);
        $amened = $this->amenedBy($request, $page->getCollection()->pluck('id'));

        $featured = $request->query('cursor') ? null : Testimony::approved()->where('featured', true)->orderByDesc('published_at')->first();

        return response()->json([
            'data' => $page->getCollection()->map(fn ($t) => (new TestimonyResource($t, $amened))->resolve())->values(),
            'featured' => $featured ? (new TestimonyResource($featured, $this->amenedBy($request, collect([$featured->id]))))->resolve() : null,
            'meta' => ['next_cursor' => $page->nextCursor()?->encode(), 'tags' => config('testimonies.tags'), 'filters' => config('testimonies.filters')],
        ]);
    }

    /** Guests may submit too (the public wall has a form); everything waits for moderation. */
    public function store(StoreTestimonyRequest $request, SubmitTestimony $submit): JsonResponse
    {
        $testimony = $submit($request->validated(), $request->user('sanctum'), $request->file('media'));

        return response()->json(['data' => ['id' => $testimony->id, 'status' => $testimony->status]], 201);
    }

    /** Idempotent: saying Amen twice counts once. */
    public function amen(Request $request, Testimony $testimony): JsonResponse
    {
        abort_unless($testimony->status === 'approved', 404);

        DB::transaction(function () use ($request, $testimony) {
            $inserted = DB::table('testimony_amens')->insertOrIgnore(['testimony_id' => $testimony->id, 'attendee_id' => $request->user()->id, 'created_at' => now(), 'updated_at' => now()]);
            if ($inserted) {
                $testimony->increment('amen_count');
            }
        });

        return response()->json(['data' => ['amen_count' => $testimony->fresh()->amen_count, 'amened' => true]]);
    }

    public function unamen(Request $request, Testimony $testimony): JsonResponse
    {
        abort_unless($testimony->status === 'approved', 404);

        DB::transaction(function () use ($request, $testimony) {
            if (DB::table('testimony_amens')->where('testimony_id', $testimony->id)->where('attendee_id', $request->user()->id)->delete() > 0) {
                $testimony->decrement('amen_count');
            }
        });

        return response()->json(['data' => ['amen_count' => $testimony->fresh()->amen_count, 'amened' => false]]);
    }

    /** @return array<int, true> */
    private function amenedBy(Request $request, $ids): array
    {
        $attendee = $request->user('sanctum');
        if (! $attendee) {
            return [];
        }

        return DB::table('testimony_amens')->where('attendee_id', $attendee->id)->whereIn('testimony_id', $ids)->pluck('testimony_id')->mapWithKeys(fn ($id) => [$id => true])->all();
    }
}
