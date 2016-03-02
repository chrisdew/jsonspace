#!/bin/bash

# exit immediately on any error
set -e

ssh root@45.79.6.86 "if ( status pubsub | grep start ); then stop pubsub ; fi ; if ( status pushserver | grep start ); then stop pushserver ; fi"
ssh root@106.186.121.210 "if ( status pubsub | grep start ); then stop pubsub ; fi ; if ( status pushserver | grep start ); then stop pushserver ; fi"
./redeploy.sh 45.79.6.86
./redeploy.sh 106.186.121.210