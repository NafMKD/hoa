<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE fees MODIFY COLUMN category ENUM('monthly','administrational','special_assessment','fine','penalty','other') NOT NULL");
        }

        DB::table('fees')->where('category', 'fine')->update(['category' => 'penalty']);

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE fees MODIFY COLUMN category ENUM('monthly','administrational','special_assessment','penalty','other') NOT NULL");
        }

        Schema::table('sticker_issues', function (Blueprint $table) {
            $table->foreignId('replacement_invoice_id')->nullable()->after('qr_code_file_id')->constrained('invoices')->nullOnDelete();
        });

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE sticker_issues MODIFY COLUMN status ENUM('active','lost','revoked','expired','replaced','returned') NOT NULL DEFAULT 'active'");
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        Schema::table('sticker_issues', function (Blueprint $table) {
            $table->dropConstrainedForeignId('replacement_invoice_id');
        });

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE sticker_issues MODIFY COLUMN status ENUM('active','lost','revoked','expired','replaced') NOT NULL DEFAULT 'active'");
        }

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE fees MODIFY COLUMN category ENUM('monthly','administrational','special_assessment','fine','penalty','other') NOT NULL");
        }

        DB::table('fees')->where('category', 'penalty')->update(['category' => 'fine']);

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE fees MODIFY COLUMN category ENUM('monthly','administrational','special_assessment','fine','other') NOT NULL");
        }
    }
};
