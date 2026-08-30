FROM php:8.3-fpm-alpine

# Install Nginx, Supervisor, PostgreSQL extensions, and performance libraries
RUN apk add --no-cache \
    nginx \
    supervisor \
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

# Configure PHP OPcache for fast memory execution
RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=16'; \
    echo 'opcache.max_accelerated_files=10000'; \
    echo 'opcache.revalidate_freq=0'; \
    echo 'opcache.validate_timestamps=0'; \
} > /usr/local/etc/php/conf.d/opcache-recommended.ini

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . /var/www/html

# Install dependencies without dev packages and optimize autoloader
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Setup Nginx and Supervisor configuration
RUN mkdir -p /etc/nginx/http.d /etc/supervisor/conf.d /var/log/supervisor /run/nginx \
    && cp docker/nginx.conf /etc/nginx/http.d/default.conf \
    && cp docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf \
    && chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod +x /var/www/html/docker/entrypoint.sh

EXPOSE 80 8000 10000

CMD ["/var/www/html/docker/entrypoint.sh"]