<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Session — Sesión de pair programming.
 *
 * Decisiones clave:
 *  - HasUuids: la PK es UUID, no bigint (ver migration).
 *  - $incrementing = false y $keyType = 'string': configuración
 *    necesaria de Eloquent cuando la PK no es auto-incremental.
 *  - $table renombrado explícitamente porque Laravel pluraliza
 *    Session → sessions (que choca con la palabra reservada
 *    de la facade Session que Laravel ya carga). El nombre
 *    explícito evita ambigüedades.
 *  - host_user_id / partner_user_id NO tienen relación Eloquent
 *    porque users vive en Auth (Database per Service).
 */
class Session extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'sessions';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'exercise_id',
        'host_user_id',
        'partner_user_id',
        'status',
        'editor_room_id',
        'editor_url',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    /**
     * Ejercicio que se está resolviendo en esta sesión.
     */
    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
