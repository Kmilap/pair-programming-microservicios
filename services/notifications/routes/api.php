<?php

use App\Http\Controllers\NotificationsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Notifications API Routes
|--------------------------------------------------------------------------
| GET /notifications/health  — healthcheck para Traefik + docker compose
| GET /notifications?userId= — listar notificaciones del usuario
| PATCH /notifications/{id}/read — marcar como leída
*/

Route::get('/notifications/health', [NotificationsController::class, 'health']);
Route::get('/notifications', [NotificationsController::class, 'index']);
Route::patch('/notifications/{id}/read', [NotificationsController::class, 'markRead']);
