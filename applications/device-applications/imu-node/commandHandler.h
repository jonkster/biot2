#ifndef COMMAND_HANDLER_H
#define COMMAND_HANDLER_H

#include "../common/udp/udp_common.h"

#ifdef __cplusplus
extern "C" {
#endif
long inhibitDelay = 0;
void actOnCommand(char *cmdSt, char *src_addr);
void relayMessage(char *cmd, char *data, char *address);
#ifdef __cplusplus
}
#endif

#endif

