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
use Illuminate\Support\Str;

class SessionController extends Controller
{
    public function __construct(private EditorClient $editor) {}

    // GET /sessions/health
    public function health(): JsonResponse
    {
        return response()->json([
            'status'    => 'ok',
            'service'   => 'pair-programming',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    // GET /sessions
    public function index(Request $request): JsonResponse
    {
        $user  = $request->attributes->get('user');
        $query = Session::with('exercise');

        // Teachers see every session; students only see their own
        if ($user['role'] !== 'teacher') {
            $query->where(function ($q) use ($user) {
                $q->where('host_user_id', $user['id'])
                  ->orWhere('partner_user_id', $user['id']);
            });
        }

        if ($request->query('status')) {
            $query->where('status', $request->query('status'));
        }

        $sessions = $query->orderBy('started_at', 'desc')->get();

        return response()->json($sessions->map(fn ($s) => [
            'id'               => $s->id,
            'status'           => $s->status,
            'started_at'       => $s->started_at?->toIso8601String(),
            'ended_at'         => $s->ended_at?->toIso8601String(),
            'editor_room_id'   => $s->editor_room_id,
            'editor_url'       => $s->editor_url,
            'host_user_id'     => $s->host_user_id,
            'partner_user_id'  => $s->partner_user_id,
            'exercise' => $s->exercise ? [
                'id'         => $s->exercise->id,
                'title'      => $s->exercise->title,
                'difficulty' => $s->exercise->difficulty,
                'language'   => $s->exercise->language,
                'statement'  => $s->exercise->statement,
                'initial_code' => $s->exercise->initial_code,
            ] : null,
        ]));
    }

    // GET /sessions/{id}
    public function show(Request $request, string $id): JsonResponse
    {
        $user    = $request->attributes->get('user');
        $session = Session::with('exercise')->find($id);

        if (! $session) {
            return response()->json(['error' => 'not_found'], 404);
        }

        if ($user['role'] !== 'teacher'
            && $session->host_user_id !== $user['id']
            && $session->partner_user_id !== $user['id']) {
            return response()->json(['error' => 'forbidden'], 403);
        }

        return response()->json([
            'id'               => $session->id,
            'status'           => $session->status,
            'started_at'       => $session->started_at?->toIso8601String(),
            'ended_at'         => $session->ended_at?->toIso8601String(),
            'editor_room_id'   => $session->editor_room_id,
            'editor_url'       => $session->editor_url,
            'host_user_id'     => $session->host_user_id,
            'partner_user_id'  => $session->partner_user_id,
            'exercise' => $session->exercise ? [
                'id'           => $session->exercise->id,
                'title'        => $session->exercise->title,
                'difficulty'   => $session->exercise->difficulty,
                'language'     => $session->exercise->language,
                'statement'    => $session->exercise->statement,
                'initial_code' => $session->exercise->initial_code,
            ] : null,
        ]);
    }

    // POST /sessions/start — Aggregator
    public function start(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user');

        $exerciseId = $request->input('exercise_id');
        $exercise = $exerciseId
            ? Exercise::find($exerciseId)
            : Exercise::inRandomOrder()->first();

        if (! $exercise) {
            return response()->json([
                'error'   => 'exercise_not_found',
                'message' => $exerciseId
                    ? "Exercise {$exerciseId} does not exist"
                    : 'No exercises available in the catalog',
            ], 404);
        }

        $sessionId = (string) \Illuminate\Support\Str::uuid();

        try {
            $room = $this->editor->createRoom($sessionId);
        } catch (\RuntimeException $e) {
            Log::error('Aggregator: Editor unreachable', ['sessionId' => $sessionId, 'error' => $e->getMessage()]);
            return response()->json([
                'error'   => 'editor_unavailable',
                'message' => 'Editor service is not responding. Try again in a moment.',
            ], 503);
        }

        $session = DB::transaction(function () use ($sessionId, $exercise, $user, $room) {
            $session = Session::create([
                'id'             => $sessionId,
                'exercise_id'    => $exercise->id,
                'host_user_id'   => $user['id'],
                'status'         => 'active',
                'editor_room_id' => $room['roomId'],
                'editor_url'     => $room['editorUrl'],
                'started_at'     => now(),
            ]);

            OutboxEvent::create([
                'aggregate_type' => 'Session',
                'aggregate_id'   => $session->id,
                'event_type'     => 'session.started',
                'payload'        => [
                    'sessionId'     => $session->id,
                    'exerciseId'    => $exercise->id,
                    'exerciseTitle' => $exercise->title,
                    'hostUserId'    => $user['id'],
                    'hostName'      => $user['name'],
                    'editorRoomId'  => $room['roomId'],
                    'startedAt'     => $session->started_at->toIso8601String(),
                ],
            ]);

            return $session;
        });

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

    // POST /sessions/{id}/join
    public function join(Request $request, string $id): JsonResponse
    {
        $user    = $request->attributes->get('user');
        $session = Session::with('exercise')->find($id);

        if (! $session) {
            return response()->json(['error' => 'not_found'], 404);
        }

        if ($session->status !== 'active') {
            return response()->json(['error' => 'session_not_active', 'message' => 'Only active sessions can be joined.'], 400);
        }

        // El host no puede "unirse" a su propia sesión
        if ((int) $session->host_user_id === (int) $user['id']) {
            return response()->json([
                'message' => 'You are the host of this session',
                'session' => $this->serializeSession($session),
            ], 200);
        }

        // Si ya hay partner y NO es el usuario actual, conflicto
        if ($session->partner_user_id && (int) $session->partner_user_id !== (int) $user['id']) {
            return response()->json(['error' => 'session_full', 'message' => 'Session already has a partner.'], 409);
        }

        // Idempotente: si ya es partner, devolver sin re-emitir evento
        if ((int) $session->partner_user_id === (int) $user['id']) {
            return response()->json([
                'message' => 'Already joined',
                'session' => $this->serializeSession($session),
            ], 200);
        }

        DB::transaction(function () use ($session, $user) {
            $session->partner_user_id = $user['id'];
            $session->save();

            OutboxEvent::create([
                'aggregate_type' => 'Session',
                'aggregate_id'   => $session->id,
                'event_type'     => 'session.joined',
                'payload'        => [
                    'sessionId'     => $session->id,
                    'hostUserId'    => $session->host_user_id,
                    'partnerUserId' => $user['id'],
                    'partnerName'   => $user['name'] ?? 'Estudiante',
                    'exerciseTitle' => $session->exercise?->title ?? 'Ejercicio',
                    'editorRoomId'  => $session->editor_room_id,
                    'joinedAt'      => now()->toIso8601String(),
                ],
            ]);
        });

        return response()->json([
            'message' => 'Joined successfully',
            'session' => $this->serializeSession($session->fresh()),
        ], 200);
    }

    private function serializeSession(Session $s): array
    {
        return [
            'id'              => $s->id,
            'status'          => $s->status,
            'started_at'      => $s->started_at?->toIso8601String(),
            'ended_at'        => $s->ended_at?->toIso8601String(),
            'editor_room_id'  => $s->editor_room_id,
            'editor_url'      => $s->editor_url,
            'host_user_id'    => $s->host_user_id,
            'partner_user_id' => $s->partner_user_id,
            'exercise' => $s->exercise ? [
                'id'           => $s->exercise->id,
                'title'        => $s->exercise->title,
                'difficulty'   => $s->exercise->difficulty,
                'language'     => $s->exercise->language,
                'statement'    => $s->exercise->statement,
                'initial_code' => $s->exercise->initial_code,
            ] : null,
        ];
    }

    // POST /sessions/{id}/end
    public function end(Request $request, string $id): JsonResponse
    {
        $user    = $request->attributes->get('user');
        $session = Session::with('exercise')->find($id);

        if (! $session) {
            return response()->json(['error' => 'not_found'], 404);
        }

        if ($session->host_user_id !== $user['id']
            && $session->partner_user_id !== $user['id']
            && $user['role'] !== 'teacher') {
            return response()->json(['error' => 'forbidden'], 403);
        }

        if ($session->status === 'ended') {
            return response()->json(['status' => 'already_ended', 'session_id' => $id]);
        }

        DB::transaction(function () use ($session, $user) {
            $session->update(['status' => 'ended', 'ended_at' => now()]);

            OutboxEvent::create([
                'aggregate_type' => 'Session',
                'aggregate_id'   => $session->id,
                'event_type'     => 'session.ended',
                'payload'        => [
                    'sessionId'      => $session->id,
                    'exerciseId'     => $session->exercise_id,
                    'exerciseTitle'  => $session->exercise?->title,
                    'hostUserId'     => $session->host_user_id,
                    'partnerUserId'  => $session->partner_user_id,
                    'editorRoomId'   => $session->editor_room_id,
                    'endedAt'        => now()->toIso8601String(),
                    'endedBy'        => $user['id'],
                ],
            ]);
        });

        Log::info('Session ended', ['sessionId' => $session->id, 'endedBy' => $user['id']]);

        return response()->json(['status' => 'ended', 'session_id' => $id, 'ended_at' => $session->fresh()->ended_at?->toIso8601String()]);
    }

    // DELETE /sessions/{id}
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user    = $request->attributes->get('user');
        $session = Session::find($id);

        if (! $session) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        // Solo el host puede borrar su propia sesión
        if ((int) $session->host_user_id !== (int) $user['id']) {
            return response()->json(['message' => 'Only the session host can delete this session'], 403);
        }

        $session->delete(); // soft delete: setea deleted_at

        return response()->json(['message' => 'Session deleted', 'id' => $id], 200);
    }
}
