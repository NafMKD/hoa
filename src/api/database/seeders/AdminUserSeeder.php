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
            ['phone' => '0911551455'], // unique identifier
            [
                'first_name' => 'Anteneh',
                'last_name'  => 'M.',
                'email'      => 'anteneh@gmail.com',
                'city'       => 'Addis Ababa',
                'sub_city'    => 'Lemi Kura',
                'woreda'       => 'Woreda 13',
                'house_number' => 'SA01',
                'password'   => Hash::make('12345678'),
                'role'       => 'admin',
                'email_verified_at' => now(),
            ]
        );
    }
}
