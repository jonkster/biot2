#ifndef _NODES_H
#define _NODES_H

#include <netinet/in.h>
#include "../common/biotmaths/position.h"

#define MAX_MESSAGE_LENGTH 84

#define HERMIT_TIME_SECS   10 // how long to wait for a silent node before culling

typedef struct {
    char     ip6Address[INET6_ADDRSTRLEN];
    uint32_t timeStamp;
    char*    nodeTime;
    char*    orientation;
    char*    calibration;
    char*    gamStatus;
    uint16_t updateInterval;
    bool     calibrationMode;
} nodeData_t;

#ifdef __cplusplus
extern "C" {
#endif

void cullOldNodes(void);

void initNodes(void);

uint32_t nodeAge(uint8_t idx);

void registerNode(char *addr, char *data);

void relayMessage(char *cmd, char *data, char *address);

void syncKnown(void);

void updateNodeCalibration(char* srcAdd, char* data);

void updateNodeOrientation(char* srcAdd, char* data);

void updateNodeStatus(char* srcAdd, char* data);

void who(void);

#ifdef __cplusplus
}
#endif

#endif

