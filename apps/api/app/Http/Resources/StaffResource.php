<?php

namespace App\Http\Resources;

use App\Domain\Staff\Models\StaffUser;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin StaffUser */
class StaffResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'role_label' => $this->role->label(),
            'title' => $this->title ?? $this->role->label(),
            'active' => $this->active,
            'areas' => $this->role->areas(),
        ];
    }
}
