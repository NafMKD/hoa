<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Reference remains required; duplicates allowed; non-unique index for lookups (e.g. duplicate detection).
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $indexName = $this->getUniqueIndexName();
            if ($indexName !== null) {
                $table->dropUnique($indexName);
            }
            if ($this->getReferenceIndexName() === null) {
                $table->index('reference');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['reference']);
            $table->unique('reference');
        });
    }

    private function getUniqueIndexName(): ?string
    {
        $indexes = DB::select('SHOW INDEX FROM payments WHERE Column_name = ?', ['reference']);
        foreach ($indexes as $index) {
            if (($index->Non_unique ?? 1) == 0) {
                return $index->Key_name;
            }
        }

        return null;
    }

    private function getReferenceIndexName(): ?string
    {
        $indexes = DB::select('SHOW INDEX FROM payments WHERE Column_name = ?', ['reference']);
        foreach ($indexes as $index) {
            if (($index->Non_unique ?? 1) == 1) {
                return $index->Key_name;
            }
        }

        return null;
    }
};
