<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('revenue_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('payments');
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('amount', 14, 2);
            $table->boolean('recognized')->default(false);
            $table->dateTime('recognized_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('payment_id');
            $table->index('period_start');
            // Partial index for unrecognized revenue
            // DB::statement('CREATE INDEX idx_revenue_unrecognized ON revenue_schedule(period_start) WHERE recognized = false');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('revenue_schedules');
    }
};
