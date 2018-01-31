#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>
#include <stdio.h>
#include <stdbool.h>
#include <errno.h>
#include <poll.h>
#include <sys/mman.h>
#include <glib.h>
#include <assert.h>


#include "erbridge.h"
#include "findBroker.h"

extern int findBroker(char **address, int *port, bool slow);
extern size_t uncompress(const unsigned char *compressed, const size_t compressedSize, char *text);

static GHashTable *addressTable;
static long long *lastT;
static char *lastA;

//#define DEBUG (0)

long long strToLL(char * st)
{
	char *restOfData;
	long long t = strtoll(st, &restOfData, 10);
	return t;
}

char *LLToStr(long long i)
{
	const int n = snprintf(NULL, 0, "%lld", i);
	assert(n > 0);
	char *st = g_malloc(sizeof(char) * (n+1));
	int c = snprintf(st, n+1, "%lld", i);
	assert(st[n] == '\0');
	assert(c == n);
	return st;
}

long long getAddressLastTimeStamp(char *address, long long defaultV)
{
	if (! g_hash_table_contains(addressTable, address))
	{
		char *lastTs = LLToStr(defaultV);
		g_hash_table_insert(addressTable, address, lastTs);
		return defaultV;
	}
	gchar *lastTs = (gchar *) g_hash_table_lookup(addressTable, address);
	return strToLL(lastTs);
}

bool setAddressLastTimeStamp(char *address, long long t)
{
	char *lastTs = LLToStr(t);
	g_hash_table_replace(addressTable, address, lastTs);
	return true;
}

int makeBrokerInterface(const char *address, const int port)
{
    int sock;
    struct sockaddr_in addr;

    sock = socket(AF_INET, SOCK_DGRAM, 0);
    if (sock < 0)
    {
        perror("could not make socket to broker");
        return sock;
    }
    addr.sin_family = AF_INET;
    addr.sin_port = htons(port);
    inet_pton(AF_INET, address, &addr.sin_addr);
    connect(sock, (struct sockaddr *)&addr, sizeof(addr));
#ifdef DEBUG
    puts("interface made");
#endif
    return sock;
}

int makeBiotInterface(const char *address, const int port)
{
    int sock;

    sock = socket(AF_INET6, SOCK_DGRAM, 0);
    if (sock < 0)
    {
        perror("could not make socket to broker");
    }
    return sock;

}

void relayToBroker(char *buf, int size)
{
	int sock = makeBrokerInterface(brokerAddress, brokerPort);
	if (sock > 0)
	{
#ifdef DEBUG
		printf("sending %i bytes to %s:%i -> %s\n", size, brokerAddress, brokerPort, buf); 
#endif
		send(sock, buf, strlen(buf), 0);
#ifdef DEBUG
		puts("sent");
#endif
	}
	else
	{
		perror("could not send to broker");
	}
#ifdef DEBUG
	puts("done");
#endif
	close(sock);
	return;
}

void relayToBiots(char *buffer, int size)
{
	char *cmd = NULL;
	char *data = NULL;
	char *address = NULL;
	char *p = strtok(buffer, "#");
	if (p > 0)
	{
		cmd = strdup(p);
		p = strtok(NULL, "#");
		if (p)
		{
			data = strdup(p);
			p = strtok(NULL, "#");
			if (p)
			{
				address = strdup(p);
				if (cmd[0] == 'c')
				{
					snprintf(buffer, size, "%s#%s", cmd, data);
#ifdef DEBUG
					printf("sending %i bytes to %s:%i -> %s\n", (uint) strlen(buffer), address, SIXLOWPAN_PORT, buffer); 
#endif
					int sock = socket(AF_INET6, SOCK_DGRAM, 0);
					if (sock < 0)
					{
						perror("could not make socket to broker");
					}
					if (sock > 0)
					{
						struct sockaddr_in6 srv_addr;
						memset (&srv_addr, 0, sizeof(srv_addr));
						srv_addr.sin6_family = AF_INET6;
						srv_addr.sin6_port = htons (SIXLOWPAN_PORT);
						if (inet_pton (AF_INET6, address, &srv_addr.sin6_addr) > 0)
						{
							socklen_t len = sizeof(srv_addr);
							ssize_t res = sendto (sock, buffer, strlen(buffer), 0, (struct sockaddr*) &srv_addr, len);
							if (res < 0)
							{
								puts("send to fail");
							}
						}
						else
						{
							puts("inet_pton fail");
						}
#ifdef DEBUG
						puts("sent");
#endif
					}
					else
					{
						perror("could not send to broker");
					}
#ifdef DEBUG
					puts("done");
#endif
					close(sock);
				}
				free(address);
			}
			free(data);
		}
		free(cmd);
	}
	return;
}

