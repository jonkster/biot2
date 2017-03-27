#ifndef _HOUEKEEPER_H_
#define _HOUEKEEPER_H_

/* set interval to 1 second */
#define INTERVAL (1000000U)

extern void idleTask(void);

void *housekeeping_handler(void *arg);

#endif
