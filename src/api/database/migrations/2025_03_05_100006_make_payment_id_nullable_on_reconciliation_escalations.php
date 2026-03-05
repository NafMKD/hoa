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
        Schema::table('reconciliation_escalations', function (Blueprint $table) {
            $table->dropForeign(['payment_id']);
            $table->foreignId('payment_id')->nullable()->change();
        });

        Schema::table('reconciliation_escalations', function (Blueprint $table) {
            $table->foreign('payment_id')
                ->references('id')
                ->on('payments')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reconciliation_escalations', function (Blueprint $table) {
            $table->dropForeign(['payment_id']);
            $table->foreignId('payment_id')->nullable(false)->change();
        });

        Schema::table('reconciliation_escalations', function (Blueprint $table) {
            $table->foreign('payment_id')
                ->references('id')
                ->on('payments')
                ->cascadeOnDelete();
        });
    }
};
