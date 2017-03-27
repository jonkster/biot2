#ifndef COMMAND_HANDLER_H
#define COMMAND_HANDLER_H

#include "../common/udp/udp_common.h"

#ifdef __cplusplus
extern "C" {
#endif
void actOnCommand(char *cmdSt, struct in6_addr src_addr);
#ifdef __cplusplus
}
#endif

#endif

