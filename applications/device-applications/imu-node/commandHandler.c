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

bool pokeRequested = false;

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
    uint32_t t = strtoul(data, NULL, 0);
    setCurrentTime(t);
}


void actOnRebCommandMessage(char *data)
{
    puts("\n-----\nREBOOTING!\n-----\n");
    pm_reboot();
}

void actOnCavCommandMessage(char* data)
{
    int16_t cal[6];
    sscanf(data, "%"SCNd16":%"SCNd16":%"SCNd16":%"SCNd16":%"SCNd16":%"SCNd16, &cal[0], &cal[1], &cal[2], &cal[3], &cal[4], &cal[5]);
    setMagCalibration(cal);
    forceReorientation();
}

void actOnDofCommandMessage(char* data)
{
    if (data[0] == '0')
        setGyroUse(false);
    else
        setGyroUse(true);

    if (data[1] == '0')
        setAccelUse(false);
    else
        setAccelUse(true);

    if (data[2] == '0')
        setCompassUse(false);
    else
        setCompassUse(true);
}

void actOnMcmCommandMessage(char *data)
{
    if (strcmp(data, "0") == 0)
    {
        autoCalibrate = false;
    }
    else if (strcmp(data, "1") == 0)
    {
        autoCalibrate = true;
    }
    else
    {
        int16_t cal[] = {0, 0, 0, 0, 0, 0};
        if (strcmp(data, "2") == 0)
        {
            autoCalibrate = true;
            setMagCalibration(cal);
            forceReorientation();
        }
        else if (strcmp(data, "3") == 0)
        {
            autoCalibrate = false;
            setMagCalibration(cal);
            forceReorientation();
        }
        else
        {
            printf("Error: unable to parse calibration mode: %s\n", data);
        }
    }
}

void actOnDupCommandMessage(char* data)
{
    uint32_t t = atoi(data);
    dupInterval = t;
}

void actOnPokeCommandMessage(char* data)
{
    pokeRequested = true;
}

void relayMessage(char *cmd, char *data, char *address)
{
    uint8_t l = strlen(cmd) + strlen(data) + strlen("#") + 1;
    if (l > MAX_MESSAGE_LENGTH) {
        printf("could not print message length: %i '%s#%s'\n", l, cmd, data);
        return;
    }
    char buffer[l];
    memset(buffer, 0, l);
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
    else
    {
        printf("rx unknown router udp msg from %s: '%s'\n", src_addr, cmdSt);
    }
    free(cmd);
    free(data);
}

