#include "commandHandler.h"
#include <string.h>
#include <xtimer.h>
#include "board.h"
#include "nodes.h"
#include "../common/identify/biotIdentify.h"
#include "../common/time/biotTime.h"
#include "../common/udp/udp_common.h"
#include "periph/pm.h"



void actOnLedCommandMessage(char *data)
{
    if (strcmp(data, "0") == 0)
    {
        LED0_OFF;
        LED_RGB_OFF;
    }
    else if (strcmp(data, "1") == 0)
    {
        LED0_ON;
        LED_RGB_OFF;
        LED_RGB_G_ON;
    }
    else if (strcmp(data, "2") == 0)
    {
        LED0_ON;
        LED_RGB_OFF;
        LED_RGB_G_ON;
    }
    else if (strcmp(data, "3") == 0)
    {
        LED_RGB_OFF;
        LED_RGB_B_ON;
        identifyYourself();
        LED_RGB_OFF;
    }
    else
    {
        printf("unknown?%s\n", data);
    }
}

void actOnTimCommandMessage(char *data)
{
    uint32_t t = atoi(data);
    setCurrentTime(t);
}


void actOnRebCommandMessage(char *data)
{
    puts("\n-----\nREBOOTING!\n-----\n");
    pm_reboot();
}


void actOnCommand(char *cmdSt, char *src_addr)
{
    // extract components of command
    char *cmd = NULL;
    char *data = NULL;
    char *p = strtok(cmdSt, "#");
    if (p > 0)
    {
        cmd = strdup(p);
        p = strtok(NULL, "#");
        if (p)
        {
            data = strdup(p);
            p = strtok(NULL, "#");
            if (p)
            {
                char *address = NULL;
                address = strdup(p);
                if (cmd[0] != 'd')
                {
                    relayMessage(cmd, data, address);
                    free(cmd);
                    free(data);
                    free(address);
                    return;
                }
                free(address);
            }
        }
    }

    if (strcmp(cmd, "cled") == 0)
    {
        actOnLedCommandMessage(data);
    }
    else if (strcmp(cmd, "ctim") == 0)
    {
        actOnTimCommandMessage(data);
    }
    else if (strcmp(cmd, "creb") == 0)
    {
        actOnRebCommandMessage(data);
    }
    else if (strcmp(cmd, "csyn") == 0)
    {
        syncKnown();
    }
    else
    {
        printf("rx unknown router udp msg from %s: '%s'\n", src_addr, cmdSt);
    }
    free(cmd);
    free(data);
}
