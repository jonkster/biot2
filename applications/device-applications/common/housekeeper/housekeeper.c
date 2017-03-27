#include <xtimer.h>
#include "board.h"
#include "housekeeper.h"

void *housekeeping_handler(void *arg)
{
    int factor = 1; 
    while(1)
    {
        idleTask();
#ifdef HAS_RGB_LED
        LED_RGB_G_ON;
#endif
        LED0_ON;
        xtimer_usleep(INTERVAL/(2*factor));
#ifdef HAS_RGB_LED
        LED_RGB_OFF;
#endif
        LED0_OFF;
        xtimer_usleep(INTERVAL/factor);
    }
}
