<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Teams\Models\Team;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $page = Team::with('leader')->withCount([
            'members',
            'members as confirmed_count' => fn ($q) => $q->whereHas('attendee.registration', fn ($r) => $r->where('status', 'confirmed')),
        ])
            ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w->where('name', 'like', '%'.addcslashes($search, '%_\\').'%')->orWhere('code', 'like', '%'.addcslashes(strtoupper($search), '%_\\').'%')))
            ->orderByDesc('id')->paginate(25);

        return response()->json([
            'data' => $page->getCollection()->map(fn (Team $t) => [
                'id' => $t->id, 'name' => $t->name, 'code' => $t->code, 'kind' => $t->kind->value,
                'leader' => $t->leader->full_name, 'leader_email' => $t->leader->email,
                'members' => $t->members_count, 'confirmed' => $t->confirmed_count,
            ])->values(),
            'meta' => ['page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }
}
