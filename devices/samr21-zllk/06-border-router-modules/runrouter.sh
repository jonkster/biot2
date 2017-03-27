#!/bin/bash

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


tunslip="../../utils/tunslip6 affe::1/64 -t tun0 -s $slipdev -B115200"

echo "need sudo password to make network interface"
PASSWORD=$(zenity \
    --password)
echo $PASSWORD | sudo -Sb $tunslip

./setled.sh off
sleep 2
./setled.sh green
sleep 2
./setled.sh blue
zenity --info --text="If router communication with UDP/IP appears OK, LED should go from blue to green"

zenity --question --text="Open terminal to device?"
if [ $? = 0 ]; then
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
        FALSE "/dev/ttyACM3" \
        FALSE "/dev/ttyUSB0" \
        FALSE "/dev/ttyUSB1" \
        FALSE "/dev/ttyUSB2" \
        FALSE "/dev/ttyUSB3"`

    zenity --info --text="If router communication with UDP/IP appears OK, LED should go off"
    ./setled.sh off
    minicom -D$termdev riotos
fi
./setled.sh green
zenity --info --text="If router communication with UDP/IP appears OK, LED should go to green"

zenity --question --text="close SLIP interface?"
if [ $? != 0 ]; then
    zenity --info --text="Link will remain open, led should be green"
    exit 0
fi

./setled.sh red
echo $PASSWORD | sudo killall tunslip6
zenity --info --text="Link should now be closed, led should be red"
