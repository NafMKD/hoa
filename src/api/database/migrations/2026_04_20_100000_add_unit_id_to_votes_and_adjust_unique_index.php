<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One vote per unit per poll: add unit_id (legacy rows may be empty — new votes must set unit_id).
     */
    public function up(): void
    {
        Schema::table('votes', function (Blueprint $table) {
            $table->dropUnique(['poll_id', 'user_id']);
        });

        Schema::table('votes', function (Blueprint $table) {
            $table->foreignId('unit_id')->nullable()->after('user_id')->constrained('units');
            $table->index(['poll_id', 'unit_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('votes', function (Blueprint $table) {
            $table->dropIndex(['poll_id', 'unit_id']);
            $table->dropConstrainedForeignId('unit_id');
        });

        Schema::table('votes', function (Blueprint $table) {
            $table->unique(['poll_id', 'user_id']);
        });
    }
};
