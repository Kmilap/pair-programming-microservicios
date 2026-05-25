<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * OutboxEvent — Evento pendiente de publicar al broker (Transactional Outbox).
 *
 * Se inserta en la misma transacción de DB que la entidad raíz
 * (ej: Session). Un worker aparte (php artisan outbox:publish)
 * lo lee, lo publica a RabbitMQ y marca published_at.
 *
 * Si RabbitMQ está caído, las entidades se siguen creando porque
 * la publicación es asíncrona. Garantía: at-least-once.
 */
class OutboxEvent extends Model
{
    use HasFactory;

    protected $table = 'outbox_events';

    protected $fillable = [
        'aggregate_type',
        'aggregate_id',
        'event_type',
        'payload',
        'attempts',
        'last_error',
        'published_at',
    ];

    protected $casts = [
        'payload' => 'array',         // jsonb ↔ array PHP automático
        'published_at' => 'datetime',
        'attempts' => 'integer',
    ];

    /**
     * Marca el evento como publicado exitosamente al broker.
     */
    public function markPublished(): void
    {
        $this->update(['published_at' => now()]);
    }

    /**
     * Registra un intento fallido y guarda el error.
     */
    public function markFailed(string $error): void
    {
        $this->update([
            'attempts' => $this->attempts + 1,
            'last_error' => $error,
        ]);
    }

    /**
     * Scope para que el worker pueda hacer:
     *   OutboxEvent::pending()->limit(10)->get()
     */
    public function scopePending($query)
    {
        return $query->whereNull('published_at')->orderBy('created_at');
    }
}
