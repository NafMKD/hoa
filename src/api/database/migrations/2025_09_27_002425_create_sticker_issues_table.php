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
        Schema::create('sticker_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained('vehicles');
            $table->string('sticker_code')->unique();
            $table->foreignId('issued_by')->constrained('users');
            $table->dateTime('issued_at');
            $table->dateTime('expires_at')->nullable();
            $table->enum('status', ['active','lost','revoked','expired','replaced'])->default('active');
            $table->foreignId('qr_code_file_id')->constrained('documents');
            $table->timestamps();
            $table->softDeletes();

            $table->index('vehicle_id');
            $table->index('issued_by');
            $table->index('status');
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sticker_issues');
    }
};
