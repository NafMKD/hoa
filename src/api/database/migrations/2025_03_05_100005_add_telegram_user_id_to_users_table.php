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
        Schema::table('users', function (Blueprint $table) {
            // Store Telegram user id as string to support very large ids.
            $table->string('telegram_user_id', 64)->nullable()->after('status');
            $table->index('telegram_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['telegram_user_id']);
            $table->dropColumn('telegram_user_id');
        });
    }
};
