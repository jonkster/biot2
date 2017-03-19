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

USEMODULE += random

USEMODULE += printf_float

USEMODULE += mpu9250
USEMODULE += xtimer


# Add the shell and some shell commands
USEMODULE += shell
USEMODULE += shell_commands
USEMODULE += ps

LINKFLAGS += -Wl,--no-wchar-size-warning 

# Change this to 0 show compiler invocation lines by default:
QUIET ?= 1

CFLAGS += -DDEVELHELP -DNDEBUG # uncomment to allow detailed ps info

include $(RIOTBASE)/Makefile.include
