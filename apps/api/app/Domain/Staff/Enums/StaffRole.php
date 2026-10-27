<?php

namespace App\Domain\Staff\Enums;

/** What each kind of staff member may open in the admin console. */
enum StaffRole: string
{
    case Admin = 'admin';
    case Registration = 'registration';
    case Content = 'content';
    case Moderator = 'moderator';
    case Desk = 'desk';
    case Supervisor = 'supervisor';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::Registration => 'Registration',
            self::Content => 'Content',
            self::Moderator => 'Moderator',
            self::Desk => 'Print desk & scanner',
            self::Supervisor => 'Supervisor',
        };
    }

    /** Console areas this role can use. Overview and the staff's own profile are open to everyone. */
    public function areas(): array
    {
        return match ($this) {
            self::Admin => ['registrants', 'approvals', 'teams', 'orders', 'broadcasts', 'testimonies', 'publicity', 'settings', 'staff', 'desk', 'scan', 'checkin', 'override'],
            self::Registration => ['registrants', 'approvals', 'teams', 'orders', 'desk', 'scan', 'checkin', 'override'],
            self::Content => ['broadcasts', 'testimonies', 'publicity', 'settings'],
            self::Moderator => ['testimonies'],
            // Staff on the door: print badges and scan. Only a supervisor may override a refusal.
            self::Desk => ['desk', 'scan'],
            self::Supervisor => ['registrants', 'orders', 'desk', 'scan', 'checkin', 'override'],
        };
    }

    public function can(string $area): bool
    {
        return in_array($area, $this->areas(), true);
    }
}
