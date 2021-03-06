#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <sys/ioctl.h>
#include <unistd.h>
#include <stdio.h>
#include <stdbool.h>
#include <errno.h>
#include <poll.h>
#include <sys/mman.h>
#include <assert.h>
#include <net/if.h>
#include <ifaddrs.h>
#include <netdb.h>

#define BROKER_BROADCAST_PORT     8890
//#define LOCAL_NETWORK_SEGMENT  "10.1.1"
//#define LOCAL_NETWORK_SEGMENT  "192.168.0"

#include "erbridge.h"

//#define DEBUG (1)

int makeBroadcastSendInterface(const char *address, const int port)
{
    int sock;

    sock = socket(AF_INET, SOCK_DGRAM, 0);
    if (sock < 0)
    {
        perror("could not make socket to broker");
        return sock;
    }
    int bcast = 1;
    if (setsockopt(sock, SOL_SOCKET, SO_BROADCAST, &bcast, sizeof(bcast)) < 0)
    {
        perror("could not set socket to broadcast mode");
        close(sock);
        return -1;
    }

    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_port = htons(port);
    inet_pton(AF_INET, address, &addr.sin_addr);
    connect(sock, (struct sockaddr *)&addr, sizeof(addr));
    return sock;
}

bool isDataReady(int sock)
{
        struct pollfd ufds;
        ufds.fd = sock;
        ufds.events = POLLIN | POLLPRI; // check for normal or out-of-band
        int rv = poll(&ufds, 1, 0);

        if (rv == -1)
        {
            perror("error in poll??");
            return false;
        }
        else if (rv == 0)
        {
            return false;
        }
        return true;
}

long listenToSocket(int sock, char *buffer, long maxLen)
{
	struct sockaddr_storage src_addr;
	socklen_t src_addr_len = sizeof(src_addr);

	memset(buffer, 0, maxLen);

	ssize_t count = recvfrom(sock, buffer, maxLen, 0, (struct sockaddr*)&src_addr, &src_addr_len);
	if (count < 0)
	{
		printf("%s", strerror(errno));
		return 0;
	}
	else if (count == 0)
	{
		puts("??");
	}
	else if (count >= maxLen)
	{
		printf("datagram too large for buffer: truncated (%zd >= %i)", count, (int) maxLen);
		return 0;
	}

	char ipstr[INET6_ADDRSTRLEN];
        //int port;
	if (src_addr.ss_family == AF_INET)
	{
		struct sockaddr_in *s = (struct sockaddr_in *)&src_addr;
		//port = ntohs(s->sin_port);
		inet_ntop(AF_INET, &s->sin_addr, ipstr, sizeof ipstr);
	}
	else
	{
		struct sockaddr_in6 *s = (struct sockaddr_in6 *)&src_addr;
		//port = ntohs(s->sin6_port);
		inet_ntop(AF_INET6, &s->sin6_addr, ipstr, sizeof ipstr);
	}
	return count;
}

int listenForResponse(char **address, int *port)
{
    int sock;
    int reuseaddr = 1;
    struct sockaddr_in addr;

    sock = socket(AF_INET, SOCK_DGRAM, 0);
    if (sock < 0)
    {
        printf("error opening socket: %s\n", strerror(errno));
        exit(0);

    }
    setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, &reuseaddr, sizeof(reuseaddr));

    addr.sin_family = AF_INET;
    addr.sin_port = htons(BROKER_BROADCAST_PORT);
    addr.sin_addr.s_addr = INADDR_ANY;

    if (bind(sock, (struct sockaddr *)&addr, sizeof(addr)) < 0)
    {
        printf("error binding to socket: %s\n", strerror(errno));
        exit(0);
    }
    usleep(1000);
    if (isDataReady(sock))
    {
        char buffer[180];
        long count = listenToSocket(sock, buffer, sizeof(buffer));
        if (count > 0)
        {
            printf("rx response to broadcast: %s\n", buffer);
            char *p = strtok(buffer, ":");
            if (p != NULL)
            {
                *address = strdup(p);
                p = strtok(NULL, ":");
                if (p != NULL)
                {
                    *port = atoi(p);
                }
                close(sock);
                return(1);
            }
        }
    }
    close(sock);
    return(0);
}

char* localNetworkPrefix()
{
	struct ifaddrs *ifaddr;
	if (getifaddrs(&ifaddr) == -1)
	{
		perror("getifaddrs failed - what is my IP address?");
		exit(EXIT_FAILURE);
	}
	char* prefix = malloc(NI_MAXHOST * sizeof(char*));
	memset(prefix, '\0', NI_MAXHOST);

	struct ifaddrs *ifa;
	int n;
	for (ifa = ifaddr, n = 0; ifa != NULL; ifa = ifa->ifa_next, n++)
	{
		if (ifa->ifa_addr == NULL)
		{
			continue;
		}

		int family = ifa->ifa_addr->sa_family;

		/*printf("%-8s %s (%d)\n",
				ifa->ifa_name,
				(family == AF_PACKET) ? "AF_PACKET" :
				(family == AF_INET) ? "AF_INET" :
				(family == AF_INET6) ? "AF_INET6" : "???",
				family);*/

		if (family == AF_INET) {
			char host[NI_MAXHOST];
			int s = getnameinfo(ifa->ifa_addr,
					(family == AF_INET) ? sizeof(struct sockaddr_in) :
					sizeof(struct sockaddr_in6),
					host, NI_MAXHOST,
					NULL, 0, NI_NUMERICHOST);
			if (s != 0) {
				printf("getnameinfo() failed: %s\n", gai_strerror(s));
				exit(EXIT_FAILURE);
			}
			if (strcmp(host, "127.0.0.1") != 0)
			{
				printf("my address: %s\n", host);
				char* endP = strrchr(host, '.');
				*endP = '\0';
				printf("network prefix: %s\n", host);
				strncpy(prefix, host, strlen(host));
			}

		}
	}
	freeifaddrs(ifaddr);
	return prefix;
}

char* makeAddress(char* prefix, uint8_t i)
{
        int l = snprintf(NULL, 0, "%s.%d", prefix, i);
        char *address = malloc(l + 1);
	snprintf(address, l + 1, "%s.%d", prefix, i);
	return address;
}


void sendBroadcast(char *buf, char* prefix, uint8_t i)
{
	char* address = makeAddress(prefix, i);
	int sock = makeBroadcastSendInterface(address, BROKER_PORT);
	if (sock > 0)
	{
#ifdef DEBUG
		printf("sending %zu bytes to %s:%i -> %s\n", strlen(buf), address, BROKER_PORT, buf); 
#endif
		send(sock, buf, strlen(buf), 0);
	}
	else
	{
		perror("could not send to broker");
	}
	close(sock);
	free(address);
	return;
}

int findBroker(char **address, int *port, bool slow)
{
	printf("find broker...\n");
        int l = snprintf(NULL, 0, "biot er on port %d", BROKER_PORT);
	char* prefix = localNetworkPrefix();
	if (strlen(prefix) > 0)
	{
		char *broadcastMessage = malloc(l + 1);
		for (uint8_t i = 1; i < 255; i++) {

			snprintf(broadcastMessage, l + 1, "biot er on port %d", BROKER_PORT);
			sendBroadcast(broadcastMessage, prefix, i);
			if (listenForResponse(address, port))
			{
				printf("got it...\n");
				free(prefix);
				return 1;
			}
			if (slow)
				sleep(3);   /* Avoids flooding the network */
		}
	}
	free(prefix);
        return 0;
}

