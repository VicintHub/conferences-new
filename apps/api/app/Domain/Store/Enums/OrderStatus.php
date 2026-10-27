<?php

namespace App\Domain\Store\Enums;

/**
 * pending → paid → collected | refunded
 * pending → failed | expired        (stock released)
 * expired | failed → paid | refund_due   (money arrived after the hold lapsed: re-reserve, else refund)
 */
enum OrderStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Collected = 'collected';
    case Refunded = 'refunded';
    case Failed = 'failed';
    case Expired = 'expired';
    case RefundDue = 'refund_due';

    /** @return list<self> */
    public function allowedNext(): array
    {
        return match ($this) {
            self::Pending => [self::Paid, self::Failed, self::Expired],
            self::Paid => [self::Collected, self::Refunded],
            self::Expired => [self::Paid, self::RefundDue],
            self::RefundDue => [self::Refunded],
            self::Failed => [self::Paid, self::RefundDue],
            self::Collected, self::Refunded => [],
        };
    }

    public function canBecome(self $next): bool
    {
        return in_array($next, $this->allowedNext(), true);
    }
}
