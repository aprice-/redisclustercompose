#!/bin/sh
set -e

gateway=$(/sbin/ip route|awk '/default/ { print $3 }')

network_info=$(curl -s http://${gateway}:3000/$(hostname))

cluster_announce_ip=$(echo ${network_info} | cut -d ':' -f 1)

ports=$(echo ${network_info} | cut -d ':' -f 2)
cluster_announce_port=$(echo ${ports} | cut -d '@' -f 1)
cluster_announce_bus_port=$(echo ${ports} | cut -d '@' -f 2)

# first arg is `-f` or `--some-option`
# or first arg is `something.conf`
if [ "${1#-}" != "$1" ] || [ "${1%.conf}" != "$1" ]; then
	set -- redis-server "$@" "--cluster-announce-port ${cluster_announce_port}" "--cluster-announce-bus-port ${cluster_announce_bus_port}" "--cluster-announce-ip ${cluster_announce_ip}"
fi

# allow the container to be started with `--user`
if [ "$1" = 'redis-server' -a "$(id -u)" = '0' ]; then
	chown -R redis .
	exec su-exec redis "$0" "$@"
fi

echo "exec \"$@\""

exec "$@"