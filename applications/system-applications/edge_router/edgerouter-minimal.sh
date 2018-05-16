#!/bin/bash

ERDIR=/home/jonk/KELLY/Projects/biot2/applications/system-applications/edge_router

DODAGLOG=/var/log/edgerouter/dodag.log
BRIDGELOG=/var/log/edgerouter/erbridge.log
BRIDGEERR=/var/log/edgerouter/erbridge.err

killall sunshine
killall erbridge

echo "starting dodag interface"
$ERDIR/sunshine  -I32 -ilowpan0 -r 1 --dagid 0xaffe0000000000000000000000000005 -m -p affe::5/64 > $DODAGLOG 2>&1  &
echo "starting erbridge..."
$ERDIR/erbridge 1> $BRIDGELOG 2> $BRIDGEERR &

