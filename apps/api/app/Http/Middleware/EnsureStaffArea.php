<?php

namespace App\Http\Middleware;

use App\Domain\Staff\Models\StaffUser;
use Closure;
use Illuminate\Http\Request;

/** `staff:registrants` lets through active staff whose role includes that console area; `staff` alone just needs an active account. */
class EnsureStaffArea
{
    public function handle(Request $request, Closure $next, ?string $area = null)
    {
        $staff = $request->user('staff');
        abort_unless($staff instanceof StaffUser && $staff->active, 401, 'Unauthenticated.');
        abort_if($area !== null && ! $staff->role->can($area), 403, 'Your role can’t open this part of the console.');

        return $next($request);
    }
}
