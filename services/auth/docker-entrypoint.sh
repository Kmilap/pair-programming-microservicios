#!/bin/sh
set -e

echo "============================================"
echo "  Auth Microservice — Starting up"
echo "============================================"

# Esperar a que PostgreSQL esté listo
echo "[Auth] Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until php -r "try { new PDO('pgsql:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}', '${DB_USERNAME}', '${DB_PASSWORD}'); echo 'OK'; } catch(Exception \$e) { exit(1); }" 2>/dev/null; do
    echo "[Auth] PostgreSQL is unavailable - sleeping 2s"
    sleep 2
done
echo "[Auth] PostgreSQL is ready ✓"

# Ejecutar migraciones (si hay pendientes)
echo "[Auth] Running migrations..."
php artisan migrate --force --no-interaction

# Seedear usuarios de prueba si la tabla está vacía
echo "[Auth] Seeding test users (if empty)..."
php artisan db:seed --force --no-interaction || echo "[Auth] Seed skipped (users may already exist)"

# Cache de configuración para mejor performance
php artisan config:cache
php artisan route:cache

echo "============================================"
echo "  Auth ready — Listening on :8000"
echo "============================================"

# Pasar el control al CMD del Dockerfile
exec "$@"
