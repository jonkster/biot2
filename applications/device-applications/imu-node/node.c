#include <stdio.h>
#include "node.h"
#include "../common/imu/imu.h"
#include "../common/udp/udp_common.h"

myQuat_t orientationQ;

extern void relayMessage(char *cmd, char *data, char *address);

uint32_t usDataUpdateIntervalV   = 5000; // 1500 uS = 1.5mS = 0.0015 secs, 15000 uS = 15 mS = 0.015 secs
//uint32_t usDataUpdateIntervalV   = 1533; // 1500 uS = 1.5mS = 0.0015 secs, 15000 uS = 15 mS = 0.015 secs
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

void sendNodeOrientation(char *me)
{
    if (imuOK)
    {

        uint32_t ts = getCurrentTime();
        int l = snprintf(NULL, 0, "do#%lu:%f:%f:%f:%f#%s", ts, orientationQ.w, orientationQ.x, orientationQ.y, orientationQ.z, me);
        char buffer[l + 1];
        memset(buffer, 0, l+1);
        sprintf(buffer, "do#%lu:%f:%f:%f:%f#%s", ts, orientationQ.w, orientationQ.x, orientationQ.y, orientationQ.z, me);
        udp_send("affe::1", buffer);
    }
}

void sendNodeCalibration(char *me)
{
    if (imuOK)
    {
        int16_t *mc = getMagCalibration();
        int l = snprintf(NULL, 0, "dc#%i:%i:%i:%i:%i:%i#%s", mc[0], mc[1], mc[2], mc[3], mc[4], mc[5], me);
        char buffer[l + 1];
        memset(buffer, 0, l);
        sprintf(buffer, "dc#%i:%i:%i:%i:%i:%i#%s", mc[0], mc[1], mc[2], mc[3], mc[4], mc[5], me);
        udp_send("affe::1", buffer);
    }
}

void sendNodeStatus(char *me)
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

            int l = snprintf(NULL, 0, "ds#%d:%"SCNu32":%d#%s", dof, is.dupInterval, mode, me);
            char buffer[l + 1];
            memset(buffer, 0, l);
            sprintf(buffer, "ds#%d:%"SCNu32":%d#%s", dof, is.dupInterval, mode, me);
            udp_send("affe::1", buffer);
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

