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
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees');
            $table->date('payroll_period_start');
            $table->date('payroll_period_end');
            $table->decimal('gross_salary', 14, 2);
            $table->decimal('taxes', 14, 2);
            $table->decimal('deductions', 14, 2);
            $table->decimal('net_salary', 14, 2);
            $table->date('pay_date')->nullable();
            $table->enum('status', ['pending','paid'])->default('pending');
            $table->foreignId('payslip_document_id')->nullable()->constrained('documents');
            $table->timestamps();
            $table->softDeletes();

            $table->index('employee_id');
            $table->index(['payroll_period_start','payroll_period_end']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
