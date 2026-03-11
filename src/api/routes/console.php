<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Queue worker for shared hosting (no long-running queue:listen)
| Run every minute via cron: * * * * * cd /path-to-project && php artisan schedule:run
|--------------------------------------------------------------------------
*/
Schedule::command('queue:work --stop-when-empty')
    ->everyMinute()
    ->withoutOverlapping();
