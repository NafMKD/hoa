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
        Schema::create('letter_counters', function (Blueprint $table) {
            $table->id();
            $table->string('year_month', 7)->unique()->comment('YYYY-MM');
            $table->unsignedInteger('last_sequence')->default(0);
            $table->timestamps();
        });

        Schema::create('outgoing_letters', function (Blueprint $table) {
            $table->id();
            $table->string('letter_number')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->string('recipient_name')->nullable();
            $table->foreignId('scanned_document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['created_at', 'id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('outgoing_letters');
        Schema::dropIfExists('letter_counters');
    }
};
