#!/bin/bash

port=${1:-0}

echo /dev/ttyUSB$port
sudo -Sb ../utils/tunslip6 affe::1/64 -t tun0 -s /dev/ttyUSB$port -B115200
