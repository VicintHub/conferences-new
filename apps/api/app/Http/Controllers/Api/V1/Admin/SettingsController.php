<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Live\Models\LiveState;
use App\Domain\Live\Models\Replay;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    private const URL = ['nullable', 'url:http,https', 'max:500'];

    public function show(): JsonResponse
    {
        $live = LiveState::current();

        return response()->json(['data' => [
            'live' => $this->live($live) + ['video_kind' => $live->video()['kind'] ?? null],
            'replays' => Replay::orderBy('sort')->orderByDesc('recorded_on')->get()->map(fn ($r) => $this->replay($r))->values(),
        ]]);
    }

    public function updateLive(Request $request): JsonResponse
    {
        $in = $request->validate([
            'is_live' => ['required', 'boolean'],
            'title' => ['nullable', 'string', 'max:120'],
            'video_url' => self::URL,
            'radio_url' => self::URL,
            'poster' => ['nullable', 'string', 'max:500'],
        ]);
        abort_if($in['is_live'] && empty($in['video_url']) && empty($in['radio_url']), 422, 'Add a video or radio link before going live.');

        $live = LiveState::current();
        $live->update($in);

        return response()->json(['data' => $this->live($live) + ['video_kind' => $live->video()['kind'] ?? null]]);
    }

    public function storeReplay(Request $request): JsonResponse
    {
        $replay = Replay::create($this->replayRules($request) + ['sort' => (int) Replay::max('sort') + 1]);

        return response()->json(['data' => $this->replay($replay)], 201);
    }

    public function updateReplay(Request $request, int $replay): JsonResponse
    {
        $r = Replay::findOrFail($replay);
        $r->update($this->replayRules($request, partial: true));

        return response()->json(['data' => $this->replay($r)]);
    }

    public function destroyReplay(int $replay): JsonResponse
    {
        Replay::findOrFail($replay)->delete();

        return response()->json(status: 204);
    }

    private function replayRules(Request $request, bool $partial = false): array
    {
        $p = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$p, 'string', 'min:2', 'max:160'],
            'recorded_on' => [$p, 'date'],
            'duration_seconds' => [$p, 'integer', 'min:1', 'max:86400'],
            'thumbnail' => ['nullable', 'string', 'max:500'],
            'video_url' => self::URL,
            'active' => ['sometimes', 'boolean'],
        ]);
    }

    private function live(LiveState $l): array
    {
        return ['is_live' => $l->is_live, 'title' => $l->title, 'video_url' => $l->video_url, 'radio_url' => $l->radio_url, 'poster' => $l->poster];
    }

    private function replay(Replay $r): array
    {
        return ['id' => $r->id, 'title' => $r->title, 'recorded_on' => $r->recorded_on->toDateString(), 'duration_seconds' => $r->duration_seconds, 'thumbnail' => $r->thumbnail, 'video_url' => $r->video_url, 'active' => $r->active];
    }
}
