<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabla: exercises
 * -----------------------------------------------------------
 * Catálogo de ejercicios de programación que el Aggregator
 * puede ofrecer al iniciar una sesión de pair programming.
 *
 * Patrón: Database per Service (esta tabla vive solo en
 * postgres-pp, otros microservicios no la conocen).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exercises', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->text('statement');
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('easy');
            $table->string('language', 50)->default('javascript');
            $table->text('initial_code')->nullable();
            $table->timestamps();

            $table->index('difficulty');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exercises');
    }
};
