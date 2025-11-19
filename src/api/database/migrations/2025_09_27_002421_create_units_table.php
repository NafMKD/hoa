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
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('building_id')->constrained('buildings');
            $table->string('name')->unique();
            $table->integer('floor_number');
            $table->enum('unit_type', Controller::_UNIT_TYPES)->nullable();
            $table->decimal('size_m2', 8, 2)->nullable();
            $table->enum('status', Controller::_UNIT_STATUSES)->default('vacant');
            $table->timestamps();
            $table->softDeletes();

            $table->index('building_id');
            $table->index('status');
            $table->unique(['building_id', 'name']);

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
