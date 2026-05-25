<?php

namespace App\Services;

use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Payload;
use Illuminate\Support\Facades\Log;

/**
 * AuthClient — Gateway para el servicio Auth.
 *
 * Estrategia: validación LOCAL (stateless) por defecto.
 * El JWT está firmado con un secret compartido entre Auth
 * y Pair Programming. Cualquiera de los dos puede verificar
 * la firma sin round-trip de red. Esto cumple el principio
 * de descentralización de microservicios.
 *
 * El método validateRemotely() queda disponible si en el
 * futuro se necesita revocación inmediata (requeriría
 * habilitar blacklist en Auth y un Redis compartido).
 */
class AuthClient
{
    /**
     * Valida un JWT localmente y devuelve los claims.
     *
     * @param string $token JWT sin el prefijo "Bearer "
     * @return Payload claims del token
     * @throws JWTException si el token es inválido, expirado o malformado
     */
    public function validateLocally(string $token): Payload
    {
        return JWTAuth::setToken($token)->getPayload();
    }

    /**
     * Extrae los datos relevantes del usuario desde un token válido.
     *
     * @param string $token
     * @return array{id: int, name: string, email: string, role: string}
     * @throws JWTException
     */
    public function userFromToken(string $token): array
    {
        $payload = $this->validateLocally($token);

        return [
            'id'    => (int) $payload->get('sub'),
            'name'  => (string) $payload->get('name'),
            'email' => (string) $payload->get('email'),
            'role'  => (string) $payload->get('role'),
        ];
    }

    /**
     * Validación remota — disponible como alternativa.
     * Útil si en el futuro se habilita blacklist de tokens en Auth.
     *
     * NOTA: hoy NO se usa. Se incluye para documentar la decisión
     * arquitectónica y permitir el switch sin refactor mayor.
     */
    // public function validateRemotely(string $token): array
    // {
    //     $url = config('services.auth.url') . '/auth/validate';
    //     $response = Http::timeout(5)->post($url, ['token' => $token]);
    //     if ($response->failed()) {
    //         throw new JWTException('Auth rejected the token');
    //     }
    //     return $response->json('user');
    // }
}
