<?php

namespace App\Domain\Store\Actions;

use App\Domain\Store\Models\Order;
use App\Domain\Store\Models\ProductVariant;

/** Stock is held (decremented) while an order is pending or paid, and handed back if it fails or lapses. */
class ReserveStock
{
    /** Takes stock for every line of an existing order. All or nothing. Run inside a transaction. */
    public function forOrder(Order $order): bool
    {
        $lines = $order->items()->get();
        $variants = ProductVariant::whereIn('id', $lines->pluck('product_variant_id'))->lockForUpdate()->get()->keyBy('id');

        foreach ($lines as $line) {
            if (($variants[$line->product_variant_id]->stock ?? 0) < $line->qty) {
                return false;
            }
        }
        foreach ($lines as $line) {
            $variants[$line->product_variant_id]->decrement('stock', $line->qty);
        }

        return true;
    }

    public function release(Order $order): void
    {
        foreach ($order->items()->get() as $line) {
            ProductVariant::whereKey($line->product_variant_id)->increment('stock', $line->qty);
        }
    }
}
