APPLICATION = test-6lowpan-node
BOARD ?= samr21b18-mz210pa
RIOTBASE ?= $(CURDIR)/../../../RIOT

USEMODULE += shell
USEMODULE += shell_commands
USEMODULE += ps
USEMODULE += xtimer
# needed by biotUdp
USEMODULE += posix
USEMODULE += posix_sockets
# UDP communication stuff
USEMODULE += gnrc_udp
USEMODULE += gnrc_conn_udp
USEMODULE += gnrc_sock_udp
USEMODULE += gnrc_sock_ip



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
#
# Add a routing protocol
USEMODULE += gnrc_rpl
# Add forwarding table
USEMODULE += fib

# Use minimal standard random number generator
#USEMODULE += prng_minstd
USEMODULE += random
USEMODULE += printf_float

# Change this to 0 show detailed compilation info during build
QUIET ?= 1

# Comment this out to disable code in RIOT that does safety checking
# which is not needed in a production environment but helps in the
# development process:
CFLAGS += -DDEVELHELP -DNDEBUG

include $(RIOTBASE)/Makefile.include
