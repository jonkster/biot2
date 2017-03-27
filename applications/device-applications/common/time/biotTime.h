#ifndef _BIOTTIME_H_INCLUDE_
#define _BIOTTIME_H_INCLUDE_

#ifdef __cplusplus
extern "C" {
#endif

uint32_t getCurrentTime(void);

void setCurrentTime(uint32_t t);

bool isTimeSet(void);

void timeInit(void);

bool hasTimeChanged(void);

#ifdef __cplusplus
}
#endif

#endif
