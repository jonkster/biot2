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
#define MAIN_QUEUE_SIZE     (2)
static msg_t _main_msg_queue[MAIN_QUEUE_SIZE];

extern void batch(const shell_command_t *command_list, char *line);
extern void print_help(const shell_command_t *command_list);
extern uint32_t getCurrentTime(void);
extern int udp_cmd(int argc, char **argv);
extern void *udp_server_loop(void *);
extern bool imuReady;
extern void udpRunIdleTask(bool state);
extern void udp_serverListen(bool);

bool led_status = false;
static char housekeeping_stack[THREAD_STACKSIZE_DEFAULT+128]; // may get stack overflow if this too low...
static char udp_stack[THREAD_STACKSIZE_DEFAULT];

char dodagRoot[IPV6_ADDR_MAX_STR_LEN];
char dodagParent[IPV6_ADDR_MAX_STR_LEN];
char me[IPV6_ADDR_MAX_STR_LEN];


int about_cmd(int argc, char **argv)
{
    puts("--------------------------------------------------------------------------------------------------");
    puts("This application implements a 6lowPAN Biotz IMU node that can talk to the DODAG root");
    puts("--------------------------------------------------------------------------------------------------");
    return 0;
}

void getAddress(void)
{
    kernel_pid_t interfaces[GNRC_NETIF_NUMOF];
    size_t ifs = gnrc_netif_get(interfaces);
    if (ifs > 0) {
        gnrc_ipv6_netif_t *entry = gnrc_ipv6_netif_get(interfaces[0]);
        for (int i = 0; i < GNRC_IPV6_NETIF_ADDR_NUMOF; i++) {
            char ipv6_addr[IPV6_ADDR_MAX_STR_LEN];
            ipv6_addr_to_str(ipv6_addr, &entry->addrs[i].addr, IPV6_ADDR_MAX_STR_LEN);
            if (strstr(ipv6_addr, "affe::") == ipv6_addr)
            {
                strncpy(me, ipv6_addr, IPV6_ADDR_MAX_STR_LEN);
                printf("My address is '%s'\n", me);
            }
        }
    }
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


int findRoot(void)
{
    puts("finding root...");
    batch(shell_commands, "rpl init 6");
    if (gnrc_rpl_instances[0].state == 0) {
        puts("fail");
        return 1;
    }

    gnrc_rpl_dodag_t *dodag = &gnrc_rpl_instances[0].dodag; // disable while debugging
    ipv6_addr_to_str(dodagRoot, &dodag->dodag_id, sizeof(dodagRoot)); // disable while debugging
    printf("dodag: %s\n", dodagRoot);
    findParent();
    getAddress();
    return 0;
}

uint8_t c = 0;
uint32_t lastSecs = 0;
void idleTask(void)
{
    uint32_t microSecs = getCurrentTime();

    // every second...
    if (schedule(microSecs, ONE_SECOND_US, SCHEDULED_TASK_1))
    {
        if (! knowsRoot())
        {
            if (c++ % 10 == 0)
            {
                findRoot();
                udp_serverListen(true);
            }
        }

        if (! imuReady)
        {
            rapidHeartbeat(true);
            initIMU();
        }
        else
        {
            rapidHeartbeat(false);
        }
    }
    
    getCurrentPosition();

    if (knowsRoot())
    {
        if (schedule(microSecs, usDataUpdateInterval(), SCHEDULED_TASK_2))
        {
            sendNodeOrientation(me);
        }

        if (schedule(microSecs, usCalibrationInterval(), SCHEDULED_TASK_3))
        {
            sendNodeCalibration(me);
        }

        if (schedule(microSecs, usStatusInterval(), SCHEDULED_TASK_4))
        {
            sendNodeStatus(me);
        }
    }
}

int main(void)
{
    /* we need a message queue for the thread running the shell in order to
     * receive potentially fast incoming networking packets */
    msg_init_queue(_main_msg_queue, MAIN_QUEUE_SIZE);
    batch(shell_commands, "rpl init 6");

    LED0_OFF;

    //random_init(getCurrentTime());

    print_help(shell_commands);

    puts("starting housekeeper thread");
    thread_create(housekeeping_stack, sizeof(housekeeping_stack), PRIO, THREAD_CREATE_STACKTEST, housekeeping_handler, NULL, "housekeeper");

    puts("starting udpserver thread");
    udpRunIdleTask(false);
    thread_create(udp_stack, sizeof(udp_stack), PRIO+1, THREAD_CREATE_STACKTEST, udp_server_loop, NULL, "udp");

    puts("Biotz IMU Node");
    about_cmd(0, NULL);
    puts("Type 'help' for a list of available commands");

    identify_cmd(0, NULL);


    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(shell_commands, line_buf, SHELL_DEFAULT_BUFSIZE);

    /* never reached */
    return 0;
}
