<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabla: sessions
 * -----------------------------------------------------------
 * Sesiones activas o históricas de pair programming.
 *
 * Decisiones de diseño:
 *  - PK es UUID en lugar de bigint para que sea seguro
 *    exponer el ID en URLs y a otros servicios (no se infiere
 *    cuántas sesiones tenemos por enumeración).
 *  - host_user_id y partner_user_id son IDs externos (vienen
 *    de Auth vía JWT). NO hay FK porque users vive en otro
 *    microservicio (Database per Service).
 *  - editor_room_id es el ID que devuelve el Editor en el
 *    paso del Aggregator (POST /editor/rooms).
 *  - status enum: active mientras se programa, ended cuando
 *    se cierra (sea por timeout o por POST /sessions/{id}/end).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('exercise_id')->constrained('exercises');
            $table->unsignedBigInteger('host_user_id');
            $table->unsignedBigInteger('partner_user_id')->nullable();
            $table->enum('status', ['active', 'ended'])->default('active');
            $table->string('editor_room_id')->nullable();
            $table->string('editor_url')->nullable();
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('host_user_id');
            $table->index('partner_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
    }
};
