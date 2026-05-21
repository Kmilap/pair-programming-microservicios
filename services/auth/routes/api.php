<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Microservicio Auth
|--------------------------------------------------------------------------
| Las rutas se montan sin prefix de API (ver bootstrap/app.php).
| Traefik enruta /auth/* a este servicio.
*/

Route::prefix('auth')->group(function () {

    // Rutas públicas
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);
    Route::post('validate', [AuthController::class, 'validateToken']);
    Route::get('health',    [AuthController::class, 'health']);

    // Rutas autenticadas (requieren JWT válido)
    Route::middleware('auth:api')->group(function () {
        Route::get('me',      [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});
