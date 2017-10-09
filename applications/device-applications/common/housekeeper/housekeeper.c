#include <xtimer.h>
#include "board.h"
#include "housekeeper.h"
#include "../time/biotTime.h"

uint32_t lastTime[MAX_PERIODIC_TASKS + 1] = { 0, 0, 0, 0, 0 };
bool rapidBeat = false;

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

void heartFire(void)
{
    uint32_t microSecs = getCurrentTime();
    if (rapidBeat)
    {
        if (schedule(microSecs, ONE_SECOND_US/3, HEARTBEAT_TASK))
        {
            beat();
        }
    }
    else
    {
        if (schedule(microSecs, ONE_SECOND_US, HEARTBEAT_TASK))
        {
            beat();
        }
    }
}

void rapidHeartbeat(bool state)
{
    rapidBeat = state;
}

/**
**  use if setting heartbeat as a seperate thread
**/
void *housekeeping_handler(void *arg)
{
    while(1)
    {
        idleTask();
        heartFire();
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
