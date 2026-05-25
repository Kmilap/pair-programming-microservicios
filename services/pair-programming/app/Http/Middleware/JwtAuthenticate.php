<?php

namespace App\Http\Middleware;

use App\Services\AuthClient;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Exceptions\JWTException;

/**
 * JwtAuthenticate — Valida el JWT y adjunta los claims del usuario al request.
 *
 * Patrón: Single Sign-On (validación local stateless).
 *
 * El JWT viene en el header:  Authorization: Bearer <token>
 *
 * Tras la validación, el controller puede acceder al usuario con:
 *   $request->attributes->get('user')
 *
 * Estructura del usuario inyectado:
 *   ['id' => int, 'name' => string, 'email' => string, 'role' => string]
 */
class JwtAuthenticate
{
    public function __construct(private AuthClient $auth) {}

    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization');

        if (! $header || ! str_starts_with($header, 'Bearer ')) {
            return response()->json([
                'error' => 'missing_token',
                'message' => 'Authorization header with Bearer token is required',
            ], 401);
        }

        $token = substr($header, 7);

        try {
            $user = $this->auth->userFromToken($token);
        } catch (JWTException $e) {
            return response()->json([
                'error' => 'invalid_token',
                'message' => $e->getMessage(),
            ], 401);
        }

        // Adjuntamos el usuario al request para que el controller lo consuma
        $request->attributes->set('user', $user);

        return $next($request);
    }
}
