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
scp ./upstart/pubsub.conf $USER@$MACHINE:/etc/init/
scp ../../etc/$MACHINE/pubsub_private.json $USER@$MACHINE:/etc/pubsub.json
scp ../../etc/apn_*.pem $USER@$MACHINE:/etc/
ssh $USER@$MACHINE "if ( status pubsub | grep start ); then stop pubsub ; fi"
rsync -avz -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ../../../pubsub $USER@$MACHINE:/srv/node_modules/
rsync -avz -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ../../../jsonspace $USER@$MACHINE:/srv/node_modules/
ssh $USER@$MACHINE "cd /srv/node_modules ; rm -f pubsub/node_modules/jsonspace ; start pubsub"

ssh $USER@$MACHINE rm -f /etc/nginx/sites-enabled/pubsub.jsonspace.com
ssh $USER@$MACHINE rm -f /etc/nginx/sites-available/pubsub.jsonspace.com
scp -rp nginx/sites-available $USER@$MACHINE:/etc/nginx/
ssh $USER@$MACHINE rm -f /etc/nginx/sites-enabled/pubsub.tourney.jsonspace.com
ssh $USER@$MACHINE ln -s /etc/nginx/sites-available/pubsub.tourney.jsonspace.com /etc/nginx/sites-enabled/
scp -rp nginx/srv/pubsub.tourney.jsonspace.com.* $USER@$MACHINE:/srv/