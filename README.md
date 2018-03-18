
# redisclustercompose

Redis Cluster via Docker Compose with --scale capability using Redis 4's new NAT/port-forwarding support. 
Reddie is included so you can check out your new cluster!

## Requirements

Docker and Docker Compose installed.

## Usage

Choose a number of nodes for the cluster (at least 6)

**Launch cluster**

    docker-compose up -d --scale redis=9
    docker-compose logs -f
    
It takes a little while.
    
**Remove containers**

    docker-compose rm -f
    
**Run multiple clusters**

    COMPOSE_PROJECT_NAME=cluster1 docker-compose up -d --scale redis=6
    COMPOSE_PROJECT_NAME=cluster2 docker-compose up -d --scale redis=6
    COMPOSE_PROJECT_NAME=cluster3 docker-compose up -d --scale redis=6
    
**Cleanup multiple clusters**

    COMPOSE_PROJECT_NAME=cluster1 docker-compose kill && COMPOSE_PROJECT_NAME=cluster1 docker-compose rm -f 
    COMPOSE_PROJECT_NAME=cluster2 docker-compose kill && COMPOSE_PROJECT_NAME=cluster2 docker-compose rm -f
    COMPOSE_PROJECT_NAME=cluster3 docker-compose kill && COMPOSE_PROJECT_NAME=cluster3 docker-compose rm -f
        
**Using Reddie**

Navigate to `https://localhost` to access Reddie.
