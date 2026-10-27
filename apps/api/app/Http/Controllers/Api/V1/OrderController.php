<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Store\Actions\ApplyPaymentResult;
use App\Domain\Store\Enums\OrderStatus;
use App\Domain\Store\Models\Order;
use App\Domain\Store\Payments\PaymentGateway;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    /** An order page is private: it needs the link's access key, or the signed-in owner. */
    private function find(Request $request, string $code): Order
    {
        $order = Order::with(['items', 'payments'])->where('code', $code)->firstOrFail();
        $key = (string) $request->query('k', $request->input('k', ''));
        $owner = $request->user('sanctum')?->id;

        abort_unless(($key !== '' && hash_equals($order->access_token, $key)) || ($owner && $owner === $order->attendee_id), 404);

        return $order;
    }

    public function show(Request $request, string $code): OrderResource
    {
        return new OrderResource($this->find($request, $code));
    }

    /**
     * Called when the customer returns from the payment page. Asks the provider rather than trusting the browser.
     * Safe to call repeatedly (the page polls while a payment settles).
     */
    public function verify(Request $request, string $code, PaymentGateway $gateway, ApplyPaymentResult $apply): OrderResource
    {
        $order = $this->find($request, $code);

        if ($order->status === OrderStatus::Pending || in_array($order->status, [OrderStatus::Expired, OrderStatus::Failed], true)) {
            $payment = $order->payments->sortByDesc('id')->first(fn ($p) => $p->status !== 'success');
            if ($payment) {
                $order = $apply($payment, $gateway->verify($payment->reference));
            }
        }

        return new OrderResource($order->load(['items', 'payments']));
    }

    /** "Add to my pass": links the order to the signed-in attendee so it shows up on their pass. */
    public function attach(Request $request, string $code): OrderResource
    {
        $order = $this->find($request, $code);
        abort_unless($request->user(), 401);
        $order->attendee_id ??= $request->user()->id;
        $order->save();

        return new OrderResource($order);
    }

    public function mine(Request $request): AnonymousResourceCollection
    {
        $orders = Order::with(['items', 'payments'])->where('attendee_id', $request->user()->id)
            ->whereIn('status', [OrderStatus::Paid->value, OrderStatus::Collected->value, OrderStatus::Pending->value])->latest()->get();

        return OrderResource::collection($orders);
    }
}
