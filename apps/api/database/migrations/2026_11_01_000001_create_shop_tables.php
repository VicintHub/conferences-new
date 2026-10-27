<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('category', 16)->index(); // apparel | books
            $table->unsignedInteger('price_kobo');
            $table->string('tag')->nullable();        // "New", "Bundle"
            $table->text('description')->nullable();
            $table->json('images');                   // paths on the web app (seed) or absolute URLs (uploads)
            $table->json('colors');                   // [{name, hex}]
            $table->json('sizes');                    // ["S","M","L"] or []
            $table->json('facts');                    // [{k, v}] shown under the buy box
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamps();
        });

        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('size', 8)->nullable();
            $table->string('color')->nullable();
            $table->unsignedInteger('stock')->default(0);
            $table->timestamps();
            $table->unique(['product_id', 'size', 'color']);
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('code', 12)->unique();            // MV-20417 — also the pickup QR payload
            $table->string('access_token', 32);               // lets a guest open their own order page
            $table->foreignId('attendee_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_name');
            $table->string('customer_phone', 24)->nullable();
            $table->string('customer_email');
            // pending | paid | collected | refunded | failed | expired | refund_due
            $table->string('status', 12)->default('pending')->index();
            $table->string('method', 16);
            $table->unsignedInteger('subtotal_kobo');
            $table->unsignedInteger('fee_kobo');
            $table->unsignedInteger('total_kobo');
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('collected_at')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained();
            $table->foreignId('product_variant_id')->constrained();
            // Snapshots: an order must keep reading the same after the catalogue changes.
            $table->string('name');
            $table->string('variant_label')->nullable();
            $table->string('image')->nullable();
            $table->unsignedInteger('unit_price_kobo');
            $table->unsignedSmallInteger('qty');
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 12);
            $table->string('reference')->unique();
            $table->unsignedInteger('amount_kobo');
            $table->string('status', 12)->default('initialized'); // initialized | success | failed
            $table->string('channel', 24)->nullable();
            $table->string('authorization_url')->nullable();
            $table->json('raw')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('products');
    }
};
