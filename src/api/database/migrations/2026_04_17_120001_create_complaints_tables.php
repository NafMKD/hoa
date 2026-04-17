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
        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()->comment('Submitter');
            $table->foreignId('unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->enum('category', Controller::_COMPLAINT_CATEGORIES);
            $table->string('subject');
            $table->text('body');
            $table->enum('status', Controller::_COMPLAINT_STATUSES)->default('open')->index();
            $table->enum('priority', Controller::_COMPLAINT_PRIORITIES)->default('normal')->index();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['created_at', 'id']);
        });

        Schema::create('complaint_document', function (Blueprint $table) {
            $table->id();
            $table->foreignId('complaint_id')->constrained('complaints')->cascadeOnDelete();
            $table->foreignId('document_id')->constrained('documents')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['complaint_id', 'document_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('complaint_document');
        Schema::dropIfExists('complaints');
    }
};
