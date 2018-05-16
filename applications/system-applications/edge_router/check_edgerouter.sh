#!/bin/bash

if [ `pgrep sunshine` ]
then
	echo "sunshine (the dodag root code) appears to be running"
else
	echo "!! sunshine (the dodag root code) NOT running"
fi

if [ `pgrep erbridge` ]
then
	echo "erbridge (the 6lowpan<->ipv4 bridge) appears to be running"
else
	echo  "!! erbridge (the 6lowpan<->ipv4 bridge) NOT running"
fi


