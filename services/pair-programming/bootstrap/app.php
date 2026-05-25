<?php

use App\Http\Middleware\JwtAuthenticate;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: '',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Alias para usar en rutas:  Route::middleware('jwt.auth')->...
        $middleware->alias([
            'auth.jwt' => JwtAuthenticate::class,
        ]);

        // El API en Laravel 12 no aplica stateful middleware (sessions, csrf)
        // ni la cookie XSRF — eso es lo que queremos para microservicios.
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
