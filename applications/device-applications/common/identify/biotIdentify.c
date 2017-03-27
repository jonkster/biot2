#include <stdio.h>
#include <stdbool.h>
#include <string.h>
#include "biotIdentify.h"
#include <xtimer.h>
#include "board.h"

void identifyYourself(void)
{
    for (uint8_t i = 0; i < 3; i++)
    {
        for (uint8_t j = 0; j < 10; j++)
        {
#ifdef HAS_RGB_LED
            LED_RGB_G_ON;
#endif
            LED0_ON;
            xtimer_usleep(50000);
#ifdef HAS_RGB_LED
            LED_RGB_OFF;
#endif
            LED0_OFF;
            xtimer_usleep(50000);
        }
        xtimer_usleep(1000000);
    }
}
