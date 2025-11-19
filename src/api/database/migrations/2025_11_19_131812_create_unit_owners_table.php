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
        Schema::create('unit_owners', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unit_id')->constrained('units');
            $table->foreignId('user_id')->constrained('users');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->enum('status', ['active','inactive'])->default('active');
            $table->foreignId('ownership_file_id')->constrained('documents');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->index('unit_id');
            $table->index('user_id');

            $table->unique(['unit_id', 'user_id', 'start_date', 'end_date'], 'unique_active_owner_per_unit_user');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('unit_owners');
    }
};
