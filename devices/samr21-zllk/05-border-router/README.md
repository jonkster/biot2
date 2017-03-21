*Networking Project*

# Overview

Rough code for 6lowPAN border router.

Uses a SLIP network connection via USB between the router and PC.


# summary:

after flashing board (use samr21-zllk)

1. connect with FTDI cable to PC USB.

2. hit reset on the board to reboot it

3. run the script 'runrouter' on PC to confirm communication between router and PC works

# to send commands from PC to router do something like:

echo blue | nc -6u -q 1 affe::2 8888

This sends the string 'blue' to the router via a udp message.

# possibly useful snippets

to create interface on PC:

../utils/tunslip6 affe::1/64 -t tun0 -s /dev/ttyUSB0 -B115200"

(run killall tunslip6 to kill the interface)
