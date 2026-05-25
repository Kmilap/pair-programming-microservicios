<?php

namespace App\Http\Controllers;

use App\Models\Exercise;
use App\Models\OutboxEvent;
use App\Models\Session;
use App\Services\EditorClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * SessionController — Orquesta las sesiones de pair programming.
 *
 * Implementa el PATRÓN AGGREGATOR en SessionController@start:
 *   1. Recibe la petición autenticada (JWT validado por middleware).
 *   2. Selecciona o valida el ejercicio.
 *   3. Llama al microservicio Editor para crear una sala colaborativa.
 *   4. Persiste la sesión en su DB y registra el evento en la outbox
 *      DENTRO DE LA MISMA TRANSACCIÓN (Transactional Outbox).
 *   5. Devuelve al cliente un payload combinado con datos de los 3 servicios.
 *
 * Patrón Transactional Outbox:
 *   El evento "session.started" NO se publica directamente a RabbitMQ.
 *   Se inserta en la tabla outbox_events en la misma transacción que
 *   la sesión. Un worker aparte (php artisan outbox:publish) lo lee y
 *   publica al broker con retry. Esto garantiza at-least-once SIN
 *   acoplar la disponibilidad de Pair Programming a la del broker.
 */
class SessionController extends Controller
{
    public function __construct(private EditorClient $editor) {}

    /**
     * GET /sessions/health
     *
     * Endpoint de health check. Se usa desde el docker-compose healthcheck.
     * No requiere autenticación.
     */
    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'service' => 'pair-programming',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * POST /sessions/start
     *
     * Inicia una nueva sesión de pair programming (Aggregator).
     *
     * Headers:  Authorization: Bearer <JWT>
     * Body:     { "exercise_id": int (opcional) }
     *
     * Returns:
     *   201 Created
     *   {
     *     "session": { "id", "status", "started_at", "editor_url" },
     *     "exercise": { "id", "title", "statement", "difficulty", "initial_code" },
     *     "host": { "id", "name", "email" }
     *   }
     */
    public function start(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user');

        // 1. Seleccionar ejercicio (por ID si vino, random si no)
        $exerciseId = $request->input('exercise_id');
        $exercise = $exerciseId
            ? Exercise::find($exerciseId)
            : Exercise::inRandomOrder()->first();

        if (! $exercise) {
            return response()->json([
                'error' => 'exercise_not_found',
                'message' => $exerciseId
                    ? "Exercise {$exerciseId} does not exist"
                    : 'No exercises available in the catalog',
            ], 404);
        }

        // 2. Generar UUID anticipado (lo necesitamos antes de persistir
        //    para pasárselo al Editor y poder referenciarlo en outbox)
        $sessionId = (string) \Illuminate\Support\Str::uuid();

        // 3. Llamar al Editor para crear room (FUERA de la transacción DB)
        //    Si el Editor falla, NO entramos en transacción y NO contaminamos DB.
        try {
            $room = $this->editor->createRoom($sessionId);
        } catch (\RuntimeException $e) {
            Log::error('Aggregator: Editor unreachable', [
                'sessionId' => $sessionId,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'error' => 'editor_unavailable',
                'message' => 'Editor service is not responding. Try again in a moment.',
            ], 503);
        }

        // 4. Persistir Session + OutboxEvent en UNA SOLA transacción atómica
        $session = DB::transaction(function () use ($sessionId, $exercise, $user, $room) {
            $session = Session::create([
                'id'              => $sessionId,
                'exercise_id'     => $exercise->id,
                'host_user_id'    => $user['id'],
                'status'          => 'active',
                'editor_room_id'  => $room['roomId'],
                'editor_url'      => $room['editorUrl'],
                'started_at'      => now(),
            ]);

            // Patrón Transactional Outbox: el evento entra en la MISMA
            // transacción que la entidad. Si DB::commit falla, ni la
            // sesión ni el evento existen. Si commit OK, los dos existen.
            OutboxEvent::create([
                'aggregate_type' => 'Session',
                'aggregate_id'   => $session->id,
                'event_type'     => 'session.started',
                'payload'        => [
                    'sessionId'    => $session->id,
                    'exerciseId'   => $exercise->id,
                    'exerciseTitle'=> $exercise->title,
                    'hostUserId'   => $user['id'],
                    'hostName'     => $user['name'],
                    'editorRoomId' => $room['roomId'],
                    'startedAt'    => $session->started_at->toIso8601String(),
                ],
            ]);

            return $session;
        });

        Log::info('Aggregator: Session started', [
            'sessionId' => $session->id,
            'exerciseId' => $exercise->id,
            'hostUserId' => $user['id'],
        ]);

        // 5. Respuesta del Aggregator: combina datos de los 3 servicios
        return response()->json([
            'session' => [
                'id'         => $session->id,
                'status'     => $session->status,
                'started_at' => $session->started_at->toIso8601String(),
                'editor_url' => $session->editor_url,
            ],
            'exercise' => [
                'id'           => $exercise->id,
                'title'        => $exercise->title,
                'statement'    => $exercise->statement,
                'difficulty'   => $exercise->difficulty,
                'language'     => $exercise->language,
                'initial_code' => $exercise->initial_code,
            ],
            'host' => [
                'id'    => $user['id'],
                'name'  => $user['name'],
                'email' => $user['email'],
            ],
        ], 201);
    }
}
