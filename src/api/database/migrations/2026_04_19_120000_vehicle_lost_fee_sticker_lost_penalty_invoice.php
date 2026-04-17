<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->foreignId('lost_sticker_fee_id')->nullable()->after('vehicle_document_id')->constrained('fees')->nullOnDelete();
        });

        Schema::table('sticker_issues', function (Blueprint $table) {
            $table->foreignId('lost_penalty_invoice_id')->nullable()->after('replacement_invoice_id')->constrained('invoices')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sticker_issues', function (Blueprint $table) {
            $table->dropConstrainedForeignId('lost_penalty_invoice_id');
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropConstrainedForeignId('lost_sticker_fee_id');
        });
    }
};
