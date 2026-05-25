<?php

namespace App\Services;

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Channel\AMQPChannel;
use PhpAmqpLib\Message\AMQPMessage;
use PhpAmqpLib\Exception\AMQPRuntimeException;
use Illuminate\Support\Facades\Log;

/**
 * RabbitMQPublisher — Cliente AMQP para publicar eventos del dominio.
 *
 * Publica al exchange "pair_programming.events" (tipo topic) usando
 * el event_type como routing key (ej: "session.started").
 *
 * Mensajes durables: sobreviven reinicio del broker.
 * Exchange durable: persiste su definición entre reinicios.
 *
 * Uso típico desde el worker:
 *   $publisher = new RabbitMQPublisher();
 *   $publisher->publish('session.started', ['sessionId' => '...', ...]);
 *   $publisher->close();
 */
class RabbitMQPublisher
{
    private const EXCHANGE = 'pair_programming.events';
    private const EXCHANGE_TYPE = 'topic';

    private ?AMQPStreamConnection $connection = null;
    private ?AMQPChannel $channel = null;

    public function __construct(
        private string $host = '',
        private int    $port = 0,
        private string $user = '',
        private string $password = '',
    ) {
        // Lee de config si no se pasaron explícitos
        $this->host     = $host     ?: env('RABBITMQ_HOST', 'rabbitmq');
        $this->port     = $port     ?: (int) env('RABBITMQ_PORT', 5672);
        $this->user     = $user     ?: env('RABBITMQ_USER', 'guest');
        $this->password = $password ?: env('RABBITMQ_PASSWORD', 'guest');
    }

    /**
     * Establece conexión y declara el exchange.
     * Idempotente: si ya está conectado, no hace nada.
     */
    public function connect(): void
    {
        if ($this->connection && $this->connection->isConnected()) {
            return;
        }

        $this->connection = new AMQPStreamConnection(
            host: $this->host,
            port: $this->port,
            user: $this->user,
            password: $this->password,
            connection_timeout: 5.0,
            read_write_timeout: 5.0,
        );

        $this->channel = $this->connection->channel();

        // Declarar exchange (idempotente — si ya existe, no falla)
        $this->channel->exchange_declare(
            exchange: self::EXCHANGE,
            type: self::EXCHANGE_TYPE,
            passive: false,
            durable: true,    // persiste reinicios del broker
            auto_delete: false,
        );

        Log::info('RabbitMQPublisher connected', [
            'host' => $this->host,
            'exchange' => self::EXCHANGE,
        ]);
    }

    /**
     * Publica un evento al exchange.
     *
     * @param string $routingKey  Ej: 'session.started'
     * @param array  $payload     Estructura libre, se serializa a JSON
     * @throws AMQPRuntimeException si el publish falla
     */
    public function publish(string $routingKey, array $payload): void
    {
        $this->connect();

        $message = new AMQPMessage(
            body: json_encode($payload, JSON_THROW_ON_ERROR),
            properties: [
                'content_type'  => 'application/json',
                'delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT, // sobrevive reinicios
                'timestamp'     => time(),
                'message_id'    => uniqid('msg_', true),
            ],
        );

        $this->channel->basic_publish(
            msg: $message,
            exchange: self::EXCHANGE,
            routing_key: $routingKey,
        );
    }

    /**
     * Cierra conexión limpiamente.
     */
    public function close(): void
    {
        try {
            $this->channel?->close();
            $this->connection?->close();
        } catch (\Throwable $e) {
            Log::warning('RabbitMQPublisher close failed', ['error' => $e->getMessage()]);
        }

        $this->channel = null;
        $this->connection = null;
    }

    public function __destruct()
    {
        $this->close();
    }
}
