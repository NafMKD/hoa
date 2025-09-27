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
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('file_path', 255);
            $table->string('file_name', 255)->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->integer('file_size')->nullable();
            $table->enum('category', ['users', 'payslip', 'payments', 'tenantLeases', 'vehicles', 'stickers'])->nullable();
            $table->timestamp('uploaded_at')->useCurrent();
            $table->timestamps();
            $table->softDeletes();

            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
