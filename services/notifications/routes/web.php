<?php

use Illuminate\Support\Facades\Route;

// Microservicio sin UI — ruta web vacía
Route::get('/', fn () => response()->json(['service' => 'notifications', 'status' => 'ok']));
