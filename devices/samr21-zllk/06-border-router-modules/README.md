*Code organisation stuff*

# Overview

This builds on the 05-border-router code to use some modularisation of code.

See 05-border-router project for how the device should be set up and behave.

# notes

To use the udp communication stuff:

1. in Makefile:
```
DIRS += ../common/udp/
USEMODULE += biot_udp
```
2. implement a method:
```
void actOnCommand(char *cmdSt, struct in6_addr src_addr)
```
that will do whatever you require when a udp message is sent to this device.

3. include
```
../common/udp/udp_common.h
```
4. start the udp server 
```
thread_create(udp_stack, sizeof(udp_stack), PRIO, THREAD_CREATE_STACKTEST, udp_server, NULL, "udp");
```





