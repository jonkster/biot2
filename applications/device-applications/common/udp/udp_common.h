#ifndef UDP_COMMON_H
#define UDP_COMMON_H

#include <stdbool.h>
#include <netinet/in.h>

#define SERVER_BUFFER_SIZE     (128)
//#define SERVER_BUFFER_SIZE     (128)

#ifdef __cplusplus
extern "C" {
#endif

extern bool led_status;

void udpRunIdleTask(bool state);
void udp_serverListen(bool state);
void *udp_server_loop(void *arg);
int udp_send(char *addr_str, char *data);
int udp_cmd(int argc, char **argv);

#ifdef __cplusplus
}
#endif
#endif /* UDP_COMMON_H */
