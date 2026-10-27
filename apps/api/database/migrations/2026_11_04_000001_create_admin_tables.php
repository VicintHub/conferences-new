<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('role', 16); // admin | registration | content | moderator
            $table->string('title')->nullable(); // "Registration lead"
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // Staff sign in with the same emailed code and link as attendees; the audience keeps the two apart.
        Schema::table('otp_codes', function (Blueprint $table) {
            $table->string('audience', 10)->default('attendee')->after('email');
        });

        Schema::create('broadcasts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->nullable()->constrained('staff_users')->nullOnDelete();
            $table->string('title');
            $table->text('body');
            $table->json('channels');
            $table->json('audience');
            $table->timestamp('scheduled_at')->nullable()->index();
            $table->timestamp('sent_at')->nullable();
            $table->string('status', 12)->default('scheduled')->index(); // scheduled | sending | sent | cancelled
            $table->unsignedInteger('recipients_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('broadcasts');
        Schema::table('otp_codes', fn (Blueprint $t) => $t->dropColumn('audience'));
        Schema::dropIfExists('staff_users');
    }
};
