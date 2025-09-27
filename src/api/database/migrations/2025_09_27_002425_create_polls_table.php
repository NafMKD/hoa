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
        Schema::create('polls', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('eligible_scope')->nullable();
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->enum('status', ['draft','open','closed'])->default('draft');
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index(['start_at','end_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('polls');
    }
};
