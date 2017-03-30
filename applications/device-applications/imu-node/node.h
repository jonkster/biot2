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

void sendNodeOrientation(void);

void sendNodeCalibration(void);

void sendNodeStatus(void);

uint32_t usDataUpdateInterval(void);

uint32_t usCalibrationInterval(void);

uint32_t usStatusInterval(void);

#ifdef __cplusplus
}
#endif

#endif

