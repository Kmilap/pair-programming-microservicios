<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

/**
 * Controlador del microservicio Auth.
 *
 * Responsabilidades:
 *  - Registro de usuarios (POST /auth/register)
 *  - Login con JWT (POST /auth/login)
 *  - Validación de JWT para otros microservicios (POST /auth/validate)
 *  - Datos del usuario actual (GET /auth/me)
 *  - Healthcheck (GET /auth/health)
 *
 * Es stateless: no usa sesiones ni cookies, solo JWTs en headers.
 */
class AuthController extends Controller
{
    /**
     * POST /auth/register
     * Crea un nuevo usuario y devuelve un JWT inmediatamente.
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role'     => 'sometimes|in:student,teacher',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role ?? 'student',
        ]);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'message' => 'User registered successfully',
            'user'    => $user,
            'token'   => $token,
            'token_type'   => 'bearer',
            'expires_in'   => config('jwt.ttl') * 60,
        ], 201);
    }

    /**
     * POST /auth/login
     * Verifica credenciales y devuelve un JWT.
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        try {
            if (!$token = JWTAuth::attempt($credentials)) {
                return response()->json([
                    'message' => 'Invalid credentials',
                ], 401);
            }
        } catch (JWTException $e) {
            return response()->json([
                'message' => 'Could not create token',
            ], 500);
        }

        return response()->json([
            'message' => 'Login successful',
            'user'    => Auth::user(),
            'token'   => $token,
            'token_type'   => 'bearer',
            'expires_in'   => config('jwt.ttl') * 60,
        ]);
    }

    /**
     * POST /auth/validate
     * Endpoint usado por OTROS microservicios para verificar un JWT.
     *
     * Recibe el token en el header Authorization o en el body.
     * Devuelve los claims si es válido, o 401 si no lo es.
     *
     * Este endpoint es la pieza clave del patrón SSO con JWT en
     * arquitectura de microservicios.
     */
    public function validateToken(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user) {
                return response()->json([
                    'valid'   => false,
                    'message' => 'User not found',
                ], 401);
            }

            $payload = JWTAuth::parseToken()->getPayload();

            return response()->json([
                'valid'   => true,
                'user'    => $user,
                'claims'  => $payload->toArray(),
            ]);
        } catch (\Tymon\JWTAuth\Exceptions\TokenExpiredException $e) {
            return response()->json([
                'valid'   => false,
                'message' => 'Token expired',
            ], 401);
        } catch (\Tymon\JWTAuth\Exceptions\TokenInvalidException $e) {
            return response()->json([
                'valid'   => false,
                'message' => 'Token invalid',
            ], 401);
        } catch (JWTException $e) {
            return response()->json([
                'valid'   => false,
                'message' => 'Token absent or malformed',
            ], 401);
        }
    }

    /**
     * GET /auth/me
     * Devuelve los datos del usuario asociado al JWT actual.
     */
    public function me(): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            return response()->json(['user' => $user]);
        } catch (JWTException $e) {
            return response()->json([
                'message' => 'Unauthenticated',
            ], 401);
        }
    }

    /**
     * POST /auth/logout
     * Invalida el token actual.
     */
    public function logout(): JsonResponse
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
            return response()->json(['message' => 'Logged out successfully']);
        } catch (JWTException $e) {
            return response()->json([
                'message' => 'Could not invalidate token',
            ], 500);
        }
    }

    /**
     * GET /auth/health
     * Healthcheck para Docker y Traefik.
     */
    public function health(): JsonResponse
    {
        return response()->json([
            'status'    => 'ok',
            'service'   => 'auth',
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
