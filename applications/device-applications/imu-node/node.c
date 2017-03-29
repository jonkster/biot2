#include <stdio.h>
#include "node.h"
#include "../common/imu/imu.h"
#include "../common/udp/udp_common.h"

myQuat_t orientationQ;

uint32_t usDataUpdateIntervalV   = 50000;
uint32_t usCalibrationIntervalV  = 1500000;
uint32_t usStatusIntervalV       = 2500000;

bool imuReady = false;
bool imuOK = false;

uint8_t retries = 0;

mpu9250_t imuDev;

bool initIMU(void)
{
    if (initialiseIMU(&imuDev))
    {
        displayConfiguration(imuDev);
        imuReady = true;
    }
    else
    {
        puts("could not initialise IMU device");
        imuReady = false;
    }
    return imuReady;
}

bool getCurrentPosition(void)
{
    // at some point, look at making this method determine if read quaternion makes sense.
    if (imuReady)
    {
        orientationQ = getPosition(imuDev);
    }
    imuOK = imuReady;
    return imuReady;
}

void sendNodeOrientation(void)
{
    // need to do this properly!!
    uint32_t ts = getCurrentTime();

    if (imuOK)
    {
printf("prepare...\n");
        char buffer[SERVER_BUFFER_SIZE];
printf("init string\n");
        memset(buffer, 0, SERVER_BUFFER_SIZE);
printf("make string\n");
        sprintf(buffer, "do#%lu:%f:%f:%f:%f", ts, orientationQ.w, orientationQ.x, orientationQ.y, orientationQ.z);
printf("%s\n", buffer);
        udp_send("affe::2", buffer);
printf("sent OK\n");
    }
}

void sendNodeCalibration(void)
{
    // need to do this properly!!
    udp_send("affe::2", "dc#-89:-86:-82:88:3:54");
}

void sendNodeStatus(void)
{
    // need to do this properly!!
    udp_send("affe::2", "ds#111:200:1");
    
}

uint32_t usDataUpdateInterval(void)
{
    return  usDataUpdateIntervalV;
}

uint32_t usCalibrationInterval(void)
{
    return  usCalibrationIntervalV;
}

uint32_t usStatusInterval(void)
{
    return  usStatusIntervalV;
}

