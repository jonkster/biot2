#ifndef _ROBOT_h_
#define _ROBOT_h_

#include <Ethernet.h>
#include <SPI.h>

#define STR_EXPAND(tok) #tok
#define STR(tok) STR_EXPAND(tok)

#define debug false

#define blinkPin 13  // Blink LED
#define BAUDRATE 115200

#define MACADD  0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xEE
#define IPADD 10,1,1,98
#define WEBPORT 8085

#define IPADDST "10.1.1.99"
#define WEBPORTST "8085"

#define servo1 3
#define servo2 5
#define servo3 4

const uint16_t servos[] = { servo1, servo2, servo3 };
uint16_t position[] = { 0, 0, 0 };



EthernetServer server (WEBPORT);

void listenForConnections();

#endif
