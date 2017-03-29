#include "commandHandler.h"
#include <string.h>
#include <xtimer.h>
#include "board.h"
#include "../common/identify/biotIdentify.h"
#include "../common/time/biotTime.h"
#include "../common/imu/imu.h"
#include "../common/udp/udp_common.h"
#include "periph/pm.h"

#define MAX_MESSAGE_LENGTH 84


void actOnLedCommandMessage(char *data)
{
    if (strcmp(data, "0") == 0)
    {
        LED0_OFF;
    }
    else if (strcmp(data, "1") == 0)
    {
        LED0_ON;
    }
    else if (strcmp(data, "2") == 0)
    {
        LED0_ON;
    }
    else if (strcmp(data, "3") == 0)
    {
        identifyYourself();
    }
    else
    {
        printf("unknown?%s\n", data);
    }
}

void actOnTimCommandMessage(char *data)
{
    uint32_t t = atoi(data);
    printf("setting time to: %lu\n", t);
    setCurrentTime(t);
}


void actOnRebCommandMessage(char *data)
{
    puts("\n-----\nREBOOTING!\n-----\n");
    pm_reboot();
}

void actOnCavCommandMessage(char* data)
{
    puts("cav not implemented yet");
}

void actOnDofCommandMessage(char* data)
{
    puts("dof not implemented yet");
}

void actOnMcmCommandMessage(char* data)
{
    puts("actOnMcmCommandMessage not implemented yet");
}

void actOnDupCommandMessage(char* data)
{
    puts("actOnDupCommandMessage not implemented yet");
}

void actOnPokeCommandMessage(char* data)
{
    puts("actOnPokeCommandMessage not implemented yet");
}

void actOnSynCommandMessage(char* data)
{
    puts("actOnSynCommandMessage not implemented yet");
}

void relayMessage(char *cmd, char *data, char *address)
{
    char buffer[MAX_MESSAGE_LENGTH];
    memset(buffer, 0, MAX_MESSAGE_LENGTH);
    //printf("relaying cmd:%s with data:%s to:%s\n", cmd, data, address);
    sprintf(buffer, "%s#%s", cmd, data);
    udp_send(address, buffer);
    return;
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
    else if (strcmp(cmd, "cdof") == 0)
    {
        actOnDofCommandMessage(data);
    }
    else if (strcmp(cmd, "ccav") == 0)
    {
        actOnCavCommandMessage(data);
    }
    else if (strcmp(cmd, "cmcm") == 0)
    {
        actOnMcmCommandMessage(data);
    }
    else if (strcmp(cmd, "cdup") == 0)
    {
        actOnDupCommandMessage(data);
    }
    else if (strcmp(cmd, "creb") == 0)
    {
        actOnRebCommandMessage(data);
    }
    else if (strcmp(cmd, "cpok") == 0)
    {
        actOnPokeCommandMessage(data);
    }
    else if (strcmp(cmd, "csyn") == 0)
    {
        actOnSynCommandMessage(data);
    }
    else
    {
        printf("rx unknown router udp msg from %s: '%s'\n", src_addr, cmdSt);
    }
    free(cmd);
    free(data);
}

