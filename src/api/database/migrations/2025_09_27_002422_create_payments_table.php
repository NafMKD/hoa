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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_number')->unique();
            $table->foreignId('invoice_id')->nullable()->constrained('invoices');
            $table->decimal('amount', 14, 2);
            $table->enum('method', ['cash','bank_transfer']);
            $table->string('reference')->nullable();
            $table->enum('status', ['pending','confirmed','failed','refunded'])->default('pending');
            $table->dateTime('processed_at')->nullable();
            $table->json('reconciliation_metadata')->nullable();
            $table->foreignId('payment_screen_shoot_id')->nullable()->constrained('documents');
            $table->dateTime('payment_date')->useCurrent();
            $table->timestamps();
            $table->softDeletes();

            $table->index('invoice_id');
            $table->index('status');
            $table->index('payment_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
