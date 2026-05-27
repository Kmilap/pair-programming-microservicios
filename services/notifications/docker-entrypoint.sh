#!/bin/sh
set -e

echo "============================================"
echo "  Notifications Microservice — Starting"
echo "============================================"

# Esperar a que RabbitMQ esté disponible
echo "[notifications] Waiting for RabbitMQ at ${RABBITMQ_HOST:-rabbitmq}:${RABBITMQ_PORT:-5672}..."
until php -r "
\$conn = @fsockopen('${RABBITMQ_HOST:-rabbitmq}', ${RABBITMQ_PORT:-5672}, \$errno, \$errstr, 5);
if (\$conn) { fclose(\$conn); exit(0); }
exit(1);
" 2>/dev/null; do
    echo "[notifications] RabbitMQ not ready — retrying in 3s..."
    sleep 3
done
echo "[notifications] RabbitMQ ready ✓"

# Crear SQLite si no existe
touch /var/www/html/database/database.sqlite
echo "[notifications] SQLite database ready ✓"

# Ejecutar migraciones
echo "[notifications] Running migrations..."
php artisan migrate --force --no-interaction
echo "[notifications] Migrations done ✓"

echo "============================================"
echo "  Notifications ready — supervisord starting"
echo "============================================"

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
