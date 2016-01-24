#!/bin/bash

# sanity checks
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <ip_address>"
fi

USER="root";
MACHINE=$1

# update
ssh $USER@$MACHINE apt-get -y update
ssh $USER@$MACHINE apt-get -y upgrade

# install nodejs
ssh $USER@$MACHINE wget https://nodejs.org/dist/v5.5.0/node-v5.5.0-linux-x64.tar.xz
ssh $USER@$MACHINE tar -xJvf node-v5.5.0-linux-x64.tar.xz
ssh $USER@$MACHINE "cd /usr/local && tar --strip-components 1 -xJvf /root/node-v5.5.0-linux-x64.tar.xz"
ssh $USER@$MACHINE node -v

# install nginx
ssh $USER@$MACHINE apt-get -y install nginx
scp -rp nginx/sites-available $USER@$MACHINE:/etc/nginx/
ssh $USER@$MACHINE ln -s /etc/nginx/sites-available/pubsub.jsonspace.com /etc/nginx/sites-enabled/
ssh $USER@$MACHINE mkdir -p /var/www
scp -rp www/pubsub.jsonspace.com $USER@$MACHINE:/var/www/
ssh $USER@$MACHINE /etc/init.d/nginx stop
ssh $USER@$MACHINE /etc/init.d/nginx start

# install pubsub
ssh $USER@$MACHINE mkdir /srv/node_modules
cp -a ../../../pubsub $USER@$MACHINE:/srv/node_modules
scp ./upstart/pubsub.conf $USER@$MACHINE:/etc/init
ssh $USER@$MACHINE stop pubsub
ssh $USER@$MACHINE start pubsub