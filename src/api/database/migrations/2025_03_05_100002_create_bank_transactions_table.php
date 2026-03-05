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
        Schema::create('bank_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained('bank_statement_batches')->cascadeOnDelete();
            $table->decimal('amount', 14, 2);
            $table->string('reference')->nullable();
            $table->date('transaction_date');
            $table->string('description')->nullable();
            $table->json('raw_data')->nullable();
            $table->foreignId('matched_payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->enum('status', ['unmatched', 'matched', 'escalated'])->default('unmatched');
            $table->timestamps();

            $table->index('batch_id');
            $table->index('transaction_date');
            $table->index('status');
            $table->index('matched_payment_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_transactions');
    }
};
