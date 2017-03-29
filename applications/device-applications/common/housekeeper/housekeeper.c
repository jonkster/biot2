#include <xtimer.h>
#include "board.h"
#include "housekeeper.h"
#include "../time/biotTime.h"

uint32_t lastTime[MAX_PERIODIC_TASKS + 1] = { 0, 0, 0, 0, 0 };

bool ledState = false;

void beat(void)
{
    if (ledState)
    {
#ifdef HAS_RGB_LED
        LED_RGB_G_ON;
#endif
        LED0_ON;
    }
    else
    {
#ifdef HAS_RGB_LED
        LED_RGB_OFF;
#endif
        LED0_OFF;
    }
    ledState = ! ledState;
}

void *housekeeping_handler(void *arg)
{
    while(1)
    {
        idleTask();
        uint32_t microSecs = getCurrentTime();
        if (schedule(microSecs, ONE_SECOND_US, HEARTBEAT_TASK))
        {
            beat();
        }
    }
}


bool schedule(uint32_t microSecs, uint32_t interval, uint8_t taskNumber)
{
    if (taskNumber > MAX_PERIODIC_TASKS)
    {
        printf("Error!: Cannot schedule more than %i tasks!\n", MAX_PERIODIC_TASKS);
        return false;
}
    bool expired = false;
    if (microSecs - lastTime[taskNumber] > interval)
    {
        lastTime[taskNumber] = microSecs;
        expired = true;
    }
    return expired;
}