void expand(char *msg)
{
	char tmp[(strlen(msg)+3)];
	if (msg[0] == 'a')
	{
		strcpy(tmp, "do#");
	}
	else if (msg[0] == 'b')
	{
		strcpy(tmp, "dc#");
	}
	else if (msg[0] == 'c')
	{
		strcpy(tmp, "ds#");
	}
	else
	{
		return;
	}
	strcat(tmp, msg+1);
		strcpy(msg, tmp);
}

bool splitCmdDataAddress(char *msg, char *cmd, char *data, char *address)
{
	expand(msg);
	char *buffer  = strdup(msg);
	char *p = strtok(buffer, "#");
	if (p > 0)
	{
		strcpy(cmd, p);
		p = strtok(NULL, "#");
		if (p)
		{
			strcpy(data, p);
			p = strtok(NULL, "#");
			if (p)
			{
				strcpy(address, p);
				free(buffer);
				return true;
			}
		}
	}
	free(buffer);
	return false;
}

void getStats(char *buffer, size_t count)
{
	// analyse time signals in messages like:
	//   do#872189213:0.534112:-0.462497:-0.568163:-0.421914#affe::7a6f:3b4b:4bab:3902

	char cmd[5];
	char data[64];
	char address[64];
	if (splitCmdDataAddress(buffer, cmd, data, address))
	{
		if (strcmp(cmd, "do") == 0)
		{
			long long t = strToLL(data);
			*lastT = t;
			strcpy(lastA, address);
		}
	}
}

			
long listenToSock(int sock, char *buffer, long maxLen)
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

	//#ifdef DEBUG
	char ipstr[INET6_ADDRSTRLEN];
	int port;
	if (src_addr.ss_family == AF_INET)
	{
		struct sockaddr_in *s = (struct sockaddr_in *)&src_addr;
		port = ntohs(s->sin_port);
		inet_ntop(AF_INET, &s->sin_addr, ipstr, sizeof ipstr);
	}
	else
	{
		struct sockaddr_in6 *s = (struct sockaddr_in6 *)&src_addr;
		port = ntohs(s->sin6_port);
		inet_ntop(AF_INET6, &s->sin6_addr, ipstr, sizeof ipstr);
	}
	//#endif
	if (strstr(ipstr, "affe") != NULL)
	{
		char decompressed[256];
		memset(decompressed, 0, sizeof(decompressed));
		size_t decompressedLength = uncompress((unsigned char*)buffer, count,  decompressed);
		if (decompressedLength > count)
		{
			strcpy(buffer, decompressed);
		}
		else
		{
			printf("WOAH! problem with uncompression? nulling message %i bytes from %s:%i\n", (int)count, ipstr, port);
			count = 0;
			strcpy(buffer, "");
		}
	}
	//printf("'%s'   - %i bytes from %s:%i\n", buffer, (int)count, ipstr, port);
	getStats(buffer, count);
	return count;
}

bool dataReady(int sock)
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

