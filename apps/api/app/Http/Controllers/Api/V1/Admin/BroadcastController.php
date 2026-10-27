<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Broadcasts\Actions\ResolveAudience;
use App\Domain\Broadcasts\Actions\SendBroadcast;
use App\Domain\Broadcasts\Models\Broadcast;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreBroadcastRequest;
use App\Mail\BroadcastMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class BroadcastController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Broadcast::with('author')->latest('id')->limit(30)->get()->map(fn (Broadcast $b) => $this->row($b))->values(),
            'meta' => [
                'channels' => collect(Broadcast::CHANNELS)->map(fn ($label, $key) => ['key' => $key, 'label' => $label, 'available' => in_array($key, Broadcast::AVAILABLE, true)])->values(),
                'audiences' => collect(Broadcast::AUDIENCES)->map(fn ($label, $key) => ['key' => $key, 'label' => $label])->values(),
            ],
        ]);
    }

    /** How many people a choice of chips reaches, shown under the chips as the staff member picks. */
    public function preview(Request $request, ResolveAudience $audience): JsonResponse
    {
        $in = $request->validate(['audience' => ['present', 'array'], 'audience.*' => ['string', Rule::in(array_keys(Broadcast::AUDIENCES))]]);

        return response()->json(['data' => ['reach' => $audience($in['audience'])->count()]]);
    }

    /** Sends the message to the signed-in staff member only, to see how it looks before it goes out. */
    public function test(Request $request): JsonResponse
    {
        $in = $request->validate(['title' => ['required', 'string', 'max:120'], 'body' => ['required', 'string', 'max:1000']]);
        Mail::to($request->user('staff')->email)->queue(new BroadcastMail('[Test] '.$in['title'], $in['body']));

        return response()->json(['message' => 'Test sent to '.$request->user('staff')->email.'.']);
    }

    public function store(StoreBroadcastRequest $request, SendBroadcast $send): JsonResponse
    {
        $broadcast = Broadcast::create($request->validated() + ['created_by' => $request->user('staff')->id, 'status' => 'scheduled']);

        if (! $broadcast->scheduled_at) {
            $send($broadcast);
        }

        return response()->json(['data' => $this->row($broadcast->refresh()->load('author'))], 201);
    }

    public function cancel(int $broadcast): JsonResponse
    {
        $b = Broadcast::findOrFail($broadcast);
        abort_unless($b->status === 'scheduled', 422, 'Only a scheduled broadcast can be cancelled.');
        $b->update(['status' => 'cancelled']);

        return response()->json(['data' => $this->row($b->load('author'))]);
    }

    private function row(Broadcast $b): array
    {
        return [
            'id' => $b->id,
            'title' => $b->title,
            'body' => $b->body,
            'channels' => $b->channels,
            'audience' => $b->audience,
            'status' => $b->status,
            'scheduled_at' => $b->scheduled_at?->toIso8601String(),
            'sent_at' => $b->sent_at?->toIso8601String(),
            'recipients_count' => $b->recipients_count,
            'author' => $b->author?->name,
            'created_at' => $b->created_at->toIso8601String(),
        ];
    }
}
