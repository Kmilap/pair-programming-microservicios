<?php

use App\Http\Controllers\NotificationsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Notifications API Routes
|--------------------------------------------------------------------------
| GET    /notifications/health           — healthcheck para Traefik
| GET    /notifications?userId=          — listar notificaciones del usuario
| PATCH  /notifications/{id}/read        — marcar como leída
| PATCH  /notifications/read-all         — marcar todas como leídas
| DELETE /notifications/{id}             — borrar individual
| DELETE /notifications/clear-all        — borrar todas
|
| NOTA: /read-all y /clear-all deben ir ANTES de /{id} o Laravel
|       los matchea como si {id} fuera la cadena "read-all"/"clear-all".
*/

Route::get('/notifications/health',        [NotificationsController::class, 'health']);
Route::get('/notifications',               [NotificationsController::class, 'index']);
Route::patch('/notifications/read-all',    [NotificationsController::class, 'markAllRead']);
Route::patch('/notifications/{id}/read',   [NotificationsController::class, 'markRead']);
Route::delete('/notifications/clear-all',  [NotificationsController::class, 'clearAll']);
Route::delete('/notifications/{id}',       [NotificationsController::class, 'destroy']);
