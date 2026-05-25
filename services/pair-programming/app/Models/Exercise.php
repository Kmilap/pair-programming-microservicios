<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Exercise — Ejercicio de programación del catálogo.
 *
 * Pertenece al microservicio Pair Programming (Database per Service).
 * Una sesión SIEMPRE referencia un ejercicio.
 */
class Exercise extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'statement',
        'difficulty',
        'language',
        'initial_code',
    ];

    protected $casts = [
        'difficulty' => 'string',
    ];

    /**
     * Sesiones que se han iniciado con este ejercicio.
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class);
    }
}
