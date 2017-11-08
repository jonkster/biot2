#!/bin/bash

choice=$(tempfile 2>/dev/null)
trap "rm -f $choice" 0 1 2 5 15

dialog  --backtitle "Biotz Broker" \
   --checklist "Select Options" 10 40 2 \
	   NODES "Start Biot Node listener" on \
	   REST "Start REST Interface" on 2>$choice

WANTNODES=0
WANTREST=0
CHOICE=`cat $choice`
if grep -q NODES <<< $CHOICE
then
	WANTNODES=1
fi
if grep -q REST <<< $CHOICE
then
	WANTREST=1
fi

if [ $WANTNODES -eq 1 ]
then
	(node ./biot-broker-nodes.js) &
fi

if [ $WANTREST -eq 1 ]
then
	(node ./biot-broker-rest.js) &
fi

