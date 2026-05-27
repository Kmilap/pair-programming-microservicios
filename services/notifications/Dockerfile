# ============================================================
# Dockerfile — Microservicio Notifications (Laravel 12 + PHP 8.3)
# Patrón Choreography: Consumer RabbitMQ + API HTTP
# Usa supervisord para gestionar PHP server + artisan worker.
# ============================================================

FROM php:8.3-cli-alpine

# Dependencias del sistema
RUN apk add --no-cache \
        bash \
        curl \
        git \
        unzip \
        sqlite-dev \
        libzip-dev \
        oniguruma-dev \
        linux-headers \
        autoconf \
        gcc \
        g++ \
        make \
        supervisor \
    && docker-php-ext-install \
        pdo \
        pdo_sqlite \
        mbstring \
        zip \
        bcmath \
        sockets \
        pcntl \
    && apk del autoconf gcc g++ make

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Instalar dependencias primero (aprovecha cache de capas)
COPY composer.json composer.lock* ./
RUN composer install --no-scripts --no-autoloader --prefer-dist --no-interaction

# Copiar código
COPY . .

# Directorios primero — composer dump-autoload necesita bootstrap/cache
RUN mkdir -p storage/framework/{cache,sessions,views} \
               storage/logs \
               bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && touch database/database.sqlite \
    && composer dump-autoload --optimize

# Supervisord config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Entrypoint
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]
