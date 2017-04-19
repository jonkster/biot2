#include <inttypes.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <xtimer.h>
#include "nodes.h"
#include "../common/time/biotTime.h"
#include "../common/udp/udp_common.h"


nodeData_t nodeData[MAX_NODES];

uint32_t startTime = 0;

void cullNode(uint8_t idx)
{
    if (strlen(nodeData[idx].ip6Address) > 0)
    {
        printf("dropping node #%i %s\n", idx, nodeData[idx].ip6Address);
        strcpy(nodeData[idx].ip6Address, "");
        nodeData[idx].timeStamp = 0;
        free(nodeData[idx].nodeTime);
        free(nodeData[idx].orientation);
        free(nodeData[idx].calibration);
        free(nodeData[idx].gamStatus);
    }
    else
    {
        printf("Warning - attempt to cull unknown node #%i!\n", idx);
    }
}

void cullOldNodes(void)
{
    for (uint8_t i = 0; i < MAX_NODES; i++)
    {
        if (strlen(nodeData[i].ip6Address) != 0)
        {
            int32_t recency = nodeAge(i);
            if (recency > HERMIT_TIME_SECS)
            {
                cullNode(i);
                return;
            }
        }
    }
}

uint32_t nodeAge(uint8_t idx)
{
    if (strlen(nodeData[idx].ip6Address) != 0)
    {
        int32_t recency = (getCurrentTime() - nodeData[idx].timeStamp) / 1000000;
        return recency;
    }
    return 0;
}

int nodeKnown(char *addr)
{
    for (uint8_t i = 0; i < MAX_NODES; i++)
    {
        if (strlen(nodeData[i].ip6Address) > 0)
        {
            if (strcmp(nodeData[i].ip6Address, addr) == 0)
                return i;
        }
    }
    return -1;
}

void registerNode(char *addr, char* data)
{
    if (strcmp(addr, "affe::") == 0)
    {
        return;
    }

    int idx = nodeKnown(addr);
    if (idx >= 0)
    {
        nodeData[idx].timeStamp = getCurrentTime();
        updateNodeStatus(addr, data);
        return;
    }
    else
    {
        for (idx = 0; idx < MAX_NODES; idx++)
        {
            if (strlen(nodeData[idx].ip6Address) == 0)
            {
                strcpy(nodeData[idx].ip6Address, addr);
                nodeData[idx].timeStamp = getCurrentTime();
                nodeData[idx].nodeTime = strdup("?");
                nodeData[idx].orientation = strdup("?");
                nodeData[idx].calibration = strdup("?");
                nodeData[idx].gamStatus = strdup("?");
                updateNodeStatus(addr, data);
                return;
            }
        }
    }
    printf("node overflow! %s.  System can only control %i nodes\n", addr, MAX_NODES);
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
    for (uint8_t i = 0; i < MAX_NODES; i++)
    {
        if (strlen(nodeData[i].ip6Address) > 0)
        {
            sprintf(buffer, "ctim#%lu", getCurrentTime());
            udp_send(nodeData[i].ip6Address, buffer);
        }
        else
        {
            return;
        }
    }
    return;
}

void updateNodeCalibration(char* srcAdd, char* data)
{
    int idx = nodeKnown(srcAdd);
    if (idx >= 0)
    {
        nodeData[idx].timeStamp = getCurrentTime();
        free(nodeData[idx].calibration);
        nodeData[idx].calibration = strdup(data);
        return;
    }
}


void updateNodeOrientation(char* srcAdd, char* data)
{
    int idx = nodeKnown(srcAdd);
    if (idx >= 0)
    {
        // strip of timestamp
        char* p = index(data, ':');
        if (p != NULL)
        {
            nodeData[idx].timeStamp = getCurrentTime();
            free(nodeData[idx].orientation);
            nodeData[idx].orientation = strdup(p+1);
            free(nodeData[idx].nodeTime);
            nodeData[idx].nodeTime = strndup(data, p - data);
        }
    }
}

void updateNodeStatus(char* srcAdd, char* data)
{
    int idx = nodeKnown(srcAdd);
    if (idx >= 0)
    {
        nodeData[idx].timeStamp = getCurrentTime();
        free(nodeData[idx].gamStatus);
        nodeData[idx].gamStatus = strdup(data);
        return;
    }
}

void who(void)
{
    uint8_t c = 0;
    printf("%5s|%-26s|%-10s|%-8s|%-10s|%-10s|%-10s|%-26s|%-20s\n", "#", "address", "heard at", "age (s)", "node time", "lag (ms)", "status", "cal", "orient");
    printf("-----------------------------------------------------------------------------------------------------------------------------\n");
    for (uint8_t i = 0; i < MAX_NODES; i++)
    {
        if (strlen(nodeData[i].ip6Address) != 0)
        {
            char* st;
            uint32_t nodeTs = strtoul(nodeData[i].nodeTime, &st, 10);
            int32_t lag = nodeData[i].timeStamp - nodeTs;
            int32_t recency = nodeAge(i);
            printf("%1s%4i|%26s|%10lu|%8lu|%10s|%10lu|%10s|%26s|%20s\n",
                    (recency > 2) ? "?" : "", 
                    i,
                    nodeData[i].ip6Address,
                    nodeData[i].timeStamp,
                    recency,
                    nodeData[i].nodeTime,
                    lag/1000,
                    nodeData[i].gamStatus,
                    nodeData[i].calibration,
                    nodeData[i].orientation);
            c++;
        }
    }
    printf("-----------------------------------------------------------------------------------------------------------------------------\n");
    printf("found %i IMU biot nodes\n", c);
}

void initNodes(void)
{
    for (uint8_t i = 0; i < MAX_NODES; i++)
    {
        memset(nodeData[i].ip6Address, 0, INET6_ADDRSTRLEN);
    }
    startTime = xtimer_now().ticks32;
}
