*Networking Project*

# Overview

Rough code for 6lowPAN border router.

Uses a SLIP network connection via USB between the router and PC.

NB to test 6lowPAN interactions with devices you will need a board that wants
to join the dodag, use code in: biotz2/devices/samr21b18-mz210pa/05-6lowpan-node


# summary:

A. Confirm router and PC work

after flashing board (use samr21-zllk)

1. connect with FTDI cable to PC USB.

2. hit reset on the board to reboot it

3. run the script 'runrouter' on PC to confirm communication between router and PC works

4. can pass led change requests to router from PC using script 'setled.sh' eg
    ./setled red

If OK to here - this establishes router/PC connection OK

NB - sometimes when setting the system up the router slip connection doesn't
initialise properly - shutting down the board (removing USB cables) and
reconnecting will often resolve this, (suspect more a PC issue than a board issue?).

A. Confirm router and dodag work

Now check 6lowPAN nodes can talk with router...

5. using a node flashed with biotz2/devices/samr21b18-mz210pa/05-6lowpan-node, power it up

6. after a while the router led should cycle through colours as the node will
   be passing messages to it to change the led colour.



# possibly useful snippets

1. to send commands from PC to router do something like:

echo blue | nc -6u -q 1 affe::2 8888

This sends the string 'blue' to the router via a udp message.


2. to create interface on PC:

../utils/tunslip6 affe::1/64 -t tun0 -s /dev/ttyUSB0 -B115200"

(run killall tunslip6 to kill the interface)
