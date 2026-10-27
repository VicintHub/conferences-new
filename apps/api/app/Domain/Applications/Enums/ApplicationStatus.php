<?php

namespace App\Domain\Applications\Enums;

enum ApplicationStatus: string
{
    case Submitted = 'submitted';
    case DocumentsChecked = 'documents_checked';
    case InReview = 'in_review';
    case Approved = 'approved';
    case Declined = 'declined';

    /** Position along the tracker; a decision is always last. */
    public function step(): int
    {
        return match ($this) {
            self::Submitted => 1,
            self::DocumentsChecked => 2,
            self::InReview => 3,
            self::Approved, self::Declined => 4,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::Submitted => 'Submitted',
            self::DocumentsChecked => 'Documents checked',
            self::InReview => 'Under review',
            self::Approved => 'Approved',
            self::Declined => 'Declined',
        };
    }

    public function isFinal(): bool
    {
        return $this === self::Approved || $this === self::Declined;
    }
}
