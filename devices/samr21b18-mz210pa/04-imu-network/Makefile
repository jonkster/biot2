# name of your application
APPLICATION = basic-imu

# If no BOARD is found in the environment, use this default:
BOARD ?= samr21b18-mz210pa

# This has to be the absolute path to the RIOT base directory:
RIOTBASE ?= $(CURDIR)/../../../RIOT


## add current directory to the include path. Putting it in CFLAGS will make
## it go to the beginning, before the standard includes.
CFLAGS += -I$(CURDIR)

# gl matrix library is sloppy...
CFLAGS += -Wno-error=maybe-uninitialized
CFLAGS += -DPI=3.14159265
CFLAGS += -DMAX_NODES=10


USEMODULE += printf_float

# adding biot specific modules
#USEMODULE += biotUdp
#USEMODULE += position
#USEMODULE += biotIdentify


USEMODULE += mpu9250

# Include packages that pull up and auto-init the link layer.
# NOTE: 6LoWPAN will be included if IEEE802.15.4 devices are present
USEMODULE += gnrc_netdev_default
USEMODULE += auto_init_gnrc_netif

# Specify the minimum networking modules for IPv6
# we can have either gnrc_ipv6 or gnrc_ipv6_router_default depending on needs
#USEMODULE += gnrc_ipv6_router_default
USEMODULE += gnrc_ipv6
USEMODULE += gnrc_icmpv6_echo
USEMODULE += gnrc_ndp


GNRC_NETIF_NUMOF := 2
INCLUDES += -I$(CURDIR)
CFLAGS += -DSLIP_UART=$(SLIP_UART)
CFLAGS += -DSLIP_BAUDRATE=$(SLIP_BAUDRATE)
   
# UDP communication stuff
USEMODULE += gnrc_udp
USEMODULE += gnrc_conn_udp
# needed by biotUdp
USEMODULE += posix
USEMODULE += posix_sockets

USEMODULE += gnrc_sock_ip

# Add a routing protocol
USEMODULE += gnrc_rpl
#USEMODULE += auto_init_gnrc_rpl
# Add forwarding table
USEMODULE += fib


# Use minimal standard random number generator
USEMODULE += prng_minstd


# Add the shell and some shell commands
USEMODULE += shell
USEMODULE += shell_commands
USEMODULE += ps
USEMODULE += netstats_l2
USEMODULE += netstats_ipv6

#CFLAGS += -DGNRC_PKTBUF_SIZE=512 -DGNRC_IPV6_NETIF_ADDR_NUMOF=4 -DGNRC_IPV6_NC_SIZE=1
LINKFLAGS += -Wl,--no-wchar-size-warning 

# Change this to 0 show compiler invocation lines by default:
QUIET ?= 1

#CFLAGS += -DDEVELHELP -DNDEBUG # uncomment to allow detailed ps info

include $(RIOTBASE)/Makefile.include
