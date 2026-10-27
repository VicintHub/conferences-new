<?php

namespace App\Console\Commands;

use App\Domain\Staff\Enums\StaffRole;
use App\Domain\Staff\Models\StaffUser;
use Illuminate\Console\Command;

class CreateStaff extends Command
{
    protected $signature = 'staff:create {email} {name} {role=admin : admin, registration, content or moderator} {--title=}';

    protected $description = 'Create (or update) a staff member who can sign in to the admin console';

    public function handle(): int
    {
        $role = StaffRole::tryFrom($this->argument('role'));
        if (! $role) {
            $this->error('Role must be one of: '.implode(', ', array_map(fn ($r) => $r->value, StaffRole::cases())));

            return self::FAILURE;
        }

        $staff = StaffUser::updateOrCreate(
            ['email' => strtolower($this->argument('email'))],
            ['name' => $this->argument('name'), 'role' => $role, 'title' => $this->option('title'), 'active' => true],
        );
        $this->info("{$staff->name} ({$role->value}) can sign in at /admin/login.");

        return self::SUCCESS;
    }
}