int makeBiotListener(void)
{
    int sock;
    int reuseaddr = 1;
    struct sockaddr_in6 addr;

    sock = socket(AF_INET6, SOCK_DGRAM, 0);
    if (sock < 0)
    {
        printf("error opening socket: %s\n", strerror(errno));
        exit(0);

    }
    setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, &reuseaddr, sizeof(reuseaddr));

    addr.sin6_family = AF_INET6;
    addr.sin6_port = htons(SIXLOWPAN_PORT);
    addr.sin6_addr = in6addr_any;

    if (bind(sock, (struct sockaddr *)&addr, sizeof(addr)) < 0)
    {
            printf("error binding to socket: %s\n", strerror(errno));
            exit(0);
    }
    return sock;
}

int makeBrokerListener(void)
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
    addr.sin_port = htons(brokerPort);
    addr.sin_addr.s_addr = INADDR_ANY;

    if (bind(sock, (struct sockaddr *)&addr, sizeof(addr)) < 0)
    {
            printf("error binding to socket: %s\n", strerror(errno));
            exit(0);
    }
    return sock;
}

void mainLoop(int biotSock, int brokerSock)
{
    int pid;
    char buffer[547];

    lastT = mmap(NULL, sizeof *lastT, PROT_READ | PROT_WRITE, MAP_SHARED | MAP_ANONYMOUS, -1, 0);
    *lastT = 0;
    lastA = mmap(NULL, 40, PROT_READ | PROT_WRITE, MAP_SHARED | MAP_ANONYMOUS, -1, 0);
    strcpy(lastA, "?");

    addressTable = g_hash_table_new_full(g_str_hash, g_str_equal, NULL, NULL);

    while (1) {
        if (dataReady(biotSock))
	{
#ifdef DEBUG
		puts("got biot data!");
#endif
		long long ts = getAddressLastTimeStamp(lastA, *lastT);
		long long delay = (*lastT - ts) / 1000;
		//printf(" %s  = %lld mS    (%lld - %lld)\n", lastA, delay, *lastT, ts);
		setAddressLastTimeStamp(lastA, *lastT);
		pid = fork();
		if (pid == -1) {
			// something broke when forking :(
			return;
		} else if (pid == 0) {
			// I am the child - handle incoming data and return
			long count = listenToSock(biotSock, buffer, sizeof(buffer));
			if (count > 0)
			{
				if ((delay > 50))
				{
					printf("slow %s  = %lld mS    (%lld - %lld)\n", lastA, delay, *lastT, ts);
				}
				relayToBroker(buffer, count);
			}
			exit(0);
		} else {
			// I am the parent, suspend until the child pid returns
			waitpid(pid, NULL, 0);
		}
	}
        else if (dataReady(brokerSock))
        {
#ifdef DEBUG
            puts("got broker data!");
#endif
            pid = fork();
            if (pid == -1) {
                // something broke when forking :(
                return;
            } else if (pid == 0) {
                // I am the child - handle incoming data and return
                long count = listenToSock(brokerSock, buffer, sizeof(buffer));
                if (count > 0)
                {
                    relayToBiots(buffer, count);
                }
                exit(0);
            } else {
                // I am the parent, suspend until the child pid returns
                waitpid(pid, NULL, 0);
            }
        }
    }
}

int main()
{
        printf("main\n");
	int brokerFound = 0;
	while (! brokerFound) {
		brokerFound = findBroker(&brokerAddress, &brokerPort, false);
		if (brokerFound)
		{
			printf("broker at %s:%d\n", brokerAddress, brokerPort);
			break;
		}
		printf("looking for broker...\n");
	}
	printf("found broker...\n");
	if ((brokerPort > 1000) && (strlen(brokerAddress) > 7))
	{

		int biotSock = makeBiotListener();
		if (biotSock == -1)
		{
			perror("failed to make BIOT listener");
			exit(1);
		}
		int brokerSock = makeBrokerListener();
		if (brokerSock == -1)
		{
			perror("failed to make Broker listener");
			exit(1);
		}

		mainLoop(biotSock, brokerSock);
	}
	else
	{
		printf("could not parse broker details: '%s' '%d'\n", brokerAddress, brokerPort);
	}

	free(brokerAddress);
        printf("bridge done\n");
	return(0);
}
