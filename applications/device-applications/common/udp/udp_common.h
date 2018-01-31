#ifndef UDP_COMMON_H
#define UDP_COMMON_H

#include <stdbool.h>
#include <netinet/in.h>

#define SERVER_BUFFER_SIZE     (80)

#ifdef __cplusplus
extern "C" {
#endif

extern bool led_status;

void udpRunIdleTask(bool);
void udp_serverListen(bool);
void *udp_server_loop(void *);
int udp_send(char *, char *);
int udp_send_raw(char *, char *, size_t);
int udp_cmd(int argc, char **argv);

#ifdef __cplusplus
}
#endif
#endif /* UDP_COMMON_H */
