<?php

namespace App\Domain\Store\Actions;

use App\Domain\Store\Enums\OrderStatus;
use App\Domain\Store\Models\Order;
use Illuminate\Support\Facades\DB;

/** Unpaid orders hold stock only for a while. Run every few minutes. */
class ExpireStaleOrders
{
    public function __construct(private ReserveStock $stock) {}

    public function __invoke(): int
    {
        $expired = 0;
        Order::where('status', OrderStatus::Pending->value)->where('expires_at', '<', now())->orderBy('id')->each(function (Order $order) use (&$expired) {
            DB::transaction(function () use ($order, &$expired) {
                $fresh = Order::whereKey($order->id)->lockForUpdate()->first();
                if ($fresh->status !== OrderStatus::Pending) {
                    return; // paid or failed while we were looking
                }
                $fresh->transitionTo(OrderStatus::Expired);
                $this->stock->release($fresh);
                $expired++;
            });
        });

        return $expired;
    }
}
