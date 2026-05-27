<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationsController extends Controller
{
    /**
     * GET /notifications?userId=X
     * Lista las últimas 20 notificaciones del usuario, más recientes primero.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->query('userId');

        if (!$userId) {
            return response()->json(['error' => 'userId is required'], 400);
        }

        $notifications = Notification::where('user_id', (int) $userId)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(fn (Notification $n) => [
                'id'         => $n->id,
                'type'       => $n->type,
                'payload'    => json_decode($n->payload, true),
                'read_at'    => $n->read_at?->toIso8601String(),
                'created_at' => $n->created_at->toIso8601String(),
            ]);

        return response()->json($notifications);
    }

    /**
     * PATCH /notifications/{id}/read
     * Marca una notificación como leída.
     */
    public function markRead(int $id): JsonResponse
    {
        $notification = Notification::find($id);

        if (!$notification) {
            return response()->json(['error' => 'Notification not found'], 404);
        }

        $notification->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    /**
     * DELETE /notifications/{id}
     * Borra una notificación específica del usuario.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $userId = (int) $request->query('userId');

        if (!$userId) {
            return response()->json(['message' => 'userId required'], 422);
        }

        $notification = Notification::where('id', $id)
            ->where('user_id', $userId)
            ->first();

        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $notification->delete();

        return response()->json(['message' => 'Notification deleted'], 200);
    }

    /**
     * PATCH /notifications/read-all
     * Marca todas las notificaciones no leídas del usuario como leídas.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $userId = (int) $request->query('userId');

        if (!$userId) {
            return response()->json(['message' => 'userId required'], 422);
        }

        $count = Notification::where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'message' => 'All notifications marked as read',
            'count'   => $count,
        ], 200);
    }

    /**
     * DELETE /notifications/clear-all
     * Borra todas las notificaciones del usuario.
     */
    public function clearAll(Request $request): JsonResponse
    {
        $userId = (int) $request->query('userId');

        if (!$userId) {
            return response()->json(['message' => 'userId required'], 422);
        }

        $count = Notification::where('user_id', $userId)->delete();

        return response()->json([
            'message' => 'All notifications cleared',
            'count'   => $count,
        ], 200);
    }

    /**
     * GET /notifications/health
     */
    public function health(): JsonResponse
    {
        return response()->json([
            'status'    => 'ok',
            'service'   => 'notifications',
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
