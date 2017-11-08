Biot Broker
-----------

experimental version uses separate node scripts, 1 to interface to edge router
and 1 to provide REST API.

biot-broker-nodes.js
biot-broker-rest.js


Edge Router
-----------
Also has edge router components for use on suitably configured Raspberry Pi3:
sunshine (to set up DODAG root node)
bridge (to act as bridge between 6LowPan network and TCP/IP network)

A script for quick edge router setup (requires curses 'dialog' utility)
edgerouter.sh

