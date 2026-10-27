<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Leaders add people before they have said anything about themselves, so the age band can be unknown.
        Schema::table('attendees', function (Blueprint $table) {
            $table->string('age_band', 8)->nullable()->change();
        });

        // Set by the committee (admin console, build step 9) once a minister's credentials are checked.
        Schema::table('registrations', function (Blueprint $table) {
            $table->timestamp('minister_verified_at')->nullable()->after('consented_at');
        });

        Schema::create('teams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leader_id')->constrained('attendees')->cascadeOnDelete();
            $table->string('kind', 12); // church | minister
            $table->string('name');
            $table->string('code', 12)->unique(); // CLA-7Q4K
            $table->timestamps();
            $table->unique(['leader_id', 'kind']);
        });

        Schema::create('team_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            // One team per person: they cannot be on a church team and be someone's aide at once.
            $table->foreignId('attendee_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('role', 12); // leader | member | spouse | aide
            $table->string('title')->nullable(); // an aide's job, e.g. "Protocol"
            $table->foreignId('added_by')->nullable()->constrained('attendees')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendee_id')->constrained()->cascadeOnDelete();
            $table->string('role', 12); // vip | speaker | vendor | media
            $table->json('payload');
            $table->string('status', 20)->default('submitted');
            $table->text('requested_info')->nullable();
            $table->text('decision_note')->nullable();
            $table->timestamp('documents_checked_at')->nullable();
            $table->timestamp('review_started_at')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();
            $table->index(['attendee_id', 'role']);
            $table->index('status');
        });

        Schema::create('application_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('original_name');
            $table->string('mime', 100);
            $table->unsignedInteger('size');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_documents');
        Schema::dropIfExists('applications');
        Schema::dropIfExists('team_members');
        Schema::dropIfExists('teams');
        Schema::table('registrations', fn (Blueprint $t) => $t->dropColumn('minister_verified_at'));
    }
};
