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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('phone')->unique();
            $table->string('email')->nullable();
            $table->string('password');
            $table->string('city')->nullable();
            $table->string('sub_city')->nullable();
            $table->string('woreda')->nullable();
            $table->string('house_number')->nullable();
            $table->foreignId('id_file')->nullable()->constrained('documents');
            $table->timestamp('email_verified_at')->nullable();
            $table->enum('role', Controller::_ROLES)->default('tenant');
            $table->dateTime('last_login_at')->nullable();
            $table->enum('status', Controller::_USER_STATUSES)->default('active');
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            $table->index('role');
            $table->index('last_login_at');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('phone')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
