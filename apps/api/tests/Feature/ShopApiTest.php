<?php

namespace Tests\Feature;

use App\Domain\Registration\Models\Attendee;
use App\Domain\Store\Actions\CreateOrder;
use App\Domain\Store\Actions\ExpireStaleOrders;
use App\Domain\Store\Enums\OrderStatus;
use App\Domain\Store\Models\Order;
use App\Domain\Store\Models\Product;
use App\Domain\Store\Models\ProductVariant;
use App\Domain\Store\Payments\FakeGateway;
use App\Domain\Store\Payments\PaymentGateway;
use App\Domain\Store\Payments\PaystackGateway;
use App\Mail\OrderReceiptMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use LogicException;
use Tests\TestCase;

class ShopApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->catalogue();
    }

    /** A fixed catalogue for these tests, so they don't change when the real merchandise and prices are updated. */
    private function catalogue(): void
    {
        $sizes = ['S', 'M', 'L', 'XL', 'XXL'];
        $products = [
            ['executive-polo', '37th Edition Executive Polo', 'apparel', 1250000, 'New', [['name' => 'Cobalt', 'hex' => '#003070'], ['name' => 'White', 'hex' => '#ffffff'], ['name' => 'Brick', 'hex' => '#8c1f1c']], $sizes],
            ['hoodie-cap-set', 'Conference Hoodie + Cap set', 'apparel', 2500000, 'Bundle', [['name' => 'Brick', 'hex' => '#8c1f1c']], $sizes],
            ['conference-tee', 'Conference T-shirt', 'apparel', 800000, null, [['name' => 'Green', 'hex' => '#2f7d4f']], $sizes],
            ['media-team-tee', 'Media Team T-shirt', 'apparel', 800000, null, [['name' => 'Black', 'hex' => '#16181d']], $sizes],
            ['psalm-23-jersey', 'Psalm 23 Jersey', 'apparel', 1500000, null, [['name' => 'Black', 'hex' => '#16181d']], $sizes],
            ['ministers-journal', 'Ministers Syllabus & Prophetic Journal', 'books', 600000, null, [], []],
        ];
        foreach ($products as $i => [$slug, $name, $category, $price, $tag, $colors, $productSizes]) {
            $product = Product::create([
                'slug' => $slug, 'name' => $name, 'category' => $category, 'price_kobo' => $price, 'tag' => $tag, 'images' => $slug === 'executive-polo' ? ['/images/merch/polo.png', '/images/merch/tee-black.png', '/images/merch/tee-green.png'] : [], 'colors' => $colors,
                'sizes' => $productSizes, 'facts' => [], 'active' => true, 'sort' => $i,
            ]);
            foreach ($productSizes ?: [null] as $size) {
                foreach ($colors ?: [['name' => null]] as $color) {
                    $product->variants()->create(['size' => $size, 'color' => $color['name'], 'stock' => $category === 'books' ? 100 : ($size === 'L' ? 46 : 30)]);
                }
            }
        }
    }

    private function variant(string $slug, ?string $size = null): ProductVariant
    {
        return Product::where('slug', $slug)->firstOrFail()->variants()->when($size, fn ($q) => $q->where('size', $size))->orderBy('id')->firstOrFail();
    }

    private function bag(array $lines): array
    {
        return array_map(fn ($l) => ['variant_id' => $l[0]->id, 'qty' => $l[1]], $lines);
    }

    private function checkout(?array $lines = null, array $overrides = [])
    {
        $lines ??= [[$this->variant('executive-polo', 'L'), 1], [$this->variant('hoodie-cap-set', 'M'), 1]];

        return $this->postJson('/api/v1/shop/checkout', array_merge([
            'items' => $this->bag($lines),
            'customer' => ['name' => 'Adebayo Ogunleye', 'email' => 'Ade@Example.com', 'phone' => '+234 803 456 7821'],
            'method' => 'card',
        ], $overrides));
    }

    private function pay(string $reference, string $outcome = 'success')
    {
        return $this->postJson("/api/v1/shop/payments/mock/{$reference}/complete", ['outcome' => $outcome]);
    }

    private function reference(Order $order): string
    {
        return $order->payments()->firstOrFail()->reference;
    }

    // ───────── catalogue ─────────

    public function test_lists_products_with_category_counts_search_and_stock(): void
    {
        $res = $this->getJson('/api/v1/shop/products')->assertOk();
        $this->assertCount(6, $res->json('data'));
        $this->assertSame(6, $res->json('meta.total'));
        $this->assertSame([['key' => 'apparel', 'label' => 'Apparel', 'count' => 5], ['key' => 'books', 'label' => 'Books', 'count' => 1]], $res->json('meta.categories'));
        $this->assertSame(1250000, $res->json('data.0.price_kobo'));
        $this->assertSame('/images/merch/polo.png', $res->json('data.0.image'));
        $this->assertTrue($res->json('data.0.in_stock'));

        $this->assertCount(1, $this->getJson('/api/v1/shop/products?category=books')->json('data'));
        $this->assertSame(['Psalm 23 Jersey'], array_column($this->getJson('/api/v1/shop/products?q=psalm')->json('data'), 'name'));
        $this->assertCount(0, $this->getJson('/api/v1/shop/products?q=%25')->json('data'));
    }

    public function test_product_detail_exposes_options_and_per_variant_stock(): void
    {
        $res = $this->getJson('/api/v1/shop/products/executive-polo')->assertOk();

        $this->assertSame(['S', 'M', 'L', 'XL', 'XXL'], $res->json('data.sizes'));
        $this->assertSame(['Cobalt', 'White', 'Brick'], array_column($res->json('data.colors'), 'name'));
        $this->assertCount(15, $res->json('data.variants'));
        $this->assertSame(46, collect($res->json('data.variants'))->firstWhere(fn ($v) => $v['size'] === 'L' && $v['color'] === 'Cobalt')['stock']);
        $this->getJson('/api/v1/shop/products/nope')->assertNotFound();

        Product::where('slug', 'executive-polo')->update(['active' => false]);
        $this->getJson('/api/v1/shop/products/executive-polo')->assertNotFound();
        $this->assertCount(5, $this->getJson('/api/v1/shop/products')->json('data'));
    }

    // ───────── checkout ─────────

    public function test_checkout_prices_on_the_server_reserves_stock_and_returns_the_payment_url(): void
    {
        $polo = $this->variant('executive-polo', 'L');
        $before = $polo->stock;

        $res = $this->checkout()->assertCreated();

        $res->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.subtotal_kobo', 3750000)
            ->assertJsonPath('data.fee_kobo', 36200)   // ₦362 on ₦37,500, as in the design
            ->assertJsonPath('data.total_kobo', 3786200);
        $this->assertMatchesRegularExpression('/^MV-\d{5}$/', $res->json('data.code'));
        $this->assertStringContainsString('/shop/pay/mock?reference=', $res->json('meta.payment_url'));
        $this->assertSame(24, strlen($res->json('meta.access_token')));
        $this->assertSame($before - 1, $polo->fresh()->stock);

        $order = Order::first();
        $this->assertSame('ade@example.com', $order->customer_email);
        $this->assertSame('Size L · Cobalt', $order->items->firstWhere('name', '37th Edition Executive Polo')->variant_label);
        $this->assertSame(3786200, $order->payments()->first()->amount_kobo);
    }

    public function test_the_client_cannot_set_prices_and_duplicate_lines_merge(): void
    {
        $polo = $this->variant('executive-polo', 'L');

        $res = $this->postJson('/api/v1/shop/checkout', [
            'items' => [['variant_id' => $polo->id, 'qty' => 1, 'price_kobo' => 1], ['variant_id' => $polo->id, 'qty' => 2, 'unit_price_kobo' => 1]],
            'customer' => ['name' => 'Ade', 'email' => 'a@b.co'], 'method' => 'ussd',
        ])->assertCreated();

        $this->assertSame(3 * 1250000, $res->json('data.subtotal_kobo'));
        $this->assertCount(1, $res->json('data.items'));
        $this->assertSame(3, $res->json('data.items.0.qty'));
    }

    public function test_insufficient_stock_is_refused_per_line_and_nothing_is_reserved(): void
    {
        $polo = $this->variant('executive-polo', 'L');
        $polo->update(['stock' => 1]);
        $hoodie = $this->variant('hoodie-cap-set', 'M');
        $hoodieStock = $hoodie->stock;

        $res = $this->checkout([[$hoodie, 1], [$polo, 2]])->assertStatus(422)->assertJsonValidationErrors(['items.1.qty']);
        $this->assertSame('Only 1 left.', $res->json('errors')['items.1.qty'][0]);

        $this->assertSame($hoodieStock, $hoodie->fresh()->stock);
        $this->assertSame(1, $polo->fresh()->stock);
        $this->assertDatabaseCount('orders', 0);

        $polo->update(['stock' => 0]);
        $this->assertSame('Sold out.', $this->checkout([[$polo, 1]])->json('errors')['items.0.qty'][0]);
    }

    public function test_the_last_item_cannot_be_sold_twice(): void
    {
        $polo = $this->variant('executive-polo', 'L');
        $polo->update(['stock' => 1]);

        $this->checkout([[$polo, 1]])->assertCreated();
        $this->checkout([[$polo, 1]])->assertStatus(422);
        $this->assertSame(0, $polo->fresh()->stock);
    }

    public function test_checkout_validation(): void
    {
        $polo = $this->variant('executive-polo', 'L');
        $this->postJson('/api/v1/shop/checkout', ['items' => [], 'method' => 'cash'])->assertJsonValidationErrors(['items', 'customer.name', 'customer.email', 'method']);
        $this->checkout([[$polo, 11]])->assertJsonValidationErrors('items.0.qty');
        $this->checkout([[$polo, 1]], ['customer' => ['name' => 'A', 'email' => 'nope']])->assertJsonValidationErrors(['customer.name', 'customer.email']);
        $this->postJson('/api/v1/shop/checkout', ['items' => [['variant_id' => 99999, 'qty' => 1]], 'customer' => ['name' => 'Ade', 'email' => 'a@b.co'], 'method' => 'card'])->assertJsonValidationErrors('items.0.variant_id');
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_an_attendee_checkout_is_linked_to_them(): void
    {
        $a = Attendee::create(['full_name' => 'Ade', 'email' => 'a@b.co', 'age_band' => '18-45', 'email_verified_at' => now()]);
        $this->withToken($a->createToken('t')->plainTextToken);

        $this->checkout()->assertCreated();
        $this->assertSame($a->id, Order::first()->attendee_id);
    }

    // ───────── paying (mock Paystack) ─────────

    public function test_a_successful_payment_marks_the_order_paid_once_and_emails_a_receipt(): void
    {
        $this->checkout();
        $order = Order::first();
        $ref = $this->reference($order);

        $this->pay($ref)->assertOk();
        $this->pay($ref)->assertOk(); // webhooks are retried: must be idempotent

        $order->refresh();
        $this->assertSame(OrderStatus::Paid, $order->status);
        $this->assertNotNull($order->paid_at);
        $this->assertSame('success', $order->payments()->first()->status);
        Mail::assertQueued(OrderReceiptMail::class, 1);
        Mail::assertQueued(OrderReceiptMail::class, fn ($m) => $m->hasTo('ade@example.com'));
        $this->assertSame(46 - 1, $this->variant('executive-polo', 'L')->stock);
    }

    public function test_a_failed_payment_fails_the_order_and_returns_the_stock(): void
    {
        $polo = $this->variant('executive-polo', 'L');
        $before = $polo->stock;
        $this->checkout([[$polo, 2]]);
        $order = Order::first();
        $this->assertSame($before - 2, $polo->fresh()->stock);

        $this->pay($this->reference($order), 'abandoned')->assertOk();

        $this->assertSame(OrderStatus::Failed, $order->fresh()->status);
        $this->assertSame($before, $polo->fresh()->stock);
        Mail::assertNothingQueued();
    }

    public function test_verify_settles_an_order_without_the_webhook(): void
    {
        $res = $this->checkout();
        $code = $res->json('data.code');
        $k = $res->json('meta.access_token');
        $order = Order::first();

        $this->postJson("/api/v1/shop/orders/{$code}/verify?k={$k}")->assertOk()->assertJsonPath('data.status', 'pending');

        app(PaymentGateway::class)->simulate($this->reference($order), 'success');
        $this->postJson("/api/v1/shop/orders/{$code}/verify?k={$k}")->assertOk()->assertJsonPath('data.status', 'paid')->assertJsonPath('data.pickup_code', $code);
        $this->postJson("/api/v1/shop/orders/{$code}/verify?k={$k}")->assertOk()->assertJsonPath('data.status', 'paid');
        Mail::assertQueued(OrderReceiptMail::class, 1);
    }

    public function test_an_unfinished_order_can_resume_on_the_payment_page(): void
    {
        $res = $this->checkout();
        $this->getJson("/api/v1/shop/orders/{$res->json('data.code')}?k={$res->json('meta.access_token')}")
            ->assertOk()->assertJsonPath('data.pay_url', $res->json('meta.payment_url'));
    }

    // ───────── order privacy ─────────

    public function test_an_order_page_needs_its_key_or_its_owner(): void
    {
        $res = $this->checkout();
        $code = $res->json('data.code');
        $k = $res->json('meta.access_token');

        $this->getJson("/api/v1/shop/orders/{$code}")->assertNotFound();
        $this->getJson("/api/v1/shop/orders/{$code}?k=wrong")->assertNotFound();
        $this->postJson("/api/v1/shop/orders/{$code}/verify?k=wrong")->assertNotFound();
        $this->getJson("/api/v1/shop/orders/{$code}?k={$k}")->assertOk()->assertJsonPath('data.customer_name', 'Adebayo Ogunleye');

        $a = Attendee::create(['full_name' => 'Ade', 'email' => 'a@b.co', 'age_band' => '18-45', 'email_verified_at' => now()]);
        Order::first()->update(['attendee_id' => $a->id]);
        $this->app['auth']->forgetGuards();
        $this->flushHeaders();
        $this->withToken($a->createToken('t')->plainTextToken)->getJson("/api/v1/shop/orders/{$code}")->assertOk();
    }

    public function test_add_to_my_pass_links_a_guest_order_and_lists_it(): void
    {
        $res = $this->checkout();
        $code = $res->json('data.code');
        $k = $res->json('meta.access_token');
        $this->pay($this->reference(Order::first()));

        $this->postJson("/api/v1/shop/orders/{$code}/attach?k={$k}")->assertUnauthorized();

        $a = Attendee::create(['full_name' => 'Ade', 'email' => 'a@b.co', 'age_band' => '18-45', 'email_verified_at' => now()]);
        $this->app['auth']->forgetGuards();
        $this->withToken($a->createToken('t')->plainTextToken);
        $this->postJson("/api/v1/shop/orders/{$code}/attach?k={$k}")->assertOk();
        $this->getJson('/api/v1/me/orders')->assertOk()->assertJsonPath('data.0.code', $code)->assertJsonPath('data.0.status', 'paid');
    }

    // ───────── webhook ─────────

    private function signed(string $body, ?string $secret = null): array
    {
        return ['x-paystack-signature' => hash_hmac('sha512', $body, $secret ?? config('shop.fake_secret'))];
    }

    public function test_the_webhook_rejects_a_bad_signature_and_acknowledges_unknown_events(): void
    {
        $this->checkout();
        $order = Order::first();
        $body = json_encode(['event' => 'charge.success', 'data' => ['reference' => $this->reference($order)]]);
        app(PaymentGateway::class)->simulate($this->reference($order), 'success');

        $this->call('POST', '/api/v1/webhooks/paystack', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_PAYSTACK_SIGNATURE' => 'bad'], $body)->assertUnauthorized();
        $this->call('POST', '/api/v1/webhooks/paystack', [], [], [], ['CONTENT_TYPE' => 'application/json'], $body)->assertUnauthorized();
        $this->assertSame(OrderStatus::Pending, $order->fresh()->status);

        $ok = ['CONTENT_TYPE' => 'application/json', 'HTTP_X_PAYSTACK_SIGNATURE' => $this->signed($body)['x-paystack-signature']];
        $this->call('POST', '/api/v1/webhooks/paystack', [], [], [], $ok, $body)->assertOk();
        $this->assertSame(OrderStatus::Paid, $order->fresh()->status);

        $other = json_encode(['event' => 'transfer.success', 'data' => ['reference' => 'x']]);
        $this->call('POST', '/api/v1/webhooks/paystack', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_PAYSTACK_SIGNATURE' => $this->signed($other)['x-paystack-signature']], $other)->assertOk();
        $ghost = json_encode(['event' => 'charge.success', 'data' => ['reference' => 'does-not-exist']]);
        $this->call('POST', '/api/v1/webhooks/paystack', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_PAYSTACK_SIGNATURE' => $this->signed($ghost)['x-paystack-signature']], $ghost)->assertOk();
    }

    public function test_the_webhook_body_is_never_trusted_for_the_outcome(): void
    {
        $this->checkout();
        $order = Order::first();
        // A correctly signed "success" event, but the provider says nothing happened.
        $body = json_encode(['event' => 'charge.success', 'data' => ['reference' => $this->reference($order), 'status' => 'success']]);
        $this->call('POST', '/api/v1/webhooks/paystack', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_PAYSTACK_SIGNATURE' => $this->signed($body)['x-paystack-signature']], $body)->assertOk();

        $this->assertSame(OrderStatus::Pending, $order->fresh()->status);
    }

    public function test_an_underpayment_is_never_fulfilled(): void
    {
        $this->checkout();
        $order = Order::first();
        $payment = $order->payments()->first();
        // The "customer" pays ₦1 less than the order total; the provider reports what was actually paid.
        app(PaymentGateway::class)->simulate($payment->reference, 'success', $payment->amount_kobo - 100);
        $body = json_encode(['event' => 'charge.success', 'data' => ['reference' => $payment->reference]]);
        $this->call('POST', '/api/v1/webhooks/paystack', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_PAYSTACK_SIGNATURE' => $this->signed($body)['x-paystack-signature']], $body)->assertOk();

        $this->assertSame(OrderStatus::Pending, $order->fresh()->status);
        $this->assertSame('failed', $payment->fresh()->status);
        Mail::assertNothingQueued();
    }

    // ───────── expiry and late payments ─────────

    public function test_unpaid_orders_expire_and_release_their_stock(): void
    {
        $polo = $this->variant('executive-polo', 'L');
        $before = $polo->stock;
        $this->checkout([[$polo, 3]]);
        Order::first()->update(['expires_at' => now()->subMinute()]);
        $fresh = $this->checkout([[$polo, 1]]); // a second, still-valid order
        $this->assertSame($before - 4, $polo->fresh()->stock);

        $this->artisan('shop:expire-orders')->expectsOutput('Expired 1 order(s).')->assertSuccessful();

        $this->assertSame(OrderStatus::Expired, Order::orderBy('id')->first()->status);
        $this->assertSame(OrderStatus::Pending, Order::where('code', $fresh->json('data.code'))->first()->status);
        $this->assertSame($before - 1, $polo->fresh()->stock);
        $this->assertSame(0, app(ExpireStaleOrders::class)());
    }

    public function test_a_payment_after_expiry_retakes_the_stock_or_flags_a_refund(): void
    {
        $polo = $this->variant('executive-polo', 'L');
        $this->checkout([[$polo, 2]]);
        $order = Order::first();
        $order->update(['expires_at' => now()->subMinute()]);
        app(ExpireStaleOrders::class)();

        $this->pay($this->reference($order))->assertOk();
        $this->assertSame(OrderStatus::Paid, $order->fresh()->status);
        $this->assertSame(46 - 2, $polo->fresh()->stock);

        // Second case: the stock was sold to someone else in the meantime.
        $polo->update(['stock' => 5]);
        $this->checkout([[$polo, 2]]);
        $late = Order::orderByDesc('id')->first();
        $late->update(['expires_at' => now()->subMinute()]);
        app(ExpireStaleOrders::class)();
        $polo->update(['stock' => 1]);

        $this->pay($this->reference($late))->assertOk();
        $this->assertSame(OrderStatus::RefundDue, $late->fresh()->status);
        $this->assertSame(1, $polo->fresh()->stock);
    }

    public function test_order_status_only_moves_along_allowed_paths(): void
    {
        $this->checkout();
        $order = Order::first();

        $order->transitionTo(OrderStatus::Paid);
        $order->transitionTo(OrderStatus::Collected);
        $this->expectException(LogicException::class);
        $order->transitionTo(OrderStatus::Paid);
    }

    public function test_the_state_machine_table(): void
    {
        $this->assertTrue(OrderStatus::Pending->canBecome(OrderStatus::Paid));
        $this->assertTrue(OrderStatus::Paid->canBecome(OrderStatus::Refunded));
        $this->assertTrue(OrderStatus::Expired->canBecome(OrderStatus::RefundDue));
        $this->assertFalse(OrderStatus::Pending->canBecome(OrderStatus::Collected));
        $this->assertFalse(OrderStatus::Refunded->canBecome(OrderStatus::Paid));
        $this->assertFalse(OrderStatus::Collected->canBecome(OrderStatus::Refunded));
    }

    // ───────── real Paystack gateway (HTTP faked) and driver safety ─────────

    public function test_the_paystack_gateway_initializes_verifies_and_checks_signatures(): void
    {
        config(['shop.payment_driver' => 'paystack', 'shop.paystack.secret_key' => 'sk_test_abc']);
        $this->app->forgetInstance(PaymentGateway::class);
        Http::fake([
            'api.paystack.co/transaction/initialize' => Http::response(['status' => true, 'data' => ['authorization_url' => 'https://checkout.paystack.com/abc', 'access_code' => 'abc']]),
            'api.paystack.co/transaction/verify/*' => Http::sequence()
                ->push(['status' => true, 'data' => ['status' => 'success', 'amount' => 3786200, 'channel' => 'card']])
                ->push(['status' => true, 'data' => ['status' => 'abandoned', 'amount' => 3786200]])
                ->push(['status' => true, 'data' => ['status' => 'ongoing', 'amount' => 0]])
                ->push([], 500),
        ]);

        $res = $this->checkout(null, ['method' => 'bank_transfer'])->assertCreated();
        $this->assertSame('https://checkout.paystack.com/abc', $res->json('meta.payment_url'));
        Http::assertSent(function ($req) {
            return str_ends_with($req->url(), '/transaction/initialize')
                && $req->hasHeader('Authorization', 'Bearer sk_test_abc')
                && $req['amount'] === 3786200
                && $req['email'] === 'ade@example.com'
                && $req['channels'] === ['bank_transfer']
                && str_contains($req['callback_url'], '/shop/orders/MV-')
                && str_starts_with($req['reference'], 'MV-');
        });

        $gw = app(PaymentGateway::class);
        $this->assertInstanceOf(PaystackGateway::class, $gw);
        $this->assertSame(['success', 3786200, 'card'], [($v = $gw->verify('r1'))->status, $v->amountKobo, $v->channel]);
        $this->assertSame('failed', $gw->verify('r2')->status);
        $this->assertSame('pending', $gw->verify('r3')->status);
        $this->assertSame('pending', $gw->verify('r4')->status); // a lookup error must not fail the order

        $body = '{"event":"charge.success"}';
        $this->assertTrue($gw->validSignature($body, hash_hmac('sha512', $body, 'sk_test_abc')));
        $this->assertFalse($gw->validSignature($body, hash_hmac('sha512', $body, 'other')));
        $this->assertFalse($gw->validSignature($body, null));
    }

    public function test_a_provider_outage_at_checkout_releases_the_stock_and_reports_it(): void
    {
        config(['shop.payment_driver' => 'paystack', 'shop.paystack.secret_key' => 'sk_test_abc']);
        $this->app->forgetInstance(PaymentGateway::class);
        Http::fake(['api.paystack.co/*' => Http::response(['status' => false, 'message' => 'down'], 503)]);
        $polo = $this->variant('executive-polo', 'L');
        $before = $polo->stock;

        $this->checkout([[$polo, 1]])->assertStatus(502)->assertJsonPath('code', 'payment_unavailable');

        $this->assertSame($before, $polo->fresh()->stock);
        $this->assertSame(OrderStatus::Failed, Order::first()->status);
    }

    public function test_the_mock_payment_endpoint_does_not_exist_with_the_real_driver(): void
    {
        config(['shop.payment_driver' => 'paystack', 'shop.paystack.secret_key' => 'sk']);
        $this->app->forgetInstance(PaymentGateway::class);
        $this->pay('anything')->assertNotFound();
    }

    public function test_the_fake_driver_is_refused_in_production(): void
    {
        $this->app->forgetInstance(PaymentGateway::class);
        $this->app['env'] = 'production';
        $this->expectException(\InvalidArgumentException::class);
        app(PaymentGateway::class);
    }

    public function test_fee_rounds_down_to_whole_naira(): void
    {
        $this->assertSame(36200, CreateOrder::fee(3750000));
        $this->assertSame(15600, CreateOrder::fee(800000)); // 0.7% of ₦8,000 = ₦56, plus ₦100
        $this->assertInstanceOf(FakeGateway::class, app(PaymentGateway::class));
    }
}
