#ifndef _NODES_H
#define _NODES_H

#define MAX_MESSAGE_LENGTH 84


#ifdef __cplusplus
extern "C" {
#endif
void registerNode(char *addr);

void relayMessage(char *cmd, char *data, char *address);

void syncKnown(void);

void initNodes(void);

#ifdef __cplusplus
}
#endif

#endif

