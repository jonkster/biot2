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

void dumpAllIMU(void)
{
    imuStatus_t is;
    if (getIMUStatus(imuDev, &is))
    {
        printf("raw data: ");
        dumpIMU(imuDev);
        printf("calculated quaternion: ");
        dumpQuat(getPosition(imuDev));
        displayCorrections();
        printf("use gyroscopes     :%s\n", is.useGyroscopes ? "YES":"NO");
        printf("use accelerometers :%s\n", is.useAccelerometers ? "YES":"NO");
        printf("use magnetometers  :%s\n", is.useMagnetometers ? "YES":"NO");
        printf("use calibrate mode :%i\n", is.calibrateMode);
        printf("update interval:%lu (ms)\n", is.dupInterval);
    }
    else
    {
        printf("Cannot communicate with IMU device\n");
    }
}

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
    if (imuOK)
    {
        uint32_t ts = getCurrentTime();
        char buffer[SERVER_BUFFER_SIZE];
        memset(buffer, 0, SERVER_BUFFER_SIZE);
        sprintf(buffer, "do#%lu:%f:%f:%f:%f", ts, orientationQ.w, orientationQ.x, orientationQ.y, orientationQ.z);
        udp_send("affe::2", buffer);
    }
}

void sendNodeCalibration(void)
{
    if (imuOK)
    {
        int16_t *mc = getMagCalibration();
        char buffer[SERVER_BUFFER_SIZE];
        memset(buffer, 0, SERVER_BUFFER_SIZE);
        sprintf(buffer, "dc#%i:%i:%i:%i:%i:%i", mc[0], mc[1], mc[2], mc[3], mc[4], mc[5]);
        udp_send("affe::2", buffer);
    }
}

void sendNodeStatus(void)
{
    if (imuOK)
    {
        imuStatus_t is;
        if (getIMUStatus(imuDev, &is))
        {
            uint8_t dof = 0;
            if (is.useGyroscopes)
                dof += 100;
            if (is.useAccelerometers)
                dof += 10;
            if (is.useMagnetometers)
                dof += 1;

            uint8_t mode = 0;
            if (is.calibrateMode)
                mode = 1;

            char buffer[SERVER_BUFFER_SIZE];
            memset(buffer, 0, SERVER_BUFFER_SIZE);
            sprintf(buffer, "ds#%d:%"SCNu32":%d", dof, is.dupInterval, mode);
            udp_send("affe::2", buffer);
        }
    }
    
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

