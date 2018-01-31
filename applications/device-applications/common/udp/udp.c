#include <inttypes.h>
#include <errno.h>
#include <xtimer.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include "net/sock/udp.h"
#include "net/ipv6/addr.h"
#include "net/sock/udp.h"
#include <unistd.h>

#include "msg.h"
#include "udp_common.h"

#define UDP_PORT               (8888)
#define SERVER_MSG_QUEUE_SIZE  2

#define UDP_VERBOSE            1  // set == 1 for debugging

static msg_t msg_q[SERVER_MSG_QUEUE_SIZE];

extern void actOnCommand(char *cmdSt, char *src_addr);

extern void idleTask(void);

static int serverSocket = -1;

bool serverListen = false;
bool runIdleTask = false;

void resetNetwork(void)
{
    udp_send("ff02::1", "creb##");
}

bool udpInit(void)
{
    puts("initialising udp server...");

    if (serverSocket >= 0)
    {
        puts("closing open socket");
        close(serverSocket);
    }
    serverSocket = socket(AF_INET6, SOCK_DGRAM, IPPROTO_UDP);

    struct sockaddr_in6 serverSocketAddr;
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
    puts("udp server ready");
    return true;
}

void udpRunIdleTask(bool state)
{
    runIdleTask = state;
}

void *udp_server_loop(void *arg)
{
    (void) arg;

    msg_init_queue(msg_q, SERVER_MSG_QUEUE_SIZE);

    static char serverBuffer[SERVER_BUFFER_SIZE];
    memset(serverBuffer, 0, SERVER_BUFFER_SIZE);
    for(;;)
    {
        if (runIdleTask)
        {
            idleTask();
        }

        if (serverListen)
        {
            if (serverSocket == -1)
            {
                if (! udpInit()) {
                    puts("turning off udp listen");
                    serverListen = false;
                    continue;
                }
            }

            struct sockaddr_in6 src;
            socklen_t srcLen = sizeof (src);
            bzero(&src, srcLen);
            memset(serverBuffer, 0, SERVER_BUFFER_SIZE);

            // this blocks :( no non blocking recvfrom in RIOT OS yet
            int res = recvfrom(serverSocket,
                    serverBuffer,
                    sizeof(serverBuffer),
                    0,
                    (struct sockaddr *)&src,
                    &srcLen);

            // get strings representing source and server ipv6 addresses
            static char srcAdd[INET6_ADDRSTRLEN];

            inet_ntop(src.sin6_family, &src.sin6_addr, srcAdd, INET6_ADDRSTRLEN);
            if (strcmp(srcAdd, "affe::") == 0)
            {
                puts("nodes have lost context with router...");
                resetNetwork();
            }
            else if (res < 0)
            {
                printf("Error on RX %d:%s rx from: %s (%s)\n", errno, strerror(errno), srcAdd, serverBuffer);
            }
            else if (res == 0)
            {
                puts("Peer did shut down");
            }
            else if (res >= SERVER_BUFFER_SIZE)
            {
                printf("OVERFLOW! %i (max %i) data=%s\n", res, SERVER_BUFFER_SIZE, serverBuffer);
            }
            else
            {
                if (UDP_VERBOSE > 0)
                    printf("rx from: %s data:%s\n", srcAdd, serverBuffer);
                actOnCommand(serverBuffer, srcAdd);
            }
        }
    }
    return NULL;
}

int udp_send(char *addr_str, char *data)
{
    struct sockaddr_in6 src, dst;
    if (data == NULL) {
        puts("!!!!XX");
        return 1;
    }
    size_t data_len = strlen(data);
    int s;
    src.sin6_family = AF_INET6;
    dst.sin6_family = AF_INET6;
    memset(&src.sin6_addr, 0, sizeof(src.sin6_addr));
    /* parse destination address */
    if (inet_pton(AF_INET6, addr_str, &dst.sin6_addr) != 1) {
        printf("Error: unable to parse destination address: %s", addr_str);
        return 1;
    }
    /* parse port */
    dst.sin6_port = htons(UDP_PORT);
    src.sin6_port = htons(UDP_PORT);
    s = socket(AF_INET6, SOCK_DGRAM, IPPROTO_UDP);
    if (s < 0) {
        puts("error initializing socket");
        return 1;
    }
    if (data == NULL) {
        puts("!!!!");
        return 1;
    }
    if (sendto(s, data, data_len, 0, (struct sockaddr *)&dst, sizeof(dst)) < 0) {
        puts("could not send");
    }
    else {
        if (UDP_VERBOSE > 0) {
            printf("Success: send %u byte to %s:%u data:%s\n", (unsigned)data_len, addr_str, UDP_PORT, data);
        }
    }

    close(s);
    return 0;
}

int udp_send_raw(char *addr_str, char *data, size_t data_len)
{
    struct sockaddr_in6 src, dst;
    if (data == NULL) {
        puts("!!!!XX");
        return 1;
    }
    int s;
    src.sin6_family = AF_INET6;
    dst.sin6_family = AF_INET6;
    memset(&src.sin6_addr, 0, sizeof(src.sin6_addr));
    /* parse destination address */
    if (inet_pton(AF_INET6, addr_str, &dst.sin6_addr) != 1) {
        printf("Error: unable to parse destination address: %s", addr_str);
        return 1;
    }
    /* parse port */
    dst.sin6_port = htons(UDP_PORT);
    src.sin6_port = htons(UDP_PORT);
    s = socket(AF_INET6, SOCK_DGRAM, IPPROTO_UDP);
    if (s < 0) {
        puts("error initializing socket");
        return 1;
    }
    if (data == NULL) {
        puts("!!!!");
        return 1;
    }
    if (sendto(s, data, data_len, 0, (struct sockaddr *)&dst, sizeof(dst)) < 0) {
        puts("could not send");
    }
    else {
        if (UDP_VERBOSE > 0) {
            printf("Success: send %u byte to %s:%u data:%s\n", (unsigned)data_len, addr_str, UDP_PORT, data);
        }
    }

    close(s);
    return 0;
}




int udp_cmd(int argc, char **argv)
{
    if (argc == 3) {
        return udp_send(argv[1], argv[2]);
    }

    printf("usage: %s <IPv6-address> <message>\n", argv[0]);
    return 1;
}

void udp_serverListen(bool state) {
    serverListen = state;
    if (state)
        puts("udp server on");
    else
        puts("udp server off");
}

