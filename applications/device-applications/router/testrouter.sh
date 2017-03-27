#!/bin/bash

zenity --question --text "do you need to open the SLIP network connection to the router?"

if [ $? -eq 0 ]
then
    ./runrouter.sh
fi


export TERMDEV="/dev/ttyACM0"

DEVS=`ls -1 /dev/ttyACM* | sed -e '1s_/_TRUE /_; s_^/_FALSE /_'`;


export TERMDEV=`zenity  \
    --list  \
    --title="Choose USB device for terminal" \
    --text "Choose terminal device on PC" \
    --radiolist  \
    --column "Pick" \
    --column "Device" \
    $DEVS`

if [ ! $TERMDEV ]
then
    exit 0
fi



zenity --info --text="I will open a terminal to the router, confirm that the router device does an identify flash then reboots."



(echo 'ctim#0#' | nc -6u -q 1 affe::2 8888 &&
echo 'csyn##' | nc -6u -q 1 affe::2 8888 &&
echo 'cled#3#' | nc -6u -q 1 affe::2 8888 &&
echo 'creb##' | nc -6u -q 1 affe::2 8888) &
zenity --info --timeout 5 --text="check for rapid flash and reboot, to finish press Ctrl-A X in terminal window" &
minicom -D $TERMDEV riotos
