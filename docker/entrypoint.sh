#!/bin/sh
set -e

PORT_NUM=${PORT:-80}

# Update Nginx config with Render's assigned dynamic PORT
if [ -f /etc/nginx/http.d/default.conf ]; then
    sed -i "s/listen [0-9]*;/listen ${PORT_NUM};/g" /etc/nginx/http.d/default.conf
fi

if [ -f /etc/nginx/conf.d/default.conf ]; then
    sed -i "s/listen [0-9]*;/listen ${PORT_NUM};/g" /etc/nginx/conf.d/default.conf
fi

# Pre-compile Laravel caches for instant page loads
php /var/www/html/artisan config:cache || true
php /var/www/html/artisan route:cache || true
php /var/www/html/artisan view:cache || true

exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf