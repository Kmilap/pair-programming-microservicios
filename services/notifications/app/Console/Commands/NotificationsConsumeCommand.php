<?php

namespace App\Console\Commands;

use App\Models\Notification;
use Illuminate\Console\Command;
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

/**
 * Choreography Consumer — escucha eventos de Pair Programming en RabbitMQ.
 *
 * Routing keys consumidas:
 *   session.started → persiste notificación para host y partner
 *   session.ended   → persiste notificación + dispara B5 (análisis IA)
 */
class NotificationsConsumeCommand extends Command
{
    protected $signature   = 'notifications:consume';
    protected $description = 'Consume RabbitMQ choreography events and persist notifications (B5 included)';

    private const EXCHANGE    = 'pair_programming.events';
    private const QUEUE_NAME  = 'notifications.queue';
    private const ROUTING_KEYS = ['session.started', 'session.ended'];

    public function handle(): int
    {
        $this->info('[notifications] Connecting to RabbitMQ at '
            . config('services.rabbitmq.host') . ':' . config('services.rabbitmq.port'));

        $connection = new AMQPStreamConnection(
            config('services.rabbitmq.host'),
            config('services.rabbitmq.port'),
            config('services.rabbitmq.user'),
            config('services.rabbitmq.password'),
            config('services.rabbitmq.vhost', '/'),
        );

        $channel = $connection->channel();

        // Declarar exchange topic (idempotente — lo crea si no existe)
        $channel->exchange_declare(self::EXCHANGE, 'topic', false, true, false);

        // Cola durable para que sobreviva reinicios de RabbitMQ
        $channel->queue_declare(self::QUEUE_NAME, false, true, false, false);

        // Bindings por routing key
        foreach (self::ROUTING_KEYS as $key) {
            $channel->queue_bind(self::QUEUE_NAME, self::EXCHANGE, $key);
            $this->info("[notifications] Bound queue to exchange with key: {$key}");
        }

        $this->info('[notifications] Waiting for events... (Ctrl+C to stop)');

        $callback = function (AMQPMessage $msg): void {
            $routingKey = $msg->getRoutingKey();
            $this->info("[notifications] Received: {$routingKey}");

            try {
                $payload = json_decode($msg->getBody(), true, 512, JSON_THROW_ON_ERROR);
            } catch (\JsonException $e) {
                $this->error("[notifications] Invalid JSON payload: {$e->getMessage()}");
                $msg->ack();
                return;
            }

            // Persistir notificación para el host
            $this->persistForUser($payload['hostUserId'] ?? null, $routingKey, $payload);

            // Persistir notificación para el partner (si existe)
            $this->persistForUser($payload['partnerUserId'] ?? null, $routingKey, $payload);

            // B5: análisis pedagógico al finalizar sesión
            if ($routingKey === 'session.ended') {
                $this->triggerB5Analysis($payload);
            }

            $msg->ack();
            $this->info("[notifications] Processed: {$routingKey}");
        };

        $channel->basic_qos(null, 1, false);
        $channel->basic_consume(self::QUEUE_NAME, '', false, false, false, false, $callback);

        while ($channel->is_consuming()) {
            $channel->wait();
        }

        $channel->close();
        $connection->close();

        return Command::SUCCESS;
    }

    // ─────────────────────────────────────────────────────────────

    private function persistForUser(?int $userId, string $type, array $payload): void
    {
        if (!$userId) {
            return;
        }

        Notification::create([
            'user_id' => $userId,
            'type'    => $type,
            'payload' => json_encode($payload),
        ]);
    }

    /**
     * B5 — Dispara el análisis pedagógico post-sesión.
     *
     * Flujo:
     *  1. Obtener código final del Editor (/editor/rooms/{id}/replay → total events)
     *  2. POST /ai/analyze con metadata de la sesión
     *  3. Persistir resultado como notificación tipo 'session_report'
     */
    private function triggerB5Analysis(array $payload): void
    {
        $this->info('[notifications] Triggering B5 post-session analysis...');

        $aiEngineUrl = config('services.ai_engine.url', 'http://ai-engine:8000');
        $editorUrl   = config('services.editor.url', 'http://editor:3000');

        // ── Paso 1: intentar obtener código del Editor ────────────────
        $sessionId = $payload['sessionId'] ?? null;
        $code      = '// Código no disponible para este análisis';

        if ($sessionId) {
            $replayUrl      = "{$editorUrl}/editor/rooms/{$sessionId}/replay";
            $replayResponse = @file_get_contents($replayUrl);

            if ($replayResponse) {
                $replayData = json_decode($replayResponse, true);
                $totalOps   = $replayData['total'] ?? 0;
                $code       = "// Sesión con {$totalOps} operaciones de edición registradas.\n"
                            . "// (Snapshot completo no disponible en análisis automático)";
                $this->info("[notifications] Got replay data: {$totalOps} events");
            }
        }

        // ── Paso 2: calcular duración ─────────────────────────────────
        $durationSeconds = 0;
        if (!empty($payload['endedAt']) && !empty($payload['startedAt'])) {
            $durationSeconds = max(0, strtotime($payload['endedAt']) - strtotime($payload['startedAt']));
        }

        // ── Paso 3: llamar al Motor de IA ─────────────────────────────
        $analyzePayload = json_encode([
            'sessionId'       => $sessionId ?? '',
            'exerciseTitle'   => $payload['exerciseTitle'] ?? 'Ejercicio de programación',
            'code'            => $code,
            'durationSeconds' => $durationSeconds,
        ]);

        $context = stream_context_create([
            'http' => [
                'method'        => 'POST',
                'header'        => "Content-Type: application/json\r\nAccept: application/json\r\n",
                'content'       => $analyzePayload,
                'timeout'       => 60,
                'ignore_errors' => true,
            ],
        ]);

        $response = @file_get_contents("{$aiEngineUrl}/ai/analyze", false, $context);

        if (!$response) {
            $this->warn('[notifications] B5: AI Engine did not respond — storing fallback report');
            $report = [
                'summary'       => 'El Motor de IA no estuvo disponible para generar el análisis. Circuit Breaker activo.',
                'code_quality'  => ['score' => 0, 'feedback' => 'No disponible'],
                'collaboration' => ['score' => 0, 'feedback' => 'No disponible'],
                'suggestions'   => [],
                'highlights'    => [],
                'source'        => 'fallback',
            ];
        } else {
            $report = json_decode($response, true) ?? [];
            $this->info('[notifications] B5: AI analysis received successfully');
        }

        // ── Paso 4: persistir reporte para el host ────────────────────
        $hostUserId = $payload['hostUserId'] ?? null;
        if ($hostUserId) {
            Notification::create([
                'user_id' => (int) $hostUserId,
                'type'    => 'session_report',
                'payload' => json_encode([
                    'sessionId'     => $sessionId,
                    'exerciseTitle' => $payload['exerciseTitle'] ?? 'Ejercicio',
                    'report'        => $report,
                ]),
            ]);
            $this->info("[notifications] B5 report stored for user {$hostUserId}");
        }
    }
}
