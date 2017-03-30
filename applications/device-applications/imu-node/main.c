#include <random.h>
#include <stdbool.h>
#include <stdio.h>
#include <string.h>

#include "board.h"
#include "net/gnrc/netif.h"
#include "net/gnrc/ipv6/netif.h"
#include "net/gnrc/rpl/dodag.h"
#include "net/ipv6/addr.h"
#include "shell_commands.h"
#include "shell.h"

#include <xtimer.h>

#include "node.h"
#include "../common/batch/batch.h"
#include "../common/housekeeper/housekeeper.h"
#include "../common/identify/biotIdentify.h"
#include "../common/time/biotTime.h"
#include "../common/udp/udp_common.h"

#define PRIO    (THREAD_PRIORITY_MAIN + 1)

extern void batch(const shell_command_t *command_list, char *line);
extern void print_help(const shell_command_t *command_list);
extern uint32_t getCurrentTime(void);
extern int udp_cmd(int argc, char **argv);
extern void *udp_server(void *);
extern bool imuReady;

bool led_status = false;
static char housekeeping_stack[THREAD_STACKSIZE_DEFAULT+512]; // may get stack overflow if this too low...
static char udp_stack[THREAD_STACKSIZE_DEFAULT];

char dodagRoot[IPV6_ADDR_MAX_STR_LEN];
char dodagParent[IPV6_ADDR_MAX_STR_LEN];

int about_cmd(int argc, char **argv)
{
    puts("--------------------------------------------------------------------------------------------------");
    puts("This application implements a 6lowPAN Biotz IMU node that can talk to the DODAG root");
    puts("--------------------------------------------------------------------------------------------------");
    return 0;
}

int identify_cmd(int argc, char **argv)
{
    puts("identifying myself...");
    identifyYourself();
    puts("done.");
    return 0;
}

int imu_cmd(int argc, char **argv)
{
    dumpAllIMU();
    return 0;
}

int findParent(void)
{
    if (gnrc_rpl_instances[0].state == 0) {
        puts("no parents...");
        return 1;
    }

    gnrc_rpl_dodag_t *dodag = &gnrc_rpl_instances[0].dodag;
    gnrc_rpl_parent_t *parents = dodag->parents;

    ipv6_addr_to_str(dodagParent, &parents->addr, sizeof(dodagParent));
    printf("parent: %s\n", dodagParent);
    return 0;
}

int findRoot(void)
{
    if (gnrc_rpl_instances[0].state == 0) {
        return 1;
    }

    gnrc_rpl_dodag_t *dodag = &gnrc_rpl_instances[0].dodag; // disable while debugging
    ipv6_addr_to_str(dodagRoot, &dodag->dodag_id, sizeof(dodagRoot)); // disable while debugging
    printf("dodag: %s\n", dodagRoot);
    findParent();
    return 0;
}

bool knowsRoot(void)
{
    return (strlen(dodagRoot) > 0);
}


static int led_control(int argc, char **argv)
{
    if (argc == 2) {
        if (strcmp(argv[1], "on") == 0) {
            led_status = true;
            LED0_ON;
            return 0;
        }
        else if (strcmp(argv[1], "off") == 0) {
            led_status = false;
            LED0_OFF;
            return 0;
        }
        else
        {
            printf("unrecognised switch: %s\n", argv[1]);
        }
    }
    puts("invalid argument count\n");

    return -1;
}

static int time_cmd(int argc, char **argv)
{
    printf("%lu\n", getCurrentTime());
    return 0;
}


static const shell_command_t shell_commands[] = {
    { "about", "system description", about_cmd },
    { "identify", "visually identify board", identify_cmd },
    { "imu", "display IMU information", imu_cmd },
    { "led", "use 'led on|off' to set the LED ", led_control },
    { "time", "show the current time counter", time_cmd },
    { "udp", "send a message: udp <IPv6-address> <message>", udp_cmd },
    { NULL, NULL, NULL }
};

uint32_t lastSecs = 0;
void idleTask(void)
{
    uint32_t microSecs = getCurrentTime();

    // every second...
    if (schedule(microSecs, ONE_SECOND_US, SCHEDULED_TASK_1))
    {
        if (! knowsRoot())
        {
            findRoot();
        }

        if (! imuReady)
        {
            initIMU();
            if (! imuReady)
            {
                initIMU();
            }
        }
    }
    
    getCurrentPosition();

    if (knowsRoot())
    {
        if (schedule(microSecs, usDataUpdateInterval(), SCHEDULED_TASK_2))
        {
            sendNodeOrientation();
        }

        if (schedule(microSecs, usCalibrationInterval(), SCHEDULED_TASK_3))
        {
            sendNodeCalibration();
        }

        if (schedule(microSecs, usStatusInterval(), SCHEDULED_TASK_4))
        {
            sendNodeStatus();
        }
    }
    
}

int main(void)
{
    puts("Type 'help' for a list of available commands");

    LED0_OFF;

    printf("Biotz IMU Node\n");
    about_cmd(0, NULL);
    identify_cmd(0, NULL);
    random_init(getCurrentTime());
    batch(shell_commands, "rpl init 6");

    print_help(shell_commands);


    thread_create(udp_stack, sizeof(udp_stack), PRIO, THREAD_CREATE_STACKTEST, udp_server,
                NULL, "udp");


    thread_create(housekeeping_stack, sizeof(housekeeping_stack), PRIO, THREAD_CREATE_STACKTEST, housekeeping_handler,
                NULL, "housekeeping");

    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(shell_commands, line_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}
