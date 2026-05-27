<?php

use App\Http\Controllers\SessionController;
use Illuminate\Support\Facades\Route;

// Health check — sin autenticación
Route::get('/sessions/health', [SessionController::class, 'health']);

// Endpoints protegidos por JWT
Route::middleware('auth.jwt')->group(function () {
    Route::get('/sessions',          [SessionController::class, 'index']);
    Route::post('/sessions/start',   [SessionController::class, 'start']);
    Route::get('/sessions/{id}',     [SessionController::class, 'show']);
    Route::post('/sessions/{id}/join',   [SessionController::class, 'join']);
    Route::post('/sessions/{id}/end',    [SessionController::class, 'end']);
    Route::delete('/sessions/{id}',      [SessionController::class, 'destroy']);
});
