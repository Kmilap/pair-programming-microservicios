<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Este servicio NO maneja usuarios (Auth lo hace).
     * Solo seedea ejercicios para que el Aggregator pueda
     * seleccionarlos al iniciar sesiones.
     */
    public function run(): void
    {
        $this->call([
            ExerciseSeeder::class,
        ]);
    }
}
