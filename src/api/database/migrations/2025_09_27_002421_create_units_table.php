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
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('building_id')->constrained('buildings');
            $table->char('name', 10);
            $table->integer('floor_number');
            $table->foreignId('owner_id')->nullable()->constrained('users');
            $table->decimal('size_m2', 8, 2)->nullable();
            $table->enum('status', ['available','occupied','vacant','maintenance'])->default('available');
            $table->timestamps();
            $table->softDeletes();

            $table->index('building_id');
            $table->index('owner_id');
            $table->index('status');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
