<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Store\Enums\OrderStatus;
use App\Domain\Store\Models\Order;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use LogicException;

class OrderAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $f = $request->validate(['status' => ['nullable', Rule::enum(OrderStatus::class)], 'search' => ['nullable', 'string', 'max:100']]);
        $search = trim($f['search'] ?? '');

        $page = Order::with('items')
            ->when($f['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when($search !== '', function ($q) use ($search) {
                $like = '%'.addcslashes($search, '%_\\').'%';
                $q->where(fn ($w) => $w->where('code', 'like', $like)->orWhere('customer_name', 'like', $like)->orWhere('customer_email', 'like', $like));
            })
            ->orderByDesc('id')->paginate(25);

        return response()->json([
            'data' => $page->getCollection()->map(fn (Order $o) => $this->row($o))->values(),
            'meta' => ['page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total(), 'statuses' => collect(OrderStatus::cases())->map(fn ($s) => $s->value)],
        ]);
    }

    /** Hand over the merchandise (paid → collected) or record that a refund went out (refund_due → refunded). */
    public function update(Request $request, string $code): JsonResponse
    {
        $to = OrderStatus::from($request->validate(['status' => ['required', Rule::in([OrderStatus::Collected->value, OrderStatus::Refunded->value])]])['status']);
        $order = Order::with('items')->where('code', $code)->firstOrFail();

        try {
            $order->transitionTo($to);
        } catch (LogicException $e) {
            abort(422, "That order is {$order->status->value}, so it can't be marked {$to->value}.");
        }
        if ($to === OrderStatus::Collected) {
            $order->forceFill(['collected_at' => now()])->save();
        }

        return response()->json(['data' => $this->row($order)]);
    }

    private function row(Order $o): array
    {
        return [
            'code' => $o->code,
            'status' => $o->status->value,
            'customer_name' => $o->customer_name,
            'customer_email' => $o->customer_email,
            'method' => $o->method,
            'total_kobo' => $o->total_kobo,
            'items' => $o->items->map(fn ($i) => ['name' => $i->name, 'variant_label' => $i->variant_label, 'qty' => $i->qty])->values(),
            'paid_at' => $o->paid_at?->toIso8601String(),
            'collected_at' => $o->collected_at?->toIso8601String(),
            'created_at' => $o->created_at->toIso8601String(),
        ];
    }
}
