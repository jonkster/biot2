#ifndef _HOUEKEEPER_H_
#define _HOUEKEEPER_H_

#include <stdbool.h>

#define MAX_PERIODIC_TASKS 4
#define HEARTBEAT_TASK     0
#define SCHEDULED_TASK_1   1
#define SCHEDULED_TASK_2   2
#define SCHEDULED_TASK_3   3
#define SCHEDULED_TASK_4   4

#define ONE_SECOND_US        1000000

#ifdef __cplusplus
extern "C" {
#endif


extern void idleTask(void);

void *housekeeping_handler(void *arg);

void rapidHeartbeat(bool state);

/**
 * returns true if the msec value indicates that interval time has passed
 * since the last time schedule was called.
 */
bool schedule(uint32_t microSecs, uint32_t interval, uint8_t taskNumber);

#ifdef __cplusplus
}
#endif

#endif

