<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Admin\Queries\Badges;
use App\Http\Controllers\Controller;
use App\Http\Resources\StaffResource;
use Illuminate\Http\Request;

class MeController extends Controller
{
    /** Who is signed in, what they can open, and the counts shown on the sidebar. */
    public function __invoke(Request $request, Badges $badges): StaffResource
    {
        return (new StaffResource($request->user('staff')))->additional(['meta' => ['badges' => $badges()]]);
    }
}
