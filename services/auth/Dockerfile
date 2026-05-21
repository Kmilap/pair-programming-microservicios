# ============================================================
# Dockerfile — Microservicio Auth (Laravel 12 + PHP 8.3)
# ============================================================
# Imagen ligera basada en Alpine.
# Usa el servidor embebido de PHP (artisan serve) para simplicidad.
# En producción se reemplazaría por PHP-FPM + Nginx + opcache tuning.
# ============================================================

FROM php:8.3-cli-alpine

# Instalar dependencias del sistema y extensiones de PHP necesarias
RUN apk add --no-cache \
        bash \
        git \
        unzip \
        libzip-dev \
        oniguruma-dev \
        postgresql-dev \
        autoconf \
        gcc \
        g++ \
        make \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        pgsql \
        mbstring \
        zip \
        bcmath \
    && apk del autoconf gcc g++ make

# Copiar Composer desde la imagen oficial
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Directorio de trabajo dentro del contenedor
WORKDIR /var/www/html

# Copiar archivos del proyecto
# (Primero composer.json/lock para aprovechar cache de capas)
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --prefer-dist --no-interaction

# Copiar el resto del código
COPY . .

# Generar autoloader optimizado
# (Mantenemos dependencias dev porque Laravel auto-registra paquetes como
#  Pail/Sail en package:discover. En producción se haría multi-stage build
#  con --no-dev + purge de package-discover cache.)
RUN composer dump-autoload --optimize

# Permisos para storage y bootstrap/cache
RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Puerto interno donde escucha artisan serve
EXPOSE 8000

# Script de arranque
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public", "public/index.php"]
