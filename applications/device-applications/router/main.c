#include <stdio.h>
#include "shell.h"
#include "msg.h"
#include <stdbool.h>
#include <string.h>
#include <xtimer.h>
#include "board.h"
#include "thread.h"
#include "nodes.h"
#include "../common/batch/batch.h"
#include "../common/housekeeper/housekeeper.h"
#include "../common/time/biotTime.h"
#include "../common/udp/udp_common.h"
#include "periph/gpio.h"

#define PRIO    (THREAD_PRIORITY_MAIN + 1)
#define Q_SZ    (4)

#define SYSTEM_SUBNET    "affe"
#define ROUTER_6LOW_IF   "7"
#define ROUTER_6LOW_ROOT_IP   "::2"
#define ROUTER_6SLIP_IF  "8"
#define ROUTER_6SLIP_IP  "::3"
#define UDPIP_6SLIP_IP   "::1" // address of PC endpoint


static msg_t msg_q[Q_SZ];
bool led_status = false;
static char udp_stack[THREAD_STACKSIZE_DEFAULT];
static char housekeeping_stack[THREAD_STACKSIZE_DEFAULT];
static const shell_command_t shell_commands[];
bool isRootPending = false;
bool isRoot = false;

uint32_t timeSyncIntervalV       = 10000000;

extern int udp_cmd(int argc, char **argv);
extern void *udp_server(void *);

/* Add the shell command function here ###################################### */
int about_cmd(int argc, char **argv)
{
    puts("--------------------------------------------------------------------------------------------------");
    puts("This application implements a 6lowPAN Edge Router for use in a Biotz System");
    puts("--------------------------------------------------------------------------------------------------");
    return 0;
}

int init_cmd(int argc, char **argv)
{
    if (isRoot)
    {
        puts("already initialised.  Try rebooting if problems.");
        return -1;
    }
    LED_RGB_R_ON;
    LED0_ON;
    isRootPending = true;
    puts("Root pending...");
    return 0;
}

int led_control(int argc, char **argv)
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
            LED_RGB_OFF;
            return 0;
        }
        else if (strcmp(argv[1], "red") == 0) {
            led_status = false;
            LED0_ON;
            LED_RGB_OFF;
            LED_RGB_R_ON;
            return 0;
        }
        else if (strcmp(argv[1], "green") == 0) {
            led_status = false;
            LED0_ON;
            LED_RGB_OFF;
            LED_RGB_G_ON;
            return 0;
        }
        else if (strcmp(argv[1], "blue") == 0) {
            led_status = false;
            LED0_ON;
            LED_RGB_OFF;
            LED_RGB_B_ON;
            return 0;
        }
    }

    return -1;
}

int who_cmd(int argc, char **argv)
{
    who();
    return 0;
}


void btnCallback(void* arg)
{
    if (! isRoot)
    {
        LED_RGB_R_ON;
        LED0_ON;
        isRootPending = true;
        puts("Root pending...");
    }
}

static int sync_cmd(int argc, char **argv)
{
    syncKnown();
    return 0;
}


static int time_cmd(int argc, char **argv)
{
    printf("%lu\n", getCurrentTime());
    return 0;
}



/* ########################################################################## */
static const shell_command_t shell_commands[] = {

/* Add a new shell command here ############################################# */

    { "about", "system description", about_cmd },
    { "init", "initialise router interfaces", init_cmd },
    { "led", "use 'led on' to turn the LED on and 'led off' to turn the LED off", led_control },
    { "sync", "push router time to all children", sync_cmd },
    { "time", "show the current time counter", time_cmd },
    { "udp", "send a message: udp <IPv6-address> <message>", udp_cmd },
    { "who", "list known IMU nodes", who_cmd },

    /* ########################################################################## */
    { NULL, NULL, NULL }
};


void setRoot(void)
{
    puts("setting root...");
    isRootPending = false;
    // set up rpl root
    puts("making 6lowpan wireless interface");
    batch(shell_commands, "ifconfig " ROUTER_6LOW_IF " add " SYSTEM_SUBNET ROUTER_6LOW_ROOT_IP );
   
    puts("making dodag root node");
    batch(shell_commands, "rpl root 1 " SYSTEM_SUBNET ROUTER_6LOW_ROOT_IP );

    puts("making slip interface");
    // add wired interface
    batch(shell_commands, "ifconfig " ROUTER_6SLIP_IF " add " SYSTEM_SUBNET ROUTER_6SLIP_IP );

    puts("adding udp/ip endpoint address to cache");
    batch(shell_commands, "ncache add " ROUTER_6SLIP_IF " " SYSTEM_SUBNET UDPIP_6SLIP_IP );

    puts("starting udpserver thread");
    thread_create(udp_stack, sizeof(udp_stack), PRIO, THREAD_CREATE_STACKTEST, udp_server,
                NULL, "udp");

    initNodes();
    LED_RGB_G_ON;
    isRoot = true;
}

void idleTask(void)
{
    uint32_t microSecs = getCurrentTime();

    // every second...
    if (schedule(microSecs, ONE_SECOND_US, SCHEDULED_TASK_1))
    {

        if (isRootPending)
        {
            setRoot();
        }

        if (! isRoot)
        {
            LED_RGB_R_ON;
            isRootPending = true; 
        }
    }

    if (isRoot)
    {
        if (schedule(microSecs, timeSyncIntervalV, SCHEDULED_TASK_2))
        {
            syncKnown();
        }
    }
}

int main(void)
{
    msg_init_queue(msg_q, Q_SZ);

    puts("Type 'help' for a list of available commands");

    LED0_OFF;
    LED_RGB_OFF;

    printf("Biotz Router\n");
    about_cmd(0, NULL);
    print_help(shell_commands);

    puts("initialising rpl");
    batch(shell_commands, "rpl init " ROUTER_6LOW_IF );

    gpio_init_int(BUTTON_GPIO, GPIO_IN_PU, GPIO_FALLING, (gpio_cb_t)btnCallback, NULL);

    thread_create(housekeeping_stack, sizeof(housekeeping_stack), PRIO, THREAD_CREATE_STACKTEST, housekeeping_handler,
                NULL, "housekeeping");

    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(shell_commands, line_buf, SHELL_DEFAULT_BUFSIZE);

    /* never reached */
    return 0;
}
