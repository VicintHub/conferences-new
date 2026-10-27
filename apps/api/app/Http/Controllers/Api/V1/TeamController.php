<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Registration\Enums\RegistrationCategory;
use App\Domain\Teams\Actions\CreateTeam;
use App\Domain\Teams\Actions\JoinTeam;
use App\Domain\Teams\Enums\MemberRole;
use App\Domain\Teams\Enums\TeamKind;
use App\Domain\Teams\Models\Team;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CreateTeamRequest;
use App\Http\Resources\TeamResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TeamController extends Controller
{
    /** The team of this kind the signed-in person leads or belongs to, plus what they are allowed to do next. */
    public function show(Request $request, string $kind): JsonResponse
    {
        $kind = TeamKind::from($kind);
        $attendee = $request->user();
        $team = Team::with(['members.attendee.registration', 'members.team'])
            ->where('kind', $kind->value)
            ->whereHas('members', fn ($q) => $q->where('attendee_id', $attendee->id))
            ->first();

        $reg = $attendee->registration;
        $isMinister = $reg->category === RegistrationCategory::Minister;

        return response()->json([
            'data' => $team ? new TeamResource($team) : null,
            'meta' => [
                'can_create' => $reg->status === 'confirmed'
                    && ! $attendee->teamMembership()->exists()
                    && ($kind === TeamKind::Church || ($isMinister && $reg->minister_verified_at)),
                'is_minister' => $isMinister,
                'minister_verified' => (bool) $reg->minister_verified_at,
                'default_name' => $kind === TeamKind::Church ? ($attendee->church ?: '') : $attendee->full_name,
            ],
        ]);
    }

    public function store(CreateTeamRequest $request, string $kind, CreateTeam $create): JsonResponse
    {
        $team = $create($request->user(), TeamKind::from($kind), $request->validated('name'));

        return (new TeamResource($team->load('members.attendee.registration', 'members.team')))->response()->setStatusCode(201);
    }

    /** Only the leader renames the team. The share code stays the same, so existing links keep working. */
    public function update(Request $request, string $kind): TeamResource
    {
        $data = $request->validate(['name' => ['required', 'string', 'min:2', 'max:120']]);
        $team = Team::where('kind', TeamKind::from($kind)->value)->where('leader_id', $request->user()->id)->firstOrFail();
        $team->update(['name' => trim($data['name'])]);

        return new TeamResource($team->load('members.attendee.registration', 'members.team'));
    }

    /** What the share link shows before someone joins: just enough to recognise the team. */
    public function preview(string $code): JsonResponse
    {
        $team = Team::with('leader')->where('code', strtoupper($code))->where('kind', TeamKind::Church->value)->firstOrFail();

        return response()->json(['data' => [
            'name' => $team->name,
            'code' => $team->code,
            'leader' => explode(' ', trim($team->leader->full_name))[0],
            'members' => $team->members()->count(),
        ]]);
    }

    public function join(Request $request, string $code, JoinTeam $join): TeamResource
    {
        $team = Team::where('code', strtoupper($code))->where('kind', TeamKind::Church->value)->firstOrFail();
        $join($request->user(), $team);

        return new TeamResource($team->load('members.attendee.registration', 'members.team'));
    }

    /** A member steps away from a church team. The leader cannot: they would orphan everyone else. */
    public function leave(Request $request): JsonResponse
    {
        $membership = $request->user()->teamMembership()->with('team')->first();
        abort_unless($membership && $membership->team->kind === TeamKind::Church, 404);

        if ($membership->role === MemberRole::Leader) {
            throw ValidationException::withMessages(['team' => 'Team leaders cannot leave. Ask the committee to move leadership.']);
        }
        $membership->delete();

        return response()->json(status: 204);
    }
}
