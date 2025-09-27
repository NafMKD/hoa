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
        Schema::create('votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_id')->constrained('polls');
            $table->foreignId('option_id')->constrained('poll_options');
            $table->foreignId('user_id')->constrained('users');
            $table->timestamps();
            
            $table->index('poll_id');
            $table->index('option_id');
            $table->unique(['poll_id','user_id']);

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('votes');
    }
};
