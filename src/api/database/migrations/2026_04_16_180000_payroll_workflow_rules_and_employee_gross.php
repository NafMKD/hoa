<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('employees', 'base_salary')) {
            DB::statement('ALTER TABLE employees CHANGE base_salary gross_salary DECIMAL(14,2) NOT NULL');
        }

        Schema::table('agencies', function (Blueprint $table) {
            $table->unsignedInteger('default_worker_count')->nullable()->after('notes');
            $table->decimal('default_monthly_amount', 14, 2)->nullable()->after('default_worker_count');
        });

        Schema::table('payrolls', function (Blueprint $table) {
            $table->json('calculation_metadata')->nullable()->after('net_salary');
            $table->foreignId('approved_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable()->after('approved_by');
        });

        DB::statement("ALTER TABLE payrolls MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'draft'");
        DB::table('payrolls')->where('status', 'pending')->update(['status' => 'draft']);

        Schema::table('agency_monthly_payments', function (Blueprint $table) {
            $table->json('generation_metadata')->nullable()->after('notes');
            $table->foreignId('approved_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable()->after('approved_by');
        });

        DB::statement("ALTER TABLE agency_monthly_payments MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'draft'");
        DB::table('agency_monthly_payments')->where('status', 'pending')->update(['status' => 'draft']);

        Schema::create('payroll_tax_brackets', function (Blueprint $table) {
            $table->id();
            $table->decimal('min_inclusive', 14, 2)->default(0);
            $table->decimal('max_inclusive', 14, 2)->nullable();
            $table->decimal('rate_percent', 8, 4)->default(0);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('payroll_settings', function (Blueprint $table) {
            $table->string('key', 64)->primary();
            $table->json('value');
            $table->timestamps();
        });

        DB::table('payroll_settings')->insert([
            ['key' => 'deduction_fixed', 'value' => json_encode(0), 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'deduction_percent_of_gross', 'value' => json_encode(0), 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('payroll_tax_brackets')->insert([
            ['min_inclusive' => 0, 'max_inclusive' => 600, 'rate_percent' => 0, 'sort_order' => 0, 'created_at' => now(), 'updated_at' => now()],
            ['min_inclusive' => 601, 'max_inclusive' => 5000, 'rate_percent' => 14, 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['min_inclusive' => 5001, 'max_inclusive' => null, 'rate_percent' => 20, 'sort_order' => 2, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_settings');
        Schema::dropIfExists('payroll_tax_brackets');

        DB::statement("ALTER TABLE agency_monthly_payments MODIFY COLUMN status ENUM('pending','paid') NOT NULL DEFAULT 'pending'");
        DB::table('agency_monthly_payments')->whereIn('status', ['draft', 'pending', 'approved'])->update(['status' => 'pending']);

        Schema::table('agency_monthly_payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('approved_by');
            $table->dropColumn(['approved_at', 'generation_metadata']);
        });

        DB::statement("ALTER TABLE payrolls MODIFY COLUMN status ENUM('pending','paid') NOT NULL DEFAULT 'pending'");
        DB::table('payrolls')->whereIn('status', ['draft', 'pending', 'approved'])->update(['status' => 'pending']);

        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropConstrainedForeignId('approved_by');
            $table->dropColumn(['approved_at', 'calculation_metadata']);
        });

        Schema::table('agencies', function (Blueprint $table) {
            $table->dropColumn(['default_worker_count', 'default_monthly_amount']);
        });

        if (Schema::hasColumn('employees', 'gross_salary')) {
            DB::statement('ALTER TABLE employees CHANGE gross_salary base_salary DECIMAL(14,2) NOT NULL');
        }
    }
};
