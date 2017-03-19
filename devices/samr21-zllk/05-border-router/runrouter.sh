#!/bin/bash

export termdev=0
export slipdev="/dev/ttyUSB0"

if true
then
export slipdev=`zenity  \
    --list  \
    --title="Choose USB device for SLIP" \
    --text "Choose device" \
    --radiolist  \
    --column "Pick" \
    --column "Device" \
    TRUE "/dev/ttyUSB0" \
    FALSE "/dev/ttyUSB1" \
    FALSE "/dev/ttyUSB2" \
    FALSE "/dev/ttyUSB3"`
fi


if true
then
export termdev=`zenity \
    --list \
    --title="Choose USB device for terminal access" \
    --text "Choose device" \
    --radiolist  \
    --column="Pick" \
    --column="Device" \
    TRUE "/dev/ttyACM0" \
    FALSE "/dev/ttyACM1" \
    FALSE "/dev/ttyACM2" \
    FALSE "/dev/ttyACM3"`
fi

zenity --question --text "SLIP network interface: $slipdev\nterminal access: $termdev\nProceed?"
if [ $? != 0 ]; then
    exit 0
fi

tunslip="../../utils/tunslip6 affe::1/64 -t tun0 -s $slipdev -B115200"

PASSWORD=$(zenity --password)
echo $PASSWORD | sudo -Sb $tunslip

sleep 2
echo green | nc -6u -q 1 affe::2 8888
echo blue | nc -6u -q 1 affe::2 8888
zenity --info --text="If link OK LED should have changed from green to blue"

zenity --question --text="Open terminal on $termdev?"
if [ $? = 0 ]; then
    echo off | nc -6u -q 1 affe::2 8888
    minicom -D$termdev riotos
fi
echo green | nc -6u -q 1 affe::2 8888

zenity --question --text="close SLIP interface?"
if [ $? != 0 ]; then
    zenity --info --text="Link will remain open"
    exit 0
fi

echo red | nc -6u -q 1 affe::2 8888
echo $PASSWORD | sudo killall tunslip6
zenity --info --text="Link should now be closed"
