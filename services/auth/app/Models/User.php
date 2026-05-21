<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

/**
 * Modelo User del microservicio Auth.
 *
 * Implementa JWTSubject para emitir tokens con claims personalizados
 * que otros microservicios podrán validar sin acceder a esta DB.
 */
class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Identificador único del usuario para el JWT (claim 'sub').
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Claims personalizados que se incluyen en el JWT.
     * Estos claims permiten que otros microservicios sepan quién
     * es el usuario y qué rol tiene sin volver a consultar Auth.
     */
    public function getJWTCustomClaims()
    {
        return [
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
        ];
    }
}
