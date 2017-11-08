CC = gcc
#
# compiler flags:
#  -g    adds debugging information to the executable file
#    #  -Wall turns on most, but not all, compiler warnings
CFLAGS  = -g -Wall -std=gnu11


TARGET = erbridge

LDLIBS = $(shell pkg-config --libs --cflags glib-2.0)

HEADERS=*.h

OBJECTS = findBroker.o huffman.o erbridge.o

all: $(TARGET)

$(TARGET): $(OBJECTS)
	$(CC) $(CFLAGS) -o $@ $? $(LDLIBS)
  
%.o: %.c $(HEADERS)
	$(CC) $(CFLAGS) $< -c -o $@ $(LDLIBS)

clean:
	$(RM) $(TARGET) *\.o
	
