#!/bin/sh
set -e

gateway=$(/sbin/ip route|awk '/default/ { print $3 }')

new_address=$(curl -s "http://${gateway}:3000/network-info/$(hostname)")

cluster_announce_ip=$(echo "${new_address}" | cut -d ':' -f 1)

ports=$(echo "${new_address}" | cut -d ':' -f 2)
cluster_announce_port=$(echo "${ports}" | cut -d '@' -f 1)
cluster_announce_bus_port=$(echo "${ports}" | cut -d '@' -f 2)

# Rewrite redis.conf with updated networking information
sed -i "s/cluster-announce-ip.*/cluster-announce-ip ${cluster_announce_ip}/g" /usr/local/etc/redis/redis.conf;
sed -i "s/cluster-announce-port.*/cluster-announce-port ${cluster_announce_port}/g" /usr/local/etc/redis/redis.conf;
sed -i "s/cluster-announce-bus-port.*/cluster-announce-bus-port ${cluster_announce_bus_port}/g" /usr/local/etc/redis/redis.conf;

nodes_conf="/data/nodes.conf"

# Look for a nodes.conf that needs rewriting
if [ -f "${nodes_conf}" ]; then

    # Find this node's own redis ID
    my_id=$(cat "${nodes_conf}" | grep myself | cut -d ' ' -f 1)
    old_address=$(cat "${nodes_conf}" | grep myself | cut -d ' ' -f 2)

    # Save this node's redis ID and networking information in the discovery service
    curl -s -X POST -d "${new_address}" -H "Content-Type: text/plain" "http://${gateway}:3000/history/${my_id}/${old_address}"

    # Rewrite each line in nodes.conf
    while read x; do

        # Parse out peer's redis ID
        peer_id=$(echo "${x}" | cut -d ' ' -f 1)
        peer_address=$(echo "${x}" | cut -d ' ' -f 2)

        # Skip vars section
        if [[ "${peer_id}" == "vars" ]] ;
        then
            continue
        fi

        # Retrieve new networking information for peer
        new_node_address=$(curl -s "http://${gateway}:3000/history/${peer_id}/${peer_address}")

        # Rewrite nodes.conf
        sed -i "s/${peer_id} [0-9.:@]\+/${peer_id} ${new_node_address}/g" "$nodes_conf";

    done < "${nodes_conf}"
fi


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


exec "$@"