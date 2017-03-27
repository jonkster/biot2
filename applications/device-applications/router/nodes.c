#include <inttypes.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include "net/ipv6.h"
#include <xtimer.h>
#include "nodes.h"
#include "../common/time/biotTime.h"
#include "../common/udp/udp_common.h"

char nodeData[MAX_NODES][IPV6_ADDR_MAX_STR_LEN];
uint32_t startTime = 0;

void registerNode(char *addr)
{
    for (uint8_t i = 0; i < MAX_NODES; i++)
    {
        if (strlen(nodeData[i]) == 0)
        {
            strcpy(nodeData[i], addr);
            return;
        }
        if (strcmp(nodeData[i], addr) == 0)
            return;
    }
    printf("node overflow! %s\n", addr);
}

void relayMessage(char *cmd, char *data, char *address)
{
    char buffer[MAX_MESSAGE_LENGTH];
    memset(buffer, 0, MAX_MESSAGE_LENGTH);
    //printf("relaying cmd:%s with data:%s to:%s\n", cmd, data, address);
    sprintf(buffer, "%s#%s", cmd, data);
    udp_send(address, buffer);
    return;
}

void syncKnown(void)
{
    char buffer[MAX_MESSAGE_LENGTH];
    memset(buffer, 0, MAX_MESSAGE_LENGTH);
    sprintf(buffer, "ctim#%lu", getCurrentTime());
    for (uint8_t i = 0; i < MAX_NODES; i++)
    {
        if (strlen(nodeData[i]) > 0)
        {
            udp_send(nodeData[i], buffer);
        }
        else
        {
            return;
        }
    }
    return;
}

void initNodes(void)
{
    for (uint8_t i = 0; i < MAX_NODES; i++)
    {
        memset(nodeData[i], 0, IPV6_ADDR_MAX_STR_LEN);
    }
    startTime = xtimer_now().ticks32;
}
