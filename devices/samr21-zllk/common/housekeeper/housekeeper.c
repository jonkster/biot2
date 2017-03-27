#include <xtimer.h>
#include "board.h"
#include "housekeeper.h"

void *housekeeping_handler(void *arg)
{
    int factor = 1; 
    while(1)
    {
        idleTask();
        LED0_OFF;
        xtimer_usleep(INTERVAL/(2*factor));
        LED0_ON;
        xtimer_usleep(INTERVAL/factor);
    }
}
