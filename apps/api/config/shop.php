<?php

return [
    // fake = built-in mock Paystack (local dev, tests, demos); paystack = the real thing.
    'payment_driver' => env('PAYMENT_DRIVER', 'fake'),

    'paystack' => [
        'secret_key' => env('PAYSTACK_SECRET_KEY'),
        'base_url' => env('PAYSTACK_BASE_URL', 'https://api.paystack.co'),
    ],
    'fake_secret' => env('FAKE_PAYSTACK_SECRET', 'fake-paystack-secret'),

    // The customer pays the processing fee: percent of the subtotal plus a flat amount, rounded down to whole naira.
    // Defaults reproduce the design's ₦362 on ₦37,500; set to Paystack's real rate if the committee prefers.
    'fee_percent' => (float) env('SHOP_FEE_PERCENT', 0.7),
    'fee_flat_kobo' => (int) env('SHOP_FEE_FLAT_KOBO', 10000),

    // Unpaid orders hold their stock for this long.
    'reservation_minutes' => (int) env('SHOP_RESERVATION_MINUTES', 30),
    'max_qty_per_line' => 10,
    'methods' => ['card' => 'Card', 'bank_transfer' => 'Bank transfer', 'ussd' => 'USSD'],
];
