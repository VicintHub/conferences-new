<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('publicity_items', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('type', 12)->index(); // flyer | video | status | design | logo
            $table->text('caption');
            $table->string('meta')->nullable();              // "Square · Status · Print"
            $table->string('ratio', 8)->default('1/1');       // preview aspect ratio, e.g. 9/16
            $table->string('preview')->nullable();            // path on the web app (seed) or absolute URL (upload)
            $table->boolean('is_video')->default(false);
            // [{key, label, dims, url}] — one entry per downloadable size.
            $table->json('sizes');
            $table->unsignedInteger('downloads_count')->default(0);
            $table->unsignedInteger('shares_count')->default(0);
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('publicity_items');
    }
};
