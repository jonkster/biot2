#ARDUINO_LIBS = I2CDev Wire EEPROM Ethernet SPI
# allow access to these libraries from the system Arduino stuff
ARDUINO_LIBS = Ethernet SPI

PROJECT_DIR       = /home/jonk/KELLY/Projects/arduino-projects/

### AVR_GCC_VERSION
### Check if the version is equal or higher than 4.9
AVR_GCC_VERSION  := $(shell expr `avr-gcc -dumpversion | cut -f1` \>= 4.9)

ARDMK_DIR         = $(PROJECT_DIR)/Arduino-Makefile

ARDUINO_DIR       = /usr/share/arduino

### USER_LIB_PATH
### Path to where the your project's libraries are stored.
USER_LIB_PATH     :=  ./libs

BOARD_TAG         = uno
#BOARD_TAG         = atmega328

MONITOR_BAUDRATE  = 115200

AVR_TOOLS_DIR     = /usr

AVRDDUDE          = /usr/bin/avrdude 
AVRDUDE_OPTS      = -v

CFLAGS_STD        = -std=gnu11 -Os

CXXFLAGS_STD      = -std=gnu++11

CXXFLAGS         =  -Wall -Wextra -Wno-write-strings -Os
#CXXFLAGS         = -pedantic -Wall -Wextra

### If avr-gcc -v is higher than 4.9, activate coloring of the output
ifeq "$(AVR_GCC_VERSION)" "1"
    CXXFLAGS += -fdiagnostics-color
endif

### The port your board is connected to. Using an '*' tries all the ports and finds the right one.
MONITOR_PORT      = /dev/ttyACM*

CURRENT_DIR       = $(shell basename $(CURDIR))

OBJDIR            = $(PROJECT_DIR)/bin/$(BOARD_TAG)/$(CURRENT_DIR)

### path to Arduino.mk, inside the ARDMK_DIR, don't touch.
include $(ARDMK_DIR)/Arduino.mk

