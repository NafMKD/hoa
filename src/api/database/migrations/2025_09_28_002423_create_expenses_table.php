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
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->nullable()->constrained('vendors');
            $table->text('description');
            $table->decimal('amount', 14, 2);
            $table->enum('category', ['maintenance','utilities','supplies','other']);
            $table->string('invoice_number')->nullable();
            $table->enum('status', ['unpaid','partially_paid','paid'])->default('unpaid');
            $table->date('expense_date');
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->index('vendor_id');
            $table->index('status');
            $table->index('expense_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
