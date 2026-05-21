<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabla principal de usuarios del microservicio Auth.
     *
     * Responsabilidad única: identidad y credenciales.
     * NO contiene datos de sesiones, ejercicios, métricas u otros
     * dominios — esos viven en sus respectivos microservicios.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');

            // Rol del usuario en el sistema de pair programming.
            // 'student' puede crear sesiones y participar.
            // 'teacher' puede observar sesiones activas (Modo Profesor — B1).
            $table->enum('role', ['student', 'teacher'])->default('student');

            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
