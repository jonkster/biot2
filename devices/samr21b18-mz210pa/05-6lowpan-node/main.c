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
#include "thread.h"

#include "batch.h"
#include "udp.h"

#include <xtimer.h>

#define PRIO    (THREAD_PRIORITY_MAIN + 1)

extern uint32_t getCurrentTime(void);

bool led_status = false;
char hkpStack[THREAD_STACKSIZE_DEFAULT];

char dodagRoot[IPV6_ADDR_MAX_STR_LEN];
char dodagParent[IPV6_ADDR_MAX_STR_LEN];

int about_cmd(int argc, char **argv)
{
    puts("--------------------------------------------------------------------------------------------------");
    puts("This test application implements a simple 6lowPAN node that can talk to the DODAG root");
    puts("--------------------------------------------------------------------------------------------------");
    return 0;
}

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
    //puts("where is root?");
    if (gnrc_rpl_instances[0].state == 0) {
        return 1;
    }

    gnrc_rpl_dodag_t *dodag = &gnrc_rpl_instances[0].dodag; // disable while debugging
    ipv6_addr_to_str(dodagRoot, &dodag->dodag_id, sizeof(dodagRoot)); // disable while debugging
    //strcpy(dodagRoot, "affe::2"); // use to force value while debugging
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
        else if (strcmp(argv[1], "red") == 0) {
            led_status = true;
            LED0_ON;
            return 0;
        }
        else if (strcmp(argv[1], "green") == 0) {
            led_status = false;
            LED0_OFF;
            return 0;
        }
        else if (strcmp(argv[1], "blue") == 0) {
            led_status = false;
            LED0_OFF;
            return 0;
        }
    }

    return -1;
}

static int print_echo(int argc, char **argv)
{
    for (int i = 0; i < argc; ++i) {
        printf("“%s” ", argv[i]);
    }
    puts("");

    return 0;
}

uint8_t counter;
void tellRoot(void)
{
    uint8_t v = counter++ % 4;
    switch (v)
    {
        case 0:
            udpSend("affe::2", "red");
            break;
        case 1:
            udpSend("affe::2", "green");
            break;
        case 2:
            udpSend("affe::2", "blue");
            break;
        case 3:
            udpSend("affe::2", "off");
            break;
        default:
            puts("weird??...");
    }
}

static const shell_command_t shell_commands[] = {
    { "about", "system description", about_cmd },
    { "echo", "prints the input command", print_echo },
    { "identify", "visually identify board", identify_cmd },
    { "led", "use 'led on|red|green|blue|off' to set the LEDs ", led_control },
    { "udp", "send a message: udp <IPv6-address> <message>", udp_cmd },
    { NULL, NULL, NULL }
};

void *houseKeeper(void *arg)
{
    uint32_t lastSecs = 0;

    about_cmd(0, NULL);
    identify_cmd(0, NULL);
    print_help(shell_commands);
    random_init(getCurrentTime());
    batch(shell_commands, "rpl init 6");
    while(1)
    {
        uint32_t mSecs = getCurrentTime()/1500;
        uint32_t secs = mSecs/1000;

        if (secs != lastSecs)
        {
            if (secs % 2 == 0)
            {
                LED0_OFF;
                tellRoot();
            }
            else
            {
                LED0_ON;
            }

            
            if (! knowsRoot())
            {
                findRoot();
            }
        }
        lastSecs = secs;
        thread_yield();
    }
}


int main(void)
{
    puts("ready");
    (void) thread_create(
            hkpStack, sizeof(hkpStack),
            PRIO,
            THREAD_CREATE_STACKTEST,
            houseKeeper,
            NULL,
            "housekeeper");

    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(shell_commands, line_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}
