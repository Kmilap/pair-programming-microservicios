<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabla: outbox_events
 * -----------------------------------------------------------
 * Implementación del PATRÓN TRANSACTIONAL OUTBOX.
 *
 * Por qué este patrón:
 *  - Garantiza entrega at-least-once de eventos a RabbitMQ
 *    sin acoplar la disponibilidad de Pair Programming a la
 *    disponibilidad del broker.
 *  - Si RabbitMQ está caído, las sesiones se siguen creando
 *    porque el evento se persiste primero EN LA MISMA TRANSACCIÓN
 *    que la entidad. Un worker aparte lo publica después con retry.
 *
 * Estados del evento:
 *  - published_at IS NULL → pendiente de publicar
 *  - published_at != NULL → publicado al broker
 *
 * El worker (Bloque 4) consulta WHERE published_at IS NULL,
 * publica, y marca published_at = NOW().
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outbox_events', function (Blueprint $table) {
            $table->id();
            $table->string('aggregate_type', 100);
            $table->string('aggregate_id', 100);
            $table->string('event_type', 100);
            $table->jsonb('payload');
            $table->unsignedInteger('attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index('published_at');
            $table->index(['aggregate_type', 'aggregate_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outbox_events');
    }
};
