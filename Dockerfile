FROM php:8.2-cli

RUN docker-php-ext-install mysqli

WORKDIR /var/www/html
COPY . /var/www/html/

COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
