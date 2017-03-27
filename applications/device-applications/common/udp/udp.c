#include <inttypes.h>
#include <errno.h>
#include <xtimer.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>

#include "msg.h"
#include "udp_common.h"

#define MUDP_Q_SZ           (8)
#define SERVER_BUFFER_SIZE  (128)
#define UDP_PORT            (8888)

static int server_socket = -1;
static char server_buffer[SERVER_BUFFER_SIZE];
static msg_t msg_q[MUDP_Q_SZ];

extern void actOnCommand(char *cmdSt, char *src_addr);

static void *udp_server_loop(void)
{
    struct sockaddr_in6 server_addr;

    puts("initialising udp server...");

    server_socket = socket(AF_INET6, SOCK_DGRAM, IPPROTO_UDP);

    server_addr.sin6_family = AF_INET6;
    memset(&server_addr.sin6_addr, 0, sizeof(server_addr.sin6_addr));
    server_addr.sin6_port = htons(UDP_PORT);

    if (server_socket < 0)
    {
        printf("initialising udp server - error initializing socket: %s\n", strerror(errno));
        server_socket = 0;
        return NULL;
    }

    if (bind(server_socket, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0)
    {
        server_socket = -1;
        puts("error binding socket");
        return NULL;
    }
    
    printf("Success: started UDP server on port %" PRIu16 "\n", UDP_PORT);

    struct sockaddr_in6 src;
    socklen_t src_len = sizeof(struct sockaddr_in6);
    while (1)
    {
        memset(server_buffer, 0, SERVER_BUFFER_SIZE);
        int res = recvfrom(server_socket, server_buffer, sizeof(server_buffer), 0, (struct sockaddr *)&src, &src_len);

        if (res < 0)
        {
            puts("Error on receive");
        }
        else if (res == 0)
        {
            puts("Peer did shut down");
        }
        else
        {
            server_buffer[strcspn(server_buffer, "\n")] = 0;

            char srcText[IPV6_ADDR_MAX_STR_LEN];
            if (inet_ntop(AF_INET6, &src.sin6_addr, srcText, IPV6_ADDR_MAX_STR_LEN) == NULL) {
                puts("Error: unable to parse source address");
            }
            else
            {
                actOnCommand(server_buffer, srcText);
            }
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
        //printf("Success: send %u byte to %s:%u\n", (unsigned)data_len, addr_str, UDP_PORT);
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

    //printf("Success: sent %u byte(s)\n", (unsigned)data_len);

    close(s);

    return 0;
}


/*
 * trampoline for udp_server_loop()
 */
void *udp_server(void *arg)
{
    (void) arg;
    msg_init_queue(msg_q, MUDP_Q_SZ);

    udp_server_loop();

    puts("WARNING! udp server failed to start");

    /* never reached hopefully */
    return NULL;
}

int udp_cmd(int argc, char **argv)
{
    if (argc == 3) {
        return udp_send(argv[1], argv[2]);
    }

    printf("usage: %s <IPv6-address> <message>\n", argv[0]);
    return 1;
}

/** @} */
