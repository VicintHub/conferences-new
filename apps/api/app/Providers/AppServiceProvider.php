<?php

namespace App\Providers;

use App\Domain\Store\Payments\FakeGateway;
use App\Domain\Store\Payments\PaymentGateway;
use App\Domain\Store\Payments\PaystackGateway;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use InvalidArgumentException;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PaymentGateway::class, fn () => match (config('shop.payment_driver')) {
            'paystack' => new PaystackGateway((string) config('shop.paystack.secret_key'), (string) config('shop.paystack.base_url')),
            'fake' => $this->app->isProduction()
                ? throw new InvalidArgumentException('The fake payment driver cannot be used in production.')
                : new FakeGateway((string) config('shop.fake_secret')),
            default => throw new InvalidArgumentException('Unsupported payment driver ['.config('shop.payment_driver').'].'),
        });
    }

    public function boot(): void
    {
        // Emailed codes: per address and per IP, so one inbox can't be flooded and one client can't spray many.
        RateLimiter::for('otp', fn (Request $request) => [
            Limit::perHour(8)->by('otp-email:'.strtolower((string) $request->input('email'))),
            Limit::perHour(30)->by('otp-ip:'.$request->ip()),
        ]);

        // Testimony uploads: a handful per hour per person (or IP for guests).
        RateLimiter::for('testimonies', fn (Request $request) => Limit::perHour(5)->by('testimony:'.($request->user('sanctum')?->id ?? $request->ip())));

        RateLimiter::for('verify', fn (Request $request) => Limit::perMinute(10)->by('verify-ip:'.$request->ip()));
    }
}
