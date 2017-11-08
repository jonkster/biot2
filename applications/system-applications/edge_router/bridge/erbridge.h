#ifndef _BRIDGE_H_
#define _BRIDGE_H_

#define SIXLOWPAN_PORT    8888            // listen for incoming biot messages here

//#define BROKER_ADDRESS  "10.1.1.9" // send messages to here
#define BROKER_PORT     8888

#ifdef __cplusplus
extern "C" {
#endif

    char *brokerAddress;
    int brokerPort;

#ifdef __cplusplus
}
#endif

#endif
