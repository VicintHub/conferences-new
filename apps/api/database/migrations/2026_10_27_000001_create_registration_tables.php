<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendees', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('email')->unique();
            $table->string('phone', 20)->nullable();
            $table->string('church')->nullable();
            $table->string('location')->nullable();
            $table->string('age_band', 8);
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamps();
        });

        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendee_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('category', 16);
            $table->string('mode', 8);
            $table->json('days');
            $table->boolean('needs_accommodation')->default(false);
            // pending_verification until the email is confirmed, then confirmed.
            $table->string('status', 24)->default('pending_verification');
            $table->string('claim_code', 20)->unique();
            $table->timestamp('consented_at')->nullable();
            $table->timestamps();
            $table->index(['mode', 'status']);
        });

        // One row per emailed sign-in: the 6-digit code and the magic link are two ways to consume the same row.
        Schema::create('otp_codes', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->string('code_hash', 64);
            $table->string('link_hash', 64)->unique();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('capacity_counters', function (Blueprint $table) {
            $table->string('name')->primary();
            $table->unsignedInteger('taken')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('capacity_counters');
        Schema::dropIfExists('otp_codes');
        Schema::dropIfExists('registrations');
        Schema::dropIfExists('attendees');
    }
};
