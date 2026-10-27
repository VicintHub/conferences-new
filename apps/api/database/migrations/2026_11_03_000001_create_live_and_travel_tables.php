<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row: what is being broadcast right now. The admin console edits it (build step 9).
        Schema::create('live_state', function (Blueprint $table) {
            $table->id();
            $table->boolean('is_live')->default(false);
            $table->string('video_url', 500)->nullable(); // HLS (.m3u8), YouTube/Vimeo link or a plain video file
            $table->string('radio_url', 500)->nullable(); // audio stream
            $table->string('poster')->nullable();
            $table->string('title')->nullable(); // overrides the programme title while live
            $table->timestamps();
        });

        // Who is watching: one row per attendee, refreshed by a heartbeat while the player plays.
        Schema::create('live_viewers', function (Blueprint $table) {
            $table->foreignId('attendee_id')->primary()->constrained()->cascadeOnDelete();
            $table->timestamp('seen_at')->index();
        });

        Schema::create('replays', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->date('recorded_on');
            $table->unsignedInteger('duration_seconds');
            $table->string('thumbnail')->nullable();
            $table->string('video_url', 500)->nullable(); // null until the recording is published
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamps();
        });

        Schema::create('session_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('session_id')->constrained('programme_sessions')->cascadeOnDelete();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            $table->unique(['attendee_id', 'session_id']);
        });

        Schema::create('hotels', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('area');
            $table->unsignedInteger('price_kobo'); // per night
            $table->decimal('distance_km', 4, 1);
            $table->unsignedSmallInteger('drive_minutes');
            $table->boolean('conference_rate')->default(false);
            $table->string('image')->nullable();
            $table->json('amenities');
            $table->string('shuttle_note')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('whatsapp', 20)->nullable();
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamps();
        });

        Schema::create('shuttles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('schedule');
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['shuttles', 'hotels', 'session_reminders', 'replays', 'live_viewers', 'live_state'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
