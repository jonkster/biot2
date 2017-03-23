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

#include "udp.h"

#define XSTR(x) STR(x)
#define STR(x) #x


#define MUDP_Q_SZ           (84)
#define SERVER_BUFFER_SIZE  (512)
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



char dataDestAdd[IPV6_ADDR_MAX_STR_LEN];

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
        puts("error initializing socket for listen");
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
    if (strcmp(data, "off") == 0)
    {
        LED0_OFF;
    }
    else if (strcmp(data, "on") == 0)
    {
        LED0_ON;
    }
    else if (strcmp(data, "red") == 0)
    {
        LED0_ON;
    }
    else if (strcmp(data, "green") == 0)
    {
        LED0_ON;
    }
    else if (strcmp(data, "blue") == 0)
    {
        LED0_ON;
    }
    else
    {
        printf("unknown?%s\n", data);
    }
}




void actOnUdpRequests(int res, char *srcAdd, char* selfAdd)
{
    if (biotMsgSilent)
    {
        return;
    }
    printf("from:%s: len:%d: msg:%s\n", srcAdd, strlen(serverBuffer), serverBuffer);
    if (strcmp(serverBuffer, "led") == 0)
    {
        actOnLedCommandMessage(serverBuffer);
    }
    else
    {
        printf("rx unknown udp msg from %s : %s\n", srcAdd, serverBuffer);
    }
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
            perror("error initializing socket for send");
            return 1;
        }

        if (sendto(s, data, dataLen, 0, (struct sockaddr *)&dst, sizeof(dst)) < 0) {
            printf("XXXX errno:%i dl=%i\n", errno, dataLen);
            perror("XXXX error: could not send message:");
            close(s);
            return 1;
        }
        close(s);
        printf("Success: send %u byte(s) to %s:%u\n", (unsigned)dataLen, addrStr, UDP_PORT);
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


void initUdp(void)
{
    msg_init_queue(msg_q, MUDP_Q_SZ);
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





