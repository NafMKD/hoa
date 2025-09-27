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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->enum('role', ['maintenance','security','cleaning','accountant','secretary','other']);
            $table->enum('employment_type', ['permanent','contract','hourly']);
            $table->decimal('base_salary', 14, 2);
            $table->string('bank_account_encrypted')->nullable();
            $table->date('hired_at')->nullable();
            $table->date('terminated_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('role');
            $table->index('employment_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
