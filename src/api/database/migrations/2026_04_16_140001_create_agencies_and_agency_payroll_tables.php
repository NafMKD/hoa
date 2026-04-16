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
        Schema::create('agencies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('name');
        });

        Schema::create('agency_placements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agency_id')->constrained('agencies')->cascadeOnDelete();
            $table->string('line_of_work', 64);
            $table->unsignedInteger('workers_count');
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['agency_id', 'line_of_work']);
            $table->index(['effective_from', 'effective_to']);
            $table->index('is_active');
        });

        Schema::create('agency_monthly_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agency_id')->constrained('agencies');
            $table->date('calendar_month');
            $table->decimal('amount_paid', 14, 2);
            $table->unsignedInteger('worker_count');
            $table->foreignId('placement_id')->nullable()->constrained('agency_placements');
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'paid'])->default('pending');
            $table->foreignId('expense_id')->nullable()->constrained('expenses');
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->date('pay_date')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['agency_id', 'calendar_month']);
            $table->index('calendar_month');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agency_monthly_payments');
        Schema::dropIfExists('agency_placements');
        Schema::dropIfExists('agencies');
    }
};
