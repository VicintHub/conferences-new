<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Store\Actions\HandleGatewayWebhook;
use App\Domain\Store\Payments\FakeGateway;
use App\Domain\Store\Payments\PaymentGateway;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentWebhookController extends Controller
{
    /** Paystack posts here. The signature is checked against the raw body before anything is read. */
    public function paystack(Request $request, HandleGatewayWebhook $handle): JsonResponse
    {
        $ok = $handle($request->getContent(), $request->header('x-paystack-signature'));

        return $ok ? response()->json(['received' => true]) : response()->json(['message' => 'Invalid signature'], 401);
    }

    /**
     * Development only: the mock payment page reports what the "customer" did, and we settle it through exactly the
     * same signed-webhook code path the real provider uses.
     */
    public function mock(Request $request, string $reference, PaymentGateway $gateway, HandleGatewayWebhook $handle): JsonResponse
    {
        abort_unless($gateway instanceof FakeGateway && ! app()->isProduction(), 404);
        $outcome = $request->validate(['outcome' => ['required', 'in:success,failed,abandoned']])['outcome'];

        $gateway->simulate($reference, $outcome);
        $body = json_encode(['event' => $outcome === 'success' ? 'charge.success' : 'charge.failed', 'data' => ['reference' => $reference]]);
        $handle($body, $gateway->sign($body));

        return response()->json(['data' => ['outcome' => $outcome]]);
    }
}
