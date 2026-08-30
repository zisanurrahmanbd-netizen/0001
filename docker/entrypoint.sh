#!/bin/sh
set -e

PORT_NUM=""
echo "Starting container on port ${PORT_NUM}..."

sed -i "s/listen [0-9]*;/listen ${PORT_NUM};/g" /etc/nginx/http.d/default.conf 2>/dev/null || true
sed -i "s/listen [0-9]*;/listen ${PORT_NUM};/g" /etc/nginx/conf.d/default.conf 2>/dev/null || true

php /var/www/html/artisan config:cache || true
php /var/www/html/artisan route:cache || true
php /var/www/html/artisan view:cache || true

exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf
