#include <inttypes.h>
#include <xtimer.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include "net/af.h"
#include "net/conn/udp.h"
#include "net/ipv6.h"
#include <errno.h>

#include <unistd.h>
#include "msg.h"
#include "board.h"
#include "biotIdentify.h"

#include "udp.h"

#define XSTR(x) STR(x)
#define STR(x) #x


#define MUDP_Q_SZ           (84)
//#define MUDP_Q_SZ           (64)
#define SERVER_BUFFER_SIZE  (512)
//#define SERVER_BUFFER_SIZE  (256)
#define UDP_PORT            (8888)

extern uint32_t getCurrentTime(void);
extern void setCurrentTime(uint32_t t);

static int serverSocket = -1;
struct sockaddr_in6 serverSocketAddr;

// define some variables globally here to keep them off the stack
static char serverBuffer[SERVER_BUFFER_SIZE];
static msg_t msg_q[MUDP_Q_SZ];
static char srcAdd[IPV6_ADDR_MAX_STR_LEN];
static char selfAdd[IPV6_ADDR_MAX_STR_LEN];
struct in6_addr srcSocketAddr; 

uint32_t dupInterval;
uint32_t startTime = 0;
bool biotMsgSilent = false;
bool pokeRequested = false;



#ifdef MAX_NODES
    char nodeData[MAX_NODES][IPV6_ADDR_MAX_STR_LEN];
#endif

char dataDestAdd[IPV6_ADDR_MAX_STR_LEN];

//bool relayDataToBroker(char * destAdd, char *srcAdd, char *type, char *val);

bool setupUdpServer(void)
{
    printf("starting udp server...");
    if (serverSocket >= 0)
    {
        puts("closing open socket");
        close(serverSocket);
    }
    serverSocket = socket(AF_INET6, SOCK_DGRAM, IPPROTO_UDP);

    serverSocketAddr.sin6_family = AF_INET6;
    memset(&serverSocketAddr.sin6_addr, 0, sizeof(serverSocketAddr.sin6_addr));
    serverSocketAddr.sin6_port = htons(UDP_PORT);

    if (serverSocket < 0)
    {
        puts("error initializing socket");
        serverSocket = -1;
        return false;
    }

    if (bind(serverSocket, (struct sockaddr *)&serverSocketAddr, sizeof(serverSocketAddr)) < 0)
    {
        serverSocket = -1;
        puts("error binding socket");
        return false;
    }

    strcpy(dataDestAdd, "");

    puts(" OK");
    return true;
}

void actOnLedCommandMessage(char *data)
{
    if (strcmp(data, "0") == 0)
    {
        LED0_OFF;
    }
    else if (strcmp(data, "1") == 0)
    {
        LED0_ON;
    }
    else if (strcmp(data, "2") == 0)
    {
        LED0_ON;
    }
    else if (strcmp(data, "3") == 0)
    {
        identifyYourself(selfAdd);
    }
    else
    {
        printf("unknown?%s\n", data);
    }
}

void actOnTimCommandMessage(char *data)
{
    uint32_t t = atoi(data);
    setCurrentTime(t);
}


void actOnDupCommandMessage(char *data)
{
    uint32_t t = atoi(data);
    dupInterval = t;
}

void actOnRebCommandMessage(char *data)
{
    puts("no idea...");
}

void actOnPokeCommandMessage(char *data)
{
    pokeRequested = true;
}

void actOnSynCommandMessage(char *data)
{
    syncKnown();
}

void actOnOrientDataMessage(char *data, char *srcAdd)
{
    char buffer[MAX_MESSAGE_LENGTH];
    memset(buffer, 0, MAX_MESSAGE_LENGTH);
    sprintf(buffer, "%s#%s", data, srcAdd);
    relayMessage("do", buffer, "affe::1");
}
void actOnCalibrDataMessage(char *data, char *srcAdd)
{
    char buffer[MAX_MESSAGE_LENGTH];
    memset(buffer, 0, MAX_MESSAGE_LENGTH);
    sprintf(buffer, "%s#%s", data, srcAdd);
    relayMessage("dc", buffer, "affe::1");
}
void actOnStatusDataMessage(char *data, char *srcAdd)
{
    char buffer[MAX_MESSAGE_LENGTH];
    memset(buffer, 0, MAX_MESSAGE_LENGTH);
    sprintf(buffer, "%s#%s", data, srcAdd);
    relayMessage("ds", buffer, "affe::1");
    registerNode(srcAdd);
}

void relayMessage(char *cmd, char *data, char *address)
{
    char buffer[MAX_MESSAGE_LENGTH];
    memset(buffer, 0, MAX_MESSAGE_LENGTH);
    //printf("relaying cmd:%s with data:%s to:%s\n", cmd, data, address);
    sprintf(buffer, "%s#%s", cmd, data);
    udpSend(address, buffer);
    return;
}

void actOnUdpRequests(int res, char *srcAdd, char* selfAdd)
{
    if (biotMsgSilent)
    {
        return;
    }
//printf("from:%s: len:%d: msg:%s\n", srcAdd, strlen(serverBuffer), serverBuffer);

    // extract components of command
    char *cmd = NULL;
    char *data = NULL;
    char *address = NULL;
    char *p = strtok(serverBuffer, "#");
    if (p > 0)
    {
        cmd = strdup(p);
//printf("got cmd:%s\n", cmd);
        p = strtok(NULL, "#");
        if (p)
        {
            data = strdup(p);
//printf("got data:%s\n", data);
            p = strtok(NULL, "#");
            if (p)
            {
                address = strdup(p);
//printf("got add:%s\n", address);
                if (cmd[0] != 'd')
                {
                    relayMessage(cmd, data, address);
                    free(cmd);
                    free(data);
                    free(address);
                    return;
                }
            }
        }
    }

    if (strcmp(cmd, "cled") == 0)
    {
        actOnLedCommandMessage(data);
    }
    else if (strcmp(cmd, "ctim") == 0)
    {
        actOnTimCommandMessage(data);
    }
    else if (strcmp(cmd, "creb") == 0)
    {
        actOnRebCommandMessage(data);
    }
    else if (strcmp(cmd, "cpok") == 0)
    {
        actOnPokeCommandMessage(data);
    }
    else if (strcmp(cmd, "csyn") == 0)
    {
        actOnSynCommandMessage(data);
    }
    else
    {
        printf("rx unknown udp msg from %s : %s\n", srcAdd, serverBuffer);
    }
    free(cmd);
    free(data);
}

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

