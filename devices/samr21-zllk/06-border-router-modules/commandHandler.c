#include "commandHandler.h"
#include <string.h>
#include <xtimer.h>
#include "board.h"

void actOnCommand(char *cmdSt, struct in6_addr src_addr)
{
    if (strcmp(cmdSt, "on") == 0)
    {
        led_status = true;
        LED0_ON;
    }
    else if (strcmp(cmdSt, "off") == 0)
    {
        led_status = false;
        LED0_OFF;
        LED1_OFF;
        LED_RGB_OFF;
        xtimer_usleep(100000);
        puts("got off sending blue");
        udp_send_jk(src_addr, "blue");
    }
    else if (strcmp(cmdSt, "red") == 0)
    {
        LED0_ON;
        LED_RGB_OFF;
        LED_RGB_R_ON;
        xtimer_usleep(100000);
        puts("got red sending off");
        udp_send_jk(src_addr, "off");
    }
    else if (strcmp(cmdSt, "green") == 0)
    {
        LED0_ON;
        LED_RGB_OFF;
        LED_RGB_G_ON;
        xtimer_usleep(100000);
        puts("got green sending red");
        udp_send_jk(src_addr, "red");
    }
    else if (strcmp(cmdSt, "blue") == 0)
    {
        LED0_ON;
        LED_RGB_OFF;
        LED_RGB_B_ON;
        xtimer_usleep(100000);
        puts("got blue sending green");
        udp_send_jk(src_addr, "green");
    }
}
