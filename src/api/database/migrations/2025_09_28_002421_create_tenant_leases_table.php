<?php

use App\Http\Controllers\Controller;
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
        Schema::create('tenant_leases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unit_id')->constrained('units');
            $table->foreignId('tenant_id')->constrained('users');
            $table->foreignId('representative_id')->nullable()->constrained('users'); 
            $table->foreignId('representative_document_id')->nullable()->constrained('documents');
            $table->enum('agreement_type', Controller::_LEASE_AGREEMENT_TYPES)->default('owner');
            $table->decimal('agreement_amount', 12, 2);
            $table->foreignId('lease_template_id')->nullable()->constrained('document_templates');
            $table->foreignId('lease_document_id')->nullable()->constrained('documents');
            $table->date('lease_start_date');
            $table->date('lease_end_date')->nullable();
            $table->enum('status', Controller::_LEASE_STATUS)->default('active');
            $table->string('witness_1_full_name')->nullable();
            $table->string('witness_2_full_name')->nullable();
            $table->string('witness_3_full_name')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->index('unit_id');
            $table->index('tenant_id');
            $table->index('status');
            $table->index('lease_start_date');
            $table->index('lease_end_date');
            $table->index('agreement_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_leases');
    }
};
