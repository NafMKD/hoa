<?php

use App\Http\Controllers\Controller;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * MySQL/MariaDB: extend documents.category ENUM for outgoing letter scans.
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver !== 'mysql' && $driver !== 'mariadb') {
            return;
        }

        $quoted = array_map(
            fn (string $v): string => "'".str_replace("'", "''", $v)."'",
            Controller::_DOCUMENT_TYPES
        );

        $list = implode(',', $quoted);

        DB::statement("ALTER TABLE documents MODIFY COLUMN category ENUM({$list}) NULL");
    }

    public function down(): void
    {
        //
    }
};
