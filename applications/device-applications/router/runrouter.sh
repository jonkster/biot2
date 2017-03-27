#!/bin/bash

export SLIPDEV="/dev/ttyUSB0"

DEVS=`ls -1 /dev/ttyUSB* | sed -e '1s_/_TRUE /_; s_^/_FALSE /_'`;


export SLIPDEV=`zenity  \
    --list  \
    --title="Choose USB device for SLIP" \
    --text "Choose SLIP device on PC" \
    --radiolist  \
    --column "Pick" \
    --column "Device" \
    $DEVS`

if [ ! $SLIPDEV ]
then
    exit 0
fi

zenity --info --text="You will need to enter your password to set up SLIP interface on $SLIPDEV."

TUNSLIP="sudo -Sb ../utils/tunslip6 affe::1/64 -t tun0 -s $SLIPDEV -B115200"

echo $TUNSLIP

PASSWORD=`zenity --password`
if [ ! $PASSWORD ]
then
    exit 0
fi

if [ `pgrep tunslip6` ]
then
    echo "killing previous slip process"
    echo $PASSWORD | sudo killall tunslip6
fi

echo $PASSWORD | $TUNSLIP

sleep 2

if ping6 -c1 -q -W1 affe::2 > /dev/null
then
    zenity --info --text="SLIP appears to be working! :)"
else
    zenity --warning --text="SLIP appears to NOT be working"
fi

    

