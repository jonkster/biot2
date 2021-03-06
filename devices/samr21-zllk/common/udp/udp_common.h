#ifndef UDP_COMMON_H
#define UDP_COMMON_H

#include <stdbool.h>
#include <netinet/in.h>


#ifdef __cplusplus
extern "C" {
#endif

extern bool led_status;
void *udp_server(void *);
int udp_send_jk(struct in6_addr destAdd, char *data);
int udp_cmd(int argc, char **argv);

#ifdef __cplusplus
}
#endif
#endif /* UDP_COMMON_H */
