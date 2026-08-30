FROM php:8.3-cli-alpine

# Install system dependencies, PostgreSQL extensions, and performance libraries
RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip gd pcntl bcmath opcache

# Configure OPcache for ultra-fast in-memory execution (including CLI workers)
RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.enable_cli=1'; \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=16'; \
    echo 'opcache.max_accelerated_files=10000'; \
    echo 'opcache.revalidate_freq=0'; \
    echo 'opcache.validate_timestamps=0'; \
} > /usr/local/etc/php/conf.d/opcache-recommended.ini

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . /app

# Install dependencies without dev packages and optimize autoloader
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set full storage permissions
RUN chmod -R 777 /app/storage /app/bootstrap/cache

# Expose all possible Render ports
EXPOSE 80 8000 10000

# Set 8 concurrent workers for fast parallel asset loading
ENV PHP_CLI_SERVER_WORKERS=8

# Start multi-worker server directly on Render's assigned $PORT
CMD php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}