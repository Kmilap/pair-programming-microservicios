<?php

use App\Http\Controllers\SessionController;
use Illuminate\Support\Facades\Route;

/**
 * API Routes — Pair Programming Service
 * -----------------------------------------------------------
 * Estas rutas son consumidas por:
 *  - Frontend React (vía Traefik PathPrefix /sessions)
 *  - Pruebas con curl / Bruno
 *  - El healthcheck del docker-compose (/sessions/health)
 *
 * Convención:
 *  - /sessions/health  →  público (healthcheck)
 *  - /sessions/*       →  protegido por JWT
 */

// Health check — sin autenticación
Route::get('/sessions/health', [SessionController::class, 'health']);

// Endpoints protegidos por JWT
Route::middleware('auth.jwt')->group(function () {
    Route::post('/sessions/start', [SessionController::class, 'start']);
});
