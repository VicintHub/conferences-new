<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Store\Actions\CreateOrder;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CheckoutRequest;
use App\Http\Resources\OrderResource;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class CheckoutController extends Controller
{
    /** Creates the order, holds the stock, and returns where to send the customer to pay. */
    public function __invoke(CheckoutRequest $request, CreateOrder $create): JsonResponse
    {
        try {
            ['order' => $order, 'payment' => $payment] = $create($request->validated(), $request->user('sanctum'));
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage(), 'code' => 'payment_unavailable'], 502);
        }

        return response()->json([
            'data' => (new OrderResource($order->load(['items', 'payments'])))->resolve(),
            'meta' => ['payment_url' => $payment->authorization_url, 'access_token' => $order->access_token],
        ], 201);
    }
}
