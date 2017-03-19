#!/bin/bash

export device="samr21-xpro"
export port=1

if true
then
export device=`zenity --list \
    --title="Choose device to test" \
    --column="device" --column="description" \
    samr21-xpro "ATSAMR21-XPRO evaluation board"\
    samr21-zllk "ATSAMR21ZLL-EK evaluation board"\
    samr21b18-mz210pa "Atmel mz210 board"`
fi

echo "testing:  $device"
export BOARD=$device



if true
then
export port=`zenity --list \
    --title="Choose USB device to communicate through" \
    --column="id" --column="device" \
    0 "/dev/ttyACM0" \
    1 "/dev/ttyACM1" \
    2 "/dev/ttyACM2" \
    3 "/dev/ttyACM3"`
fi

zenity --info --text "Please ensure device $device is plugged in to programmer on port /dev/ttyACM$port"

export tests=`ls -d */`


for testd in $tests
do
    echo 'running: ' $testd
    cd $testd
    pwd
    make clean
    make flash
    export componenttests=`ls tests`
    for subtest in $componenttests
    do
        tests/$subtest $port
    done
    cd ..
    pwd
done


