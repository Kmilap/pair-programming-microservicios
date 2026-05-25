<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

/**
 * EditorClient — Gateway para el microservicio Editor Colaborativo.
 *
 * Día 3: el Editor está en modo stub (responde POST /editor/rooms
 * con un payload fake). Día 4 se reemplaza por Yjs + WebSocket sin
 * cambiar este contrato HTTP.
 *
 * El timeout es agresivo (5s) porque el Editor está en la misma red
 * Docker — cualquier latencia mayor indica un problema, no congestión
 * real de red.
 */
class EditorClient
{
    private Client $http;
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = config('services.editor.url', env('EDITOR_SERVICE_URL', 'http://editor:3000'));

        $this->http = new Client([
            'base_uri' => $this->baseUrl,
            'timeout'  => 5.0,
            'connect_timeout' => 2.0,
            'http_errors' => false,  // no lanzar excepciones por 4xx/5xx, las manejamos manualmente
        ]);
    }

    /**
     * Crea una nueva sala colaborativa para una sesión.
     *
     * @param string $sessionId UUID de la sesión que se está creando
     * @return array{roomId: string, editorUrl: string, createdAt: string}
     * @throws \RuntimeException si el Editor responde con error o está caído
     */
    public function createRoom(string $sessionId): array
    {
        try {
            $response = $this->http->post('/editor/rooms', [
                'json' => ['sessionId' => $sessionId],
            ]);

            $status = $response->getStatusCode();
            $body = $response->getBody()->getContents();

            if ($status < 200 || $status >= 300) {
                Log::error('Editor returned non-2xx', [
                    'status' => $status,
                    'body' => $body,
                    'sessionId' => $sessionId,
                ]);
                throw new \RuntimeException("Editor returned HTTP {$status}");
            }

            $data = json_decode($body, true, flags: JSON_THROW_ON_ERROR);

            // Validamos shape mínimo para fallar rápido si Editor cambia su contrato
            if (! isset($data['roomId'], $data['editorUrl'])) {
                throw new \RuntimeException('Editor response missing required fields');
            }

            return $data;

        } catch (GuzzleException $e) {
            Log::error('Editor unreachable', [
                'error' => $e->getMessage(),
                'sessionId' => $sessionId,
            ]);
            throw new \RuntimeException("Editor service unreachable: " . $e->getMessage(), 0, $e);
        }
    }
}
