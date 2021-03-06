#include "commandHandler.h"
#include <string.h>
#include <xtimer.h>
#include "board.h"
#include "nodes.h"
#include "../common/identify/biotIdentify.h"
#include "../common/time/biotTime.h"
#include "../common/udp/udp_common.h"
#include "../common/memory/memory.h"
#include "periph/pm.h"

uint8_t count = 0;


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
        LED_RGB_B_ON;
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
    uint32_t t = strtoul(data, NULL, 0);
    setCurrentTime(t);
}

void actOnPokeCommandMessage(void)
{
    //puts("cannot do poke yet...");
}

void actOnRebCommandMessage(char *data)
{
    puts("\n-----\nREBOOTING!\n-----\n");
    pm_reboot();
}

void actOnOrientDataMessage(char* data, char* srcAdd)
{
    updateNodeOrientation(srcAdd, data);
    if (true)
    {
        int l = snprintf(NULL, 0, "%s#%s", data, srcAdd);
        char buffer[l + 1];
        memset(buffer, 0, l);
        sprintf(buffer, "%s#%s", data, srcAdd);
        relayMessage("do", buffer, "affe::1");
    }
}

void actOnCalibrDataMessage(char* data, char* srcAdd)
{
    int l = snprintf(NULL, 0, "%s#%s", data, srcAdd);
    char buffer[l + 1];
    memset(buffer, 0, l);
    sprintf(buffer, "%s#%s", data, srcAdd);
    relayMessage("dc", buffer, "affe::1");
    updateNodeCalibration(srcAdd, data);
}

void actOnStatusDataMessage(char* data, char* srcAdd)
{
    int l = snprintf(NULL, 0, "%s#%s", data, srcAdd);
    char buffer[l + 1];
    memset(buffer, 0, l);
    sprintf(buffer, "%s#%s", data, srcAdd);
    relayMessage("ds", buffer, "affe::1");
    registerNode(srcAdd, data);
}
 

void actOnCommand(char *cmdSt, char *src_addr)
{
    // extract components of command
    char *cmd = NULL;
    char *data = NULL;
    char *p = strtok(cmdSt, "#");
    if (p > 0)
    {
        cmd = safe_strdup("extract cmd", p);
        p = strtok(NULL, "#");
        if (p)
        {
            data = safe_strdup("extract data", p);
            p = strtok(NULL, "#");
            if (p)
            {
                char *address = NULL;
                address = safe_strdup("extract address", p);
                if (cmd[0] != 'd')
                {
                    relayMessage(cmd, data, address);
                    safe_free("free 1 cmd", cmd);
                    safe_free("free 1 data", data);
                    safe_free("free 1 address", address);
                    return;
                }
                safe_free("free 1a address", address);
            }
        }
    }

    if (strcmp(cmd, "do") == 0)
    {
        puts("do - should not get these!");
        actOnOrientDataMessage(data, src_addr);
    }
    else if (strcmp(cmd, "dc") == 0)
    {
        puts("dc - should not get these!");
        actOnCalibrDataMessage(data, src_addr);
    }
    else if (strcmp(cmd, "ds") == 0)
    {
        actOnStatusDataMessage(data, src_addr);
    }

    else if (strcmp(cmd, "cled") == 0)
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
    else if (strcmp(cmd, "cpok") == 0)
    {
        actOnPokeCommandMessage();
    }
    else
    {
        printf("rx unknown router udp msg from %s: '%s'\n", src_addr, cmdSt);
    }
    safe_free("cmd", cmd);
    safe_free("data", data);
}

