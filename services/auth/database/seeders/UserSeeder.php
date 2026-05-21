<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Usuarios de prueba para desarrollo y demo.
     *
     * Contraseñas en claro intencionalmente para facilitar pruebas.
     * En producción esto NUNCA se haría así.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Camila Niño',
                'email' => 'camila@unab.edu.co',
                'password' => Hash::make('password123'),
                'role' => 'student',
            ],
            [
                'name' => 'Noel Méndez',
                'email' => 'noel@unab.edu.co',
                'password' => Hash::make('password123'),
                'role' => 'student',
            ],
            [
                'name' => 'Fabian Suarez',
                'email' => 'fabian@unab.edu.co',
                'password' => Hash::make('password123'),
                'role' => 'teacher',
            ],
            [
                'name' => 'Javier Pinzón',
                'email' => 'javier@unab.edu.co',
                'password' => Hash::make('password123'),
                'role' => 'teacher',
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                $user
            );
        }
    }
}
