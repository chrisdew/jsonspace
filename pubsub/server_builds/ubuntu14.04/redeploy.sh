#!/bin/bash

# exit immediately on any error
set -e

# sanity checks
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <ip_address>"
fi

USER="root";
MACHINE=$1

# install pubsub
ssh $USER@$MACHINE "mkdir -p /srv/node_modules ; mkdir -p /var/log/pubsub"
scp ./upstart/pubsub.conf ./upstart/pushserver.conf $USER@$MACHINE:/etc/init/
scp ../../etc/$MACHINE/pubsub.json ../../etc/$MACHINE/pushserver.json $USER@$MACHINE:/etc/
ssh $USER@$MACHINE "if ( status pubsub | grep start ); then stop pubsub ; fi"
rsync -avz -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ../../../pubsub $USER@$MACHINE:/srv/node_modules/
rsync -avz -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ../../../jsonspace $USER@$MACHINE:/srv/node_modules/
ssh $USER@$MACHINE "cd /srv/node_modules ; rm -f pubsub/node_modules/jsonspace ; start pubsub"

