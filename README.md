
# redisclustercompose

Redis Cluster via Docker Compose with --scale capability using Redis 4's new NAT/port-forwarding support. 
Reddie is included so you can check out your new cluster!

## Requirements

Docker and Docker Compose installed.

## Usage

Choose a number of nodes for the cluster (at least 6)

**Launch cluster**

    docker-compose up -d --scale redis=9
    
**Remove containers**

    docker-compose rm -f
    
View your cluster with Reddie at `https://localhost`.
    
