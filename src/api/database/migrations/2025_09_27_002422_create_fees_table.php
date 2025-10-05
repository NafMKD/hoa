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
        Schema::create('fees', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->boolean('is_recurring')->default(false);
            $table->datetime('last_recurring_date')->nullable();
            $table->datetime('next_recurring_date')->nullable();
            $table->integer('recurring_period_months')->nullable();
            $table->enum('category', Controller::_FEE_CATEGORIES);
            $table->decimal('amount', 12, 2);
            $table->boolean('is_penalizable')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index('category');
            $table->index('is_recurring');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fees');
    }
};
