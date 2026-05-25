# ============================================================
# Pair Programming Service - Laravel 12 + PHP 8.3
# ============================================================
# Mismo patrón que Auth: PHP-FPM Alpine + Composer + servidor
# embebido php -S para desarrollo (en producción real usaríamos
# nginx + php-fpm, pero para el sprint es overkill).
# ============================================================

FROM php:8.4-cli-alpine

# Dependencias del sistema necesarias para PostgreSQL y otras extensiones
RUN apk add --no-cache \
    git \
    curl \
    libpq-dev \
    libzip-dev \
    zip \
    unzip \
    oniguruma-dev \
    autoconf \
    g++ \
    make \
    linux-headers \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip bcmath sockets \
    && apk del autoconf g++ make linux-headers

# Composer desde imagen oficial (multi-stage)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copiamos composer.json primero para aprovechar cache de capas
COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-scripts --no-autoloader --prefer-dist

# Copiamos el resto del código
COPY . .

# Generamos el autoloader optimizado
RUN composer dump-autoload --optimize \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8000

# Arranque: migraciones automáticas + servidor embebido
CMD ["sh", "-c", "php artisan migrate --force && php artisan db:seed --force && php -S 0.0.0.0:8000 -t public"]
