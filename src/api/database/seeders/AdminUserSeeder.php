<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['phone' => env('ADMIN_PHONE')], // unique identifier
            [
                'first_name' => env('ADMIN_FIRST_NAME'),
                'last_name'  => env('ADMIN_LAST_NAME'),
                'email'      => env('ADMIN_EMAIL'),
                'city'       => env('ADMIN_CITY'),
                'sub_city'   => env('ADMIN_SUB_CITY'),
                'woreda'     => env('ADMIN_WOREDA'),
                'house_number' => env('ADMIN_HOUSE_NUMBER'),
                'password'   => Hash::make(env('ADMIN_PASSWORD')),
                'role'       => 'admin',
                'email_verified_at' => now(),
            ]
        );
    }
}
