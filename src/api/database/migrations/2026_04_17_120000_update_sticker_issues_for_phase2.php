<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sticker_issues', function (Blueprint $table) {
            $table->string('lookup_token', 64)->nullable()->unique();
            $table->foreignId('replaces_sticker_issue_id')->nullable()->constrained('sticker_issues');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sticker_issues', function (Blueprint $table) {
            $table->dropConstrainedForeignId('replaces_sticker_issue_id');
        });

        Schema::table('sticker_issues', function (Blueprint $table) {
            $table->dropUnique(['lookup_token']);
            $table->dropColumn('lookup_token');
        });
    }
};
