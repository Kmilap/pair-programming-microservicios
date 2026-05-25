<?php

namespace App\Console\Commands;

use App\Models\OutboxEvent;
use App\Services\RabbitMQPublisher;
use Illuminate\Console\Command;
use Throwable;

/**
 * OutboxPublishCommand — Worker del patrón Transactional Outbox.
 *
 * Cierra el ciclo del patrón: lee eventos pendientes de la tabla
 * outbox_events, los publica al broker, y los marca como publicados.
 *
 * Diseño:
 *  - Procesa en lotes (default 50) para no saturar memoria.
 *  - Si un evento falla, incrementa attempts y guarda last_error.
 *    Vuelve a intentar en el próximo ciclo (back-off implícito).
 *  - Si hay > 5 attempts, lo skipea para no bloquear la cola
 *    (el sysadmin lo revisa manualmente).
 *  - Reutiliza UNA conexión AMQP por ejecución (no abre/cierra
 *    por cada mensaje — caro).
 *
 * Uso:
 *   php artisan outbox:publish         (procesa una vez y termina)
 *   php artisan outbox:publish --loop  (corre en loop infinito)
 */
class OutboxPublishCommand extends Command
{
    protected $signature = 'outbox:publish
                            {--loop : Run continuously every 5 seconds}
                            {--batch=50 : Max events per batch}
                            {--max-attempts=5 : Skip events with more attempts}';

    protected $description = 'Publica eventos pendientes de la outbox al broker (Transactional Outbox worker)';

    public function handle(): int
    {
        $loop = (bool) $this->option('loop');
        $batchSize = (int) $this->option('batch');
        $maxAttempts = (int) $this->option('max-attempts');

        $publisher = new RabbitMQPublisher();

        try {
            $publisher->connect();
            $this->info('[outbox-worker] Connected to RabbitMQ');

            do {
                $count = $this->processBatch($publisher, $batchSize, $maxAttempts);

                if ($count > 0) {
                    $this->info("[outbox-worker] Published {$count} event(s)");
                }

                if ($loop) {
                    sleep(5);
                }
            } while ($loop);

            return self::SUCCESS;

        } catch (Throwable $e) {
            $this->error('[outbox-worker] Fatal error: ' . $e->getMessage());
            return self::FAILURE;

        } finally {
            $publisher->close();
        }
    }

    /**
     * Procesa un lote de eventos pendientes.
     * Devuelve cuántos se publicaron exitosamente.
     */
    private function processBatch(RabbitMQPublisher $publisher, int $batchSize, int $maxAttempts): int
    {
        $events = OutboxEvent::pending()
            ->where('attempts', '<', $maxAttempts)
            ->limit($batchSize)
            ->get();

        $published = 0;

        foreach ($events as $event) {
            try {
                $publisher->publish($event->event_type, $event->payload);
                $event->markPublished();
                $published++;
            } catch (Throwable $e) {
                $event->markFailed($e->getMessage());
                $this->warn("[outbox-worker] Event {$event->id} failed (attempt {$event->attempts}): {$e->getMessage()}");
            }
        }

        return $published;
    }
}
