#!/bin/bash

docker-compose run certbot renew --webroot --webroot-path=/var/www/certbot
docker-compose exec nginx nginx -s reload
