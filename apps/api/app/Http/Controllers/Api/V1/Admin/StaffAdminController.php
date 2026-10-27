<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Staff\Enums\StaffRole;
use App\Domain\Staff\Models\StaffUser;
use App\Http\Controllers\Controller;
use App\Http\Resources\StaffResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class StaffAdminController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return StaffResource::collection(StaffUser::orderBy('name')->get())
            ->additional(['meta' => ['roles' => collect(StaffRole::cases())->map(fn ($r) => ['key' => $r->value, 'label' => $r->label()])->values()]]);
    }

    public function store(Request $request): JsonResponse
    {
        $in = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:190', 'unique:staff_users,email'],
            'role' => ['required', Rule::enum(StaffRole::class)],
            'title' => ['nullable', 'string', 'max:80'],
        ]);

        return (new StaffResource(StaffUser::create(['email' => strtolower($in['email'])] + $in)))->response()->setStatusCode(201);
    }

    public function update(Request $request, int $staff): StaffResource
    {
        $in = $request->validate([
            'role' => ['sometimes', Rule::enum(StaffRole::class)],
            'title' => ['sometimes', 'nullable', 'string', 'max:80'],
            'active' => ['sometimes', 'boolean'],
        ]);
        $member = StaffUser::findOrFail($staff);

        // An admin can't lock themselves out or demote themselves, which would leave nobody able to undo it.
        if ($member->is($request->user('staff')) && (($in['active'] ?? true) === false || (isset($in['role']) && $in['role'] !== $member->role->value))) {
            abort(422, 'You can’t deactivate or change the role of your own account.');
        }

        $member->update($in);
        if (($in['active'] ?? true) === false) {
            $member->tokens()->delete(); // signed out everywhere, now
        }

        return new StaffResource($member);
    }
}
