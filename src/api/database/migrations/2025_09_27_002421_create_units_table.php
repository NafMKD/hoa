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
            $table->foreignId('owner_id')->nullable()->constrained('users');
            $table->foreignId('tenant_id')->nullable()->constrained('users');
            $table->foreignId('ownership_file_id')->nullable()->constrained('documents');
            $table->enum('unit_type', Controller::_UNIT_TYPES)->nullable();
            $table->decimal('size_m2', 8, 2)->nullable();
            $table->enum('status', Controller::_UNIT_STATUSES)->default('owner_occupied');
            $table->timestamps();
            $table->softDeletes();

            $table->index('building_id');
            $table->index('owner_id');
            $table->index('tenant_id');
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
