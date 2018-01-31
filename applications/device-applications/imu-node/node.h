#ifndef _NODE_H_
#define _NODE_H_

#include <stdint.h>
#include "../common/time/biotTime.h"



#ifdef __cplusplus
extern "C" {
#endif

void dumpAllIMU(void);

bool getCurrentPosition(void);

bool initIMU(void);

void sendNodeOrientation(char *);

void sendNodeCalibration(char *);

void sendNodeStatus(char *);

void setUpdateInterval(uint32_t);

uint32_t usDataUpdateInterval(void);

uint32_t usCalibrationInterval(void);

uint32_t usStatusInterval(void);

#ifdef __cplusplus
}
#endif

#endif

