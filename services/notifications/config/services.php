<?php

return [

    /*
    |--------------------------------------------------------------------------
    | RabbitMQ — Choreography consumer
    |--------------------------------------------------------------------------
    */
    'rabbitmq' => [
        'host'     => env('RABBITMQ_HOST', 'rabbitmq'),
        'port'     => (int) env('RABBITMQ_PORT', 5672),
        'user'     => env('RABBITMQ_USER', 'admin'),
        'password' => env('RABBITMQ_PASSWORD', 'admin'),
        'vhost'    => env('RABBITMQ_VHOST', '/'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Motor de IA — B5 análisis post-sesión
    |--------------------------------------------------------------------------
    */
    'ai_engine' => [
        'url' => env('AI_ENGINE_URL', 'http://ai-engine:8000'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Editor — obtener código final para B5
    |--------------------------------------------------------------------------
    */
    'editor' => [
        'url' => env('EDITOR_URL', 'http://editor:3000'),
    ],

];
