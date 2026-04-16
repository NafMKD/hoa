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
        $now = now();

        DB::table('expense_categories')->insert([
            [
                'name' => 'Maintenance',
                'code' => 'maintenance',
                'parent_id' => null,
                'sort_order' => 10,
                'is_system' => false,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Utilities',
                'code' => 'utilities',
                'parent_id' => null,
                'sort_order' => 20,
                'is_system' => false,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Supplies',
                'code' => 'supplies',
                'parent_id' => null,
                'sort_order' => 30,
                'is_system' => false,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Other',
                'code' => 'other',
                'parent_id' => null,
                'sort_order' => 40,
                'is_system' => false,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Payroll',
                'code' => 'payroll',
                'parent_id' => null,
                'sort_order' => 100,
                'is_system' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        Schema::table('expenses', function (Blueprint $table) {
            $table->foreignId('expense_category_id')->nullable()->after('id')->constrained('expense_categories');
        });

        $legacyMap = ['maintenance', 'utilities', 'supplies', 'other'];

        foreach ($legacyMap as $code) {
            $id = DB::table('expense_categories')->where('code', $code)->value('id');
            DB::table('expenses')->where('category', $code)->update(['expense_category_id' => $id]);
        }

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->enum('category', ['maintenance', 'utilities', 'supplies', 'other'])->nullable()->after('vendor_id');
        });

        $legacyMap = ['maintenance', 'utilities', 'supplies', 'other'];

        foreach ($legacyMap as $code) {
            $id = DB::table('expense_categories')->where('code', $code)->value('id');
            if ($id) {
                DB::table('expenses')->where('expense_category_id', $id)->update(['category' => $code]);
            }
        }

        $payrollId = DB::table('expense_categories')->where('code', 'payroll')->value('id');
        if ($payrollId) {
            DB::table('expenses')->where('expense_category_id', $payrollId)->update(['category' => 'other']);
        }

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropForeign(['expense_category_id']);
            $table->dropColumn('expense_category_id');
        });

        DB::table('expense_categories')->delete();
    }
};
