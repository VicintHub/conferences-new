<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('speakers', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('role');
            $table->string('short_role');
            // host | imlc_2026 | imlc_2027 — drives the groups and filters on the speakers page.
            $table->string('group', 16)->index();
            // A path on the web app (seed data) or an absolute URL (uploaded media). Null shows an initials tile.
            $table->string('photo')->nullable();
            $table->string('photo_mobile')->nullable();
            $table->json('bio');
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('speakers');
    }
};
