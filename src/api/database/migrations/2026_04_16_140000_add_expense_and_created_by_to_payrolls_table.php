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
        Schema::table('payrolls', function (Blueprint $table) {
            $table->foreignId('expense_id')->nullable()->after('payslip_document_id')->constrained('expenses');
            $table->foreignId('created_by')->nullable()->after('expense_id')->constrained('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropForeign(['expense_id']);
            $table->dropForeign(['created_by']);
            $table->dropColumn(['expense_id', 'created_by']);
        });
    }
};
