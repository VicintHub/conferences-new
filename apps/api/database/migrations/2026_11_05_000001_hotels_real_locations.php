<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Real hotels come with a pin; their rates and drive times are not known until the committee enters them.
        Schema::table('hotels', function (Blueprint $table) {
            $table->decimal('lat', 9, 6)->nullable()->after('area');
            $table->decimal('lng', 9, 6)->nullable()->after('lat');
            $table->unsignedInteger('price_kobo')->nullable()->change();
            $table->unsignedSmallInteger('drive_minutes')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            $table->dropColumn(['lat', 'lng']);
        });
    }
};
