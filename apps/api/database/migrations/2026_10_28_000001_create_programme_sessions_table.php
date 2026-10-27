<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Named programme_sessions: Laravel already owns a `sessions` table for the session driver.
        Schema::create('programme_sessions', function (Blueprint $table) {
            $table->id();
            $table->date('day')->index();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->string('title');
            $table->string('subtitle')->nullable();
            // plenary | iylc | meal | arrival | breakout | worship — drives the colour edge in the app.
            $table->string('kind', 16)->default('plenary');
            $table->string('stream_url')->nullable();
            $table->timestamps();
        });

        Schema::table('registrations', function (Blueprint $table) {
            $table->timestamp('badge_printed_at')->nullable()->after('consented_at');
        });
    }

    public function down(): void
    {
        Schema::table('registrations', fn (Blueprint $table) => $table->dropColumn('badge_printed_at'));
        Schema::dropIfExists('programme_sessions');
    }
};
