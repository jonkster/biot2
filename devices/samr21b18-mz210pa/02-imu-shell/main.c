#include <stdio.h>
#include <string.h>
#include <stdbool.h>

#include "random.h"
#include "shell.h"
#include "positionmaths.h"
#include "batch.h"
#include "imu.h"
#include "xtimer.h"

#define PRIO    (THREAD_PRIORITY_MAIN + 1)
static char hkp_stack[THREAD_STACKSIZE_DEFAULT];


bool imuReady = false;
myQuat_t currentPosition;
int32_t timeCorrection = 0;

/* ########################################################################## */


mpu9250_t imuDev;

int identify_cmd(int argc, char **argv)
{
    puts("identifying myself...");
    for (uint8_t i = 0; i < 3; i++)
    {
        for (uint8_t j = 0; j < 10; j++)
        {
            LED0_OFF;
            xtimer_usleep(50000);
            LED0_ON;
            xtimer_usleep(50000);
        }
        xtimer_usleep(1000000);
    }
    puts("done.");
    return 0;
}


bool initIMU(void)
{
    if (initialiseIMU(&imuDev))
    {
        displayConfiguration(imuDev);
        return true;
    }
    else
    {
        puts("could not initialise IMU device");
        return false;
    }
}

int about_cmd(int argc, char **argv)
{
    puts("--------------------------------------------------------------------------------------------------");
    puts("This test application implements an IMU9250 based system and an associated shell for accessing it.");
    puts("--------------------------------------------------------------------------------------------------");
    return 0;
}

int imu_cmd(int argc, char **argv)
{
    imuData_t imuData;
    if (getIMUData(imuDev, &imuData))
    {
        displayData(imuData);
        return 0;
    }
    else
    {
        puts("could not read IMU device");
        return 1;
    }
}

int imuinit_cmd(int argc, char **argv)
{
    imuReady = false;
    return 0;
}

int imustatus_cmd(int argc, char **argv)
{
    imuStatus_t imuStatus;
    if (getIMUStatus(imuDev, &imuStatus))
    {
        char buffer[42];
        translateStatus(&imuStatus, buffer);
        printf("status msg: %s\n", buffer);
        return 0;
    }
    puts("could not read IMU device");
    return 1;
}

int mag_cmd(int argc, char **argv)
{
    displayCorrections();
    return 0;
}

int quat_cmd(int argc, char **argv)
{
    dumpQuat(currentPosition);
    return 0;
}

int sensor_cmd(int argc, char **argv)
{
    printf("gyro: ");
    if (getGyroUse())
        puts("on");
    else
        puts("off");
    printf("accelerometer: ");
    if (getAccelUse())
        puts("on");
    else
        puts("off");
    printf("magnetometer: ");
    if (getCompassUse())
        puts("on");
    else
        puts("off");
    return 0;
}


int accel_cmd(int argc, char **argv)
{
    if (argc == 2) {
        if (strcmp(argv[1], "on") == 0)
        {
            setAccelUse(true);
            return 0;
        }
        else if (strcmp(argv[1], "off") == 0)
        {
            setAccelUse(false);
            return 0;
        }
        else if (strcmp(argv[1], "status") == 0)
        {
            return sensor_cmd(0, NULL);
        }
    }
    else if (argc == 1) {
        return sensor_cmd(0, NULL);
    }
    printf("usage: %s [on|off|status]\n", argv[0]);
    return 1;
}

int compass_cmd(int argc, char **argv)
{
    if (argc == 2) {
        if (strcmp(argv[1], "on") == 0)
        {
            setCompassUse(true);
            return 0;
        }
        else if (strcmp(argv[1], "off") == 0)
        {
            setCompassUse(false);
            return 0;
        }
        else if (strcmp(argv[1], "status") == 0)
        {
            return sensor_cmd(0, NULL);
        }
    }
    else if (argc == 1) {
        return sensor_cmd(0, NULL);
    }
    printf("usage: %s [on|off|status]\n", argv[0]);
    return 1;
}

int repos_cmd(int argc, char **argv)
{
    initialisePosition();
    return 0;
}

int gyro_cmd(int argc, char **argv)
{
    if (argc == 2) {
        if (strcmp(argv[1], "on") == 0)
        {
            setGyroUse(true);
            return 0;
        }
        else if (strcmp(argv[1], "off") == 0)
        {
            setGyroUse(false);
            return 0;
        }
        else if (strcmp(argv[1], "status") == 0)
        {
            return sensor_cmd(0, NULL);
        }
    }
    else if (argc == 1) {
        return sensor_cmd(0, NULL);
    }
    printf("usage: %s [on|off|status]\n", argv[0]);
    return 1;
}

static const shell_command_t shell_commands[] = {
    { "about", "system description", about_cmd },
    { "accel", "use accelerometer on/off", accel_cmd },
    { "compass", "use compass on/off", compass_cmd },
    { "gyro", "use gyro on/off", gyro_cmd },
    { "identify", "visually identify board", identify_cmd },
    { "imu", "get IMU position data", imu_cmd },
    { "imuinit", "reset IMU", imuinit_cmd },
    { "imustatus", "get status", imustatus_cmd },
    { "mag", "display compass correction data", mag_cmd },
    { "quat", "get IMU orientation", quat_cmd },
    { "repos", "reset node orientation", repos_cmd },
    { "sensors", "current sensor status", sensor_cmd },
    { NULL, NULL, NULL }
};



uint32_t getCurrentTime(void)
{
    return xtimer_now().ticks32 - timeCorrection;
}


void *houseKeeper(void *arg)
{
    uint32_t lastSecs = 0;

    imuReady = initIMU();
    identify_cmd(0, NULL);
    about_cmd(0, NULL);
    print_help(shell_commands);
    random_init(getCurrentTime());
    uint32_t scheduleOffset = random_uint32_range(0, dupInterval-1);

    while(1)
    {
        if (! imuReady)
        {
            imuReady = initIMU();
        }


        uint32_t mSecs = getCurrentTime()/1500;
        uint32_t secs = mSecs/1000;
        if (mSecs % dupInterval == scheduleOffset)
        {
            if (imuReady)
            {
                currentPosition = getPosition(imuDev);
            }
        }

        if (secs != lastSecs)
        {
            if (secs % 2 == 0)
            {
                LED0_OFF;
            }
            else
            {
                LED0_ON;
            }
        }
        lastSecs = secs;
        thread_yield();
    }
}


int main(void)
{
    puts("IMU shell");
    LED0_OFF;


    makeIdentityQuat(&currentPosition);

    thread_create(hkp_stack, sizeof(hkp_stack), PRIO, THREAD_CREATE_STACKTEST, houseKeeper, NULL, "housekeer");

    timeCorrection = 0;

    puts("starting shell");
    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(shell_commands, line_buf, SHELL_DEFAULT_BUFSIZE);

    /* never reached */
    return 0;
}
