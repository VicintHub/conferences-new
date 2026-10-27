<?php

namespace App\Domain\Store\Actions;

use App\Domain\Registration\Models\Attendee;
use App\Domain\Store\Enums\OrderStatus;
use App\Domain\Store\Models\Order;
use App\Domain\Store\Models\OrderItem;
use App\Domain\Store\Models\Payment;
use App\Domain\Store\Models\ProductVariant;
use App\Domain\Store\Payments\PaymentGateway;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class CreateOrder
{
    public function __construct(private PaymentGateway $gateway, private ReserveStock $stock) {}

    /**
     * Prices the bag on the server (the client's prices are never used), reserves stock, and starts the payment.
     *
     * @param  array<string, mixed>  $data  validated checkout payload
     * @return array{order: Order, payment: Payment}
     */
    public function __invoke(array $data, ?Attendee $attendee): array
    {
        $order = DB::transaction(function () use ($data, $attendee) {
            $wanted = collect($data['items'])->groupBy('variant_id')->map(fn ($rows) => $rows->sum('qty'));
            $variants = ProductVariant::with('product')->whereIn('id', $wanted->keys())->lockForUpdate()->get()->keyBy('id');

            $errors = [];
            foreach ($data['items'] as $i => $line) {
                $variant = $variants[$line['variant_id']] ?? null;
                if (! $variant || ! $variant->product->active) {
                    $errors["items.{$i}.variant_id"] = 'This item is no longer available.';
                } elseif ($variant->stock < $wanted[$variant->id]) {
                    $errors["items.{$i}.qty"] = $variant->stock === 0 ? 'Sold out.' : "Only {$variant->stock} left.";
                }
            }
            if ($errors) {
                throw ValidationException::withMessages($errors);
            }

            $subtotal = 0;
            foreach ($wanted as $id => $qty) {
                $subtotal += $variants[$id]->product->price_kobo * $qty;
            }
            $fee = self::fee($subtotal);

            $order = Order::create([
                'code' => $this->uniqueCode(),
                'access_token' => Str::random(24),
                'attendee_id' => $attendee?->id,
                'customer_name' => $data['customer']['name'],
                'customer_phone' => $data['customer']['phone'] ?? null,
                'customer_email' => strtolower($data['customer']['email']),
                'status' => OrderStatus::Pending,
                'method' => $data['method'],
                'subtotal_kobo' => $subtotal,
                'fee_kobo' => $fee,
                'total_kobo' => $subtotal + $fee,
                'expires_at' => now()->addMinutes((int) config('shop.reservation_minutes')),
            ]);

            foreach ($wanted as $id => $qty) {
                $variant = $variants[$id];
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $variant->product_id,
                    'product_variant_id' => $variant->id,
                    'name' => $variant->product->name,
                    'variant_label' => $variant->label(),
                    'image' => $variant->product->images[0] ?? null,
                    'unit_price_kobo' => $variant->product->price_kobo,
                    'qty' => $qty,
                ]);
                $variant->decrement('stock', $qty);
            }

            return $order;
        });

        $reference = "{$order->code}-".strtoupper(Str::random(8));
        $callback = rtrim((string) config('app.frontend_url'), '/')."/shop/orders/{$order->code}?k={$order->access_token}";

        try {
            $init = $this->gateway->initialize($order, $reference, $callback);
        } catch (\Throwable $e) {
            // The customer never reached a payment page: give the stock back and report it.
            DB::transaction(function () use ($order) {
                $order->transitionTo(OrderStatus::Failed);
                $this->stock->release($order);
            });
            report($e);
            throw new RuntimeException('We could not start the payment. Please try again in a moment.', 0, $e);
        }

        $payment = $order->payments()->create([
            'provider' => $this->gateway->name(),
            'reference' => $reference,
            'amount_kobo' => $order->total_kobo,
            'authorization_url' => $init->authorizationUrl,
        ]);

        return ['order' => $order, 'payment' => $payment];
    }

    /** Processing fee passed to the customer, rounded down to whole naira (₦362 on ₦37,500 with the defaults). */
    public static function fee(int $subtotalKobo): int
    {
        $fee = (int) round($subtotalKobo * (float) config('shop.fee_percent') / 100) + (int) config('shop.fee_flat_kobo');

        return intdiv($fee, 100) * 100;
    }

    private function uniqueCode(): string
    {
        do {
            $code = 'MV-'.random_int(10000, 99999);
        } while (Order::where('code', $code)->exists());

        return $code;
    }
}
