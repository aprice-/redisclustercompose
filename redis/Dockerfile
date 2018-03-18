FROM redis:alpine

RUN apk add --no-cache curl

COPY docker-entrypoint.sh /usr/local/bin/

COPY redis.conf /usr/local/etc/redis/redis.conf
RUN chown -R redis:redis /usr/local/etc/redis

CMD [ "redis-server", "/usr/local/etc/redis/redis.conf" ]