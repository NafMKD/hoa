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
        Schema::table('unit_leases', function (Blueprint $table) {
            $table->foreignId('signed_agreement_document_id')
                ->nullable()
                ->after('lease_document_id')
                ->constrained('documents');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('unit_leases', function (Blueprint $table) {
            $table->dropConstrainedForeignId('signed_agreement_document_id');
        });
    }
};