int udpSend(char *addrStr, char *data)
{
    size_t dataLen = strlen(data);
    if (dataLen > 0)
    {
        if (dataLen > MAX_MESSAGE_LENGTH)
        {
            printf("message too long: %i > %i   '%s'\n", dataLen, MAX_MESSAGE_LENGTH, data);
            return 1;
        }
        struct sockaddr_in6 dst;
        dst.sin6_family = AF_INET6;
        if (inet_pton(AF_INET6, addrStr, &dst.sin6_addr) != 1) {
            puts("Error: unable to parse destination address");
            printf("sending to add: %s   msg: %s\n", addrStr, data);
            return 1;
        }
        dst.sin6_port = htons(UDP_PORT);

        int s;
        s = socket(AF_INET6, SOCK_DGRAM, IPPROTO_UDP);
        if (s < 0) {
            perror("error initializing socket");
            return 1;
        }

        if (sendto(s, data, dataLen, 0, (struct sockaddr *)&dst, sizeof(dst)) < 0) {
            printf("XXXX errno:%i dl=%i\n", errno, dataLen);
            perror("XXXX error: could not send message:");
            close(s);
            return 1;
        }
        close(s);
 //       printf("Success: send %u byte(s) to %s:%u\n", (unsigned)dataLen, addrStr, UDP_PORT);
    }
    else
    {
        puts("trying to send empty value via udp!! Send discarded.");
    }

    return 0;
}

void udpGetRequestAndAct(void)
{
    memset(serverBuffer, 0, SERVER_BUFFER_SIZE);

    struct sockaddr_in6 src;
    socklen_t srcLen = sizeof(struct sockaddr_in6);
    // this blocks :( no non blocking recvfrom in RIOT OS yet
    int res = recvfrom(serverSocket,
            serverBuffer,
            sizeof(serverBuffer),
            0,
            (struct sockaddr *)&src,
            &srcLen);

    // get strings represnting source and server ipv6 addresses
    srcSocketAddr = src.sin6_addr; 
    inet_ntop(AF_INET6, &(srcSocketAddr.s6_addr), srcAdd, IPV6_ADDR_MAX_STR_LEN);
    inet_ntop(AF_INET6, &(serverSocketAddr.sin6_addr), selfAdd, IPV6_ADDR_MAX_STR_LEN);

    if (res < 0)
    {
        printf("Error on RX %d:%s rx from: %s (%s)\n", errno, strerror(errno), srcAdd, serverBuffer);
        xtimer_usleep(100);
        return;
    }
    else if (res == 0)
    {
        puts("Peer did shut down");
        return;
    }
    else if (res >= SERVER_BUFFER_SIZE)
    {
        puts("OVERFLOW!");
        return;
    }
    actOnUdpRequests(res, srcAdd, selfAdd);
}


void *udpServer(void *arg)
{
    initUdp();
    if (setupUdpServer())
    {
        for(;;)
        {
            udpGetRequestAndAct();
        }
    }
    else
    {
        return NULL;
    }
}

void syncKnown(void)
{
#ifdef MAX_NODES
    char buffer[MAX_MESSAGE_LENGTH];
    memset(buffer, 0, MAX_MESSAGE_LENGTH);
    sprintf(buffer, "ctim#%lu", getCurrentTime());
    for (uint8_t i = 0; i < MAX_NODES; i++)
    {
        if (strlen(nodeData[i]) > 0)
        {
            udpSend(nodeData[i], buffer);
        }
        else
        {
            return;
        }
    }
    return;
#endif
}

void initUdp(void)
{
#ifdef MAX_NODES
    for (uint8_t i = 0; i < MAX_NODES; i++)
    {
        memset(nodeData[i], 0, IPV6_ADDR_MAX_STR_LEN);
    }
    msg_init_queue(msg_q, MUDP_Q_SZ);
#endif
    startTime = xtimer_now().ticks32;
}

int udp_cmd(int argc, char **argv)
{
    if (argc == 3) {
        return udpSend(argv[1], argv[2]);
    }

    printf("usage: %s <IPv6-address> <message>\n", argv[0]);
    return 1;
}

void sendData(char *address, nodeData_t data)
{
return;
    char buffer[MAX_MESSAGE_LENGTH];
    memset(buffer, 0, MAX_MESSAGE_LENGTH);
    sprintf(buffer, "do#%lu:%f:%f:%f:%f", data.timeStamp, data.w, data.x, data.y, data.z);
    udpSend(address, buffer);
}

void sendCalibration(char *address, int16_t *cal)
{
return;
    char buffer[MAX_MESSAGE_LENGTH];
    memset(buffer, 0, MAX_MESSAGE_LENGTH);
    sprintf(buffer, "dc#%d:%d:%d:%d:%d:%d", cal[0], cal[1], cal[2], cal[3], cal[4], cal[5]);
    udpSend(address, buffer);
}



