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

#define SERVER_MSG_QUEUE_SIZE  (4)
//#define SERVER_MSG_QUEUE_SIZE  (16)
#define UDP_PORT               (8888)

#define UDP_VERBOSE            0  // set == 1 for debugging

static msg_t msg_q[SERVER_MSG_QUEUE_SIZE];

extern void actOnCommand(char *cmdSt, char *src_addr);

static int serverSocket = -1;

void resetNetwork(void)
{
    udp_send("ff02::1", "creb##");
}

void *udp_server_loop(void *arg)
{
    (void) arg;

    puts("initialising udp server...");

    msg_init_queue(msg_q, SERVER_MSG_QUEUE_SIZE);

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
        return NULL;
    }

    if (bind(serverSocket, (struct sockaddr *)&serverSocketAddr, sizeof(serverSocketAddr)) < 0)
    {
        serverSocket = -1;
        puts("error binding socket");
        return NULL;
    }

    puts("OK");

    static char serverBuffer[SERVER_BUFFER_SIZE];
    for(;;)
    {
        memset(serverBuffer, 0, SERVER_BUFFER_SIZE);

        struct sockaddr_in6 src;
        socklen_t srcLen = sizeof (src);
        bzero(&src, srcLen);

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
            xtimer_usleep(100);
        }
        else if (res == 0)
        {
            puts("Peer did shut down");
        }
        else if (res >= SERVER_BUFFER_SIZE)
        {
            puts("OVERFLOW!");
        }
        else
        {
            if (UDP_VERBOSE > 0)
                printf("rx from: %s data:%s\n", srcAdd, serverBuffer);
            actOnCommand(serverBuffer, srcAdd);
        }
    }
    return NULL;
}

int udp_send(char *addr_str, char *data)
{
    struct sockaddr_in6 src, dst;
    size_t data_len = strlen(data);
    //uint16_t port;
    int s;
    src.sin6_family = AF_INET6;
    dst.sin6_family = AF_INET6;
    memset(&src.sin6_addr, 0, sizeof(src.sin6_addr));
    /* parse destination address */
    if (inet_pton(AF_INET6, addr_str, &dst.sin6_addr) != 1) {
        puts("Error: unable to parse destination address");
        return 1;
    }
    /* parse port */
    //port = (uint16_t)atoi(port_str);
    dst.sin6_port = htons(UDP_PORT);
    src.sin6_port = htons(UDP_PORT);
    s = socket(AF_INET6, SOCK_DGRAM, IPPROTO_UDP);
    if (s < 0) {
        puts("error initializing socket");
        return 1;
    }
    if (sendto(s, data, data_len, 0, (struct sockaddr *)&dst, sizeof(dst)) < 0) {
        puts("could not send");
    }
    else {
        if (UDP_VERBOSE > 0)
            printf("Success: send %u byte to %s:%u data:%s\n", (unsigned)data_len, addr_str, UDP_PORT, data);
    }

    close(s);
    return 0;
}


int udp_send_jk(struct in6_addr destAdd, char *data)
{
    struct sockaddr_in6 src, dst;
    size_t data_len = strlen(data);
    int s;
    src.sin6_family = AF_INET6;
    dst.sin6_family = AF_INET6;
    memset(&src.sin6_addr, 0, sizeof(src.sin6_addr));
    dst.sin6_addr = destAdd;
    /* parse destination address */

    dst.sin6_port = htons(UDP_PORT);
    src.sin6_port = htons(UDP_PORT);

    s = socket(AF_INET6, SOCK_DGRAM, IPPROTO_UDP);

    if (s < 0) {
        printf("sending udp data JK - error initializing socket: %i\n", s);
        return 1;
    }

    if (sendto(s, data, data_len, 0, (struct sockaddr *)&dst, sizeof(dst)) < 0) {
        puts("error: could not send message");
        close(s);
        return 1;
    }

    if (UDP_VERBOSE > 0)
        printf("Success: sent %u byte(s)\n", (unsigned)data_len);

    close(s);

    return 0;
}


/*
 * trampoline for udp_server_loop()
 */
//void *udp_server(void *arg)
//{
    //(void) arg;
//
    //udp_server_loop();
//
    //puts("WARNING! udp server failed to start");
//
    ///* never reached hopefully */
    //return NULL;
//}

int udp_cmd(int argc, char **argv)
{
    if (argc == 3) {
        return udp_send(argv[1], argv[2]);
    }

    printf("usage: %s <IPv6-address> <message>\n", argv[0]);
    return 1;
}

/** @} */
