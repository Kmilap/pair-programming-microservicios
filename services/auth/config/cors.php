<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Habilita peticiones cross-origin desde el frontend de Vite (puerto 5173)
    | hacia este microservicio Auth (expuesto en localhost:80 vía Traefik).
    |
    | El frontend y Auth viven en orígenes distintos (puertos 5173 vs 80),
    | así que el navegador exige cabeceras CORS explícitas en las respuestas.
    |
    */

    'paths' => ['*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
