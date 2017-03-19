APPLICATION = basic-test
BOARD ?= samr21-zllk
RIOTBASE ?= $(CURDIR)/../../../RIOT

USEMODULE += shell
USEMODULE += shell_commands
USEMODULE += ps
USEMODULE += xtimer

#DISABLE_MODULE += auto_init

# Comment this out to disable code in RIOT that does safety checking
# which is not needed in a production environment but helps in the
# development process:
CFLAGS += -DDEVELHELP

include $(RIOTBASE)/Makefile.include
