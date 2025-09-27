<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('unit_id')->nullable()->constrained('units');
            $table->date('issue_date');
            $table->date('due_date')->nullable();
            $table->decimal('total_amount', 14, 2);
            $table->decimal('amount_paid', 14, 2)->default(0);
            $table->enum('status', ['issued','partial','paid','overdue','cancelled'])->default('draft');
            $table->string('source_type')->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->decimal('penalty_amount', 12, 2)->default(0);
            $table->jsonb('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('user_id');
            $table->index('unit_id');
            $table->index('status');
            $table->index('issue_date');
            $table->index('due_date');
            // Partial / JSON index 
            // DB::statement('CREATE INDEX idx_invoices_metadata_gin ON invoices USING GIN (metadata)');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
