<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('testimonies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendee_id')->nullable()->constrained()->nullOnDelete();
            // The real name stays private (moderators only); display_name is what the public sees.
            $table->string('author_name');
            $table->string('display_name');
            $table->string('label')->nullable();
            $table->string('type', 8)->default('write'); // write | voice | video
            $table->text('body')->nullable();
            $table->string('media_path')->nullable();
            $table->string('poster_path')->nullable();
            $table->unsignedSmallInteger('duration_seconds')->nullable();
            $table->json('tags');
            $table->boolean('show_name')->default(true);
            $table->string('status', 12)->default('pending')->index(); // pending | approved | rejected
            $table->boolean('featured')->default(false);
            $table->unsignedInteger('amen_count')->default(0);
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('testimony_amens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('testimony_id')->constrained()->cascadeOnDelete();
            $table->foreignId('attendee_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['testimony_id', 'attendee_id']);
        });

        Schema::create('session_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('programme_session_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->json('highlights');
            $table->text('comment')->nullable();
            $table->timestamps();
            $table->unique(['attendee_id', 'programme_session_id']);
        });

        Schema::create('survey_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendee_id')->unique()->constrained()->cascadeOnDelete();
            $table->json('answers');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_responses');
        Schema::dropIfExists('session_feedback');
        Schema::dropIfExists('testimony_amens');
        Schema::dropIfExists('testimonies');
    }
};
