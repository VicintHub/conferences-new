<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Every scan a phone made, kept forever: accepted or refused, online or replayed after being offline.
        Schema::create('scans', function (Blueprint $table) {
            $table->id();
            $table->string('client_uuid', 64)->unique(); // makes a replayed batch harmless
            $table->string('code', 40);
            $table->string('checkpoint', 10); // gate | hall | meal | merch
            $table->foreignId('registration_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('result', 8); // ok | refused
            $table->string('reason')->nullable();
            $table->string('label')->nullable(); // "Lunch"
            $table->text('detail')->nullable(); // the line the phone shows under the name
            $table->string('window_key', 40)->nullable(); // one meal per window
            $table->string('device', 40)->nullable(); // "Meal point 2"
            $table->foreignId('staff_id')->nullable()->constrained('staff_users')->nullOnDelete();
            $table->boolean('overridden')->default(false);
            $table->timestamp('scanned_at')->index();
            $table->timestamps();
            $table->index(['registration_id', 'checkpoint', 'window_key']);
        });

        Schema::create('badges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained('staff_users')->nullOnDelete();
            $table->string('desk', 40)->nullable();
            $table->boolean('reprint')->default(false);
            $table->string('reason')->nullable();
            $table->timestamp('printed_at')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('badges');
        Schema::dropIfExists('scans');
    }
};
