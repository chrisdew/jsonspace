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
ssh $USER@$MACHINE mkdir -p /srv/node_modules
ssh $USER@$MACHINE mkdir -p /var/log/pubsub
bash -c "cd ../../../ ; tar --dereference -czvf /tmp/pubsub.tgz pubsub"
scp /tmp/pubsub.tgz $USER@$MACHINE:/srv/node_modules/
scp ./upstart/pubsub.conf $USER@$MACHINE:/etc/init/
scp ../../etc/$MACHINE/pubsub.json $USER@$MACHINE:/etc/
ssh $USER@$MACHINE "if ( status pubsub | grep start ); then stop pubsub ; fi"
ssh $USER@$MACHINE rm -rf /srv/node_modules/pubsub
ssh $USER@$MACHINE "cd /srv/node_modules ; tar -xzvf pubsub.tgz"
ssh $USER@$MACHINE start pubsub

