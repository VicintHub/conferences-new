<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Teams\Actions\AddTeamMember;
use App\Domain\Teams\Actions\ImportTeamMembers;
use App\Domain\Teams\Actions\RemoveTeamMember;
use App\Domain\Teams\Actions\ResendInvite;
use App\Domain\Teams\Enums\MemberRole;
use App\Domain\Teams\Enums\TeamKind;
use App\Domain\Teams\Models\Team;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\AddTeamMemberRequest;
use App\Http\Requests\Api\V1\ImportTeamMembersRequest;
use App\Http\Resources\TeamMemberResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamMemberController extends Controller
{
    /** Only a team's leader manages its people. */
    private function ledTeam(Request $request, string $kind): Team
    {
        return Team::where('kind', TeamKind::from($kind)->value)->where('leader_id', $request->user()->id)->firstOrFail();
    }

    public function store(AddTeamMemberRequest $request, string $kind, AddTeamMember $add): JsonResponse
    {
        $team = $this->ledTeam($request, $kind);
        $data = $request->validated();
        $role = $team->kind === TeamKind::Minister ? MemberRole::from($data['role']) : MemberRole::Member;

        $member = $add($team, $role, $data);

        return (new TeamMemberResource($member->load('team')))->response()->setStatusCode(201);
    }

    public function import(ImportTeamMembersRequest $request, ImportTeamMembers $import): JsonResponse
    {
        $team = $this->ledTeam($request, TeamKind::Church->value);

        return response()->json(['data' => $import($team, $request->validated('members'))]);
    }

    public function destroy(Request $request, string $kind, int $member, RemoveTeamMember $remove): JsonResponse
    {
        $remove($this->ledTeam($request, $kind)->members()->findOrFail($member));

        return response()->json(status: 204);
    }

    public function resend(Request $request, string $kind, int $member, ResendInvite $resend): JsonResponse
    {
        $resend($this->ledTeam($request, $kind)->members()->findOrFail($member));

        return response()->json(['message' => 'Invitation sent.']);
    }
}
