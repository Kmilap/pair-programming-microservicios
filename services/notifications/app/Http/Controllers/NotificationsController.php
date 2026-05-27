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
