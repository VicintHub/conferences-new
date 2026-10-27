<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Live\Models\LiveState;
use App\Domain\Live\Models\Replay;
use App\Domain\Live\Models\SessionReminder;
use App\Domain\Programme\Models\ProgrammeSession;
use App\Http\Controllers\Controller;
use App\Http\Resources\ReplayResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LiveController extends Controller
{
    /** Viewers count as watching for this long after their last heartbeat. */
    private const WATCHING_SECONDS = 90;

    /** What the Live tab needs: the stream, how many are watching, replays, and the sessions this person asked to be reminded about. */
    public function show(Request $request): JsonResponse
    {
        $live = LiveState::current();

        return response()->json(['data' => [
            'is_live' => $live->is_live,
            'title' => $live->title,
            'poster' => $live->poster,
            'video' => $live->video(),
            'radio' => $live->radio_url ? ['url' => $live->radio_url] : null,
            'viewers' => $this->viewers(),
            'give_url' => config('conference.give_url'),
            'reminders' => SessionReminder::where('attendee_id', $request->user()->id)->pluck('session_id'),
            'replays' => ReplayResource::collection(Replay::where('active', true)->orderBy('sort')->orderByDesc('recorded_on')->get()),
        ]]);
    }

    /** Sent every 30s while the player plays. Cheap on purpose: one upsert. */
    public function heartbeat(Request $request): JsonResponse
    {
        DB::table('live_viewers')->upsert([['attendee_id' => $request->user()->id, 'seen_at' => now()]], ['attendee_id'], ['seen_at']);

        return response()->json(['data' => ['viewers' => $this->viewers()]]);
    }

    public function remind(Request $request, ProgrammeSession $session): JsonResponse
    {
        abort_if($session->ends_at->isPast(), 422, 'That session has already finished.');
        SessionReminder::firstOrCreate(['attendee_id' => $request->user()->id, 'session_id' => $session->id]);

        return response()->json(['data' => ['session_id' => $session->id, 'reminding' => true]], 201);
    }

    public function unremind(Request $request, ProgrammeSession $session): JsonResponse
    {
        SessionReminder::where('attendee_id', $request->user()->id)->where('session_id', $session->id)->delete();

        return response()->json(status: 204);
    }

    private function viewers(): int
    {
        return DB::table('live_viewers')->where('seen_at', '>', now()->subSeconds(self::WATCHING_SECONDS))->count();
    }
}
