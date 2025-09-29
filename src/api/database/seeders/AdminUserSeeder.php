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
            ['phone' => '0932455518'], // unique identifier
            [
                'first_name' => 'System',
                'last_name'  => 'Admin',
                'email'      => 'admin@gmail.com',
                'password'   => Hash::make('12345678'),
                'role'       => 'admin',
                'email_verified_at' => now(),
            ]
        );
    }
}
