#!/bin/sh
set -e

PORT_NUM="${PORT:-80}"
echo "Configuring Nginx to listen on port ${PORT_NUM}..."

sed -i "s/listen .*/listen ${PORT_NUM} default_server;/g" /etc/nginx/http.d/default.conf 2>/dev/null || true
sed -i "s/listen .*/listen ${PORT_NUM} default_server;/g" /etc/nginx/conf.d/default.conf 2>/dev/null || true

nginx -t

php /var/www/html/artisan config:cache || true
php /var/www/html/artisan route:cache || true
php /var/www/html/artisan view:cache || true

echo "Starting Supervisord..."
exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf