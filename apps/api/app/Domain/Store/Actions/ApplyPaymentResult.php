<?php

namespace App\Domain\Store\Actions;

use App\Domain\Store\Enums\OrderStatus;
use App\Domain\Store\Models\Order;
use App\Domain\Store\Models\Payment;
use App\Domain\Store\Payments\VerifiedPayment;
use App\Mail\OrderReceiptMail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * The single place a provider outcome changes an order. The verify callback and the webhook both land here,
 * and it is safe to run any number of times for the same payment.
 */
class ApplyPaymentResult
{
    public function __construct(private ReserveStock $stock) {}

    public function __invoke(Payment $payment, VerifiedPayment $result): Order
    {
        $paidNow = false;

        $order = DB::transaction(function () use ($payment, $result, &$paidNow) {
            $payment = Payment::whereKey($payment->id)->lockForUpdate()->firstOrFail();
            $order = Order::whereKey($payment->order_id)->lockForUpdate()->firstOrFail();

            if ($payment->status === 'success' || $result->status === 'pending') {
                return $order; // already settled, or the provider isn't done yet
            }

            if ($result->succeeded()) {
                if ($result->amountKobo !== $payment->amount_kobo) {
                    // Never fulfil an underpayment (or a tampered one). Leave the order for a human.
                    Log::warning('Payment amount mismatch', ['order' => $order->code, 'expected' => $payment->amount_kobo, 'got' => $result->amountKobo]);
                    $payment->update(['status' => 'failed', 'raw' => $result->raw + ['mismatch' => true]]);

                    return $order;
                }

                $payment->update(['status' => 'success', 'channel' => $result->channel, 'raw' => $result->raw, 'paid_at' => now()]);

                if ($order->status === OrderStatus::Pending) {
                    $order->transitionTo(OrderStatus::Paid);
                } elseif (in_array($order->status, [OrderStatus::Expired, OrderStatus::Failed], true)) {
                    // Money arrived after the hold lapsed: take the stock again if it's still there, else flag a refund.
                    $order->transitionTo($this->stock->forOrder($order) ? OrderStatus::Paid : OrderStatus::RefundDue);
                }
                if ($order->status === OrderStatus::Paid) {
                    $order->forceFill(['paid_at' => now()])->save();
                    $paidNow = true;
                }

                return $order;
            }

            // failed / abandoned
            $payment->update(['status' => 'failed', 'raw' => $result->raw]);
            if ($order->status === OrderStatus::Pending) {
                $order->transitionTo(OrderStatus::Failed);
                $this->stock->release($order);
            }

            return $order;
        });

        if ($paidNow) {
            Mail::to($order->customer_email)->queue(new OrderReceiptMail($order->load('items')));
        }

        return $order->refresh();
    }
}
