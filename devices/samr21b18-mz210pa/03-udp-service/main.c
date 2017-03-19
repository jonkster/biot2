#include <random.h>
#include <stdio.h>

#include "random.h"
#include "msg.h"
#include "net/ipv6/addr.h"
#include "net/gnrc/netif.h"
#include "net/gnrc/ipv6/netif.h"
#include "net/gnrc/rpl/dodag.h"
#include "shell.h"
#include "batch.h"
#include "udp.h"


#define PRIO    (THREAD_PRIORITY_MAIN + 1)
static char hkp_stack[THREAD_STACKSIZE_DEFAULT];
static char udp_stack[THREAD_STACKSIZE_DEFAULT+512];

char dodagRoot[IPV6_ADDR_MAX_STR_LEN];
char dodagParent[IPV6_ADDR_MAX_STR_LEN];

extern int32_t timeCorrection;
extern uint32_t getCurrentTime(void);

/* ########################################################################## */


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

int about_cmd(int argc, char **argv)
{
    puts("--------------------------------------------------------------------------------------------------");
    puts("This test application implements a UDP server");
    puts("--------------------------------------------------------------------------------------------------");
    return 0;
}


bool knowsRoot(void)
{
    return (strlen(dodagRoot) > 0);
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





static const shell_command_t shell_commands[] = {
    { "about", "system description", about_cmd },
    { "identify", "visually identify board", identify_cmd },
    { "udp", "send a message: udp <IPv6-address> <message>", udp_cmd },
    { NULL, NULL, NULL }
};

void *houseKeeper(void *arg)
{
    uint32_t lastSecs = 0;
    identify_cmd(0, NULL);
    random_init(getCurrentTime());
    uint32_t dupInterval2 = 1000;
    uint32_t scheduleOffset = random_uint32_range(0, dupInterval2-1);

    about_cmd(0, NULL);
    print_help(shell_commands);

    while(1)
    {
        uint32_t mSecs = getCurrentTime()/1500;
        uint32_t secs = mSecs/1000;
        if (mSecs % dupInterval2 == scheduleOffset)
        {
        }

        if (mSecs % (dupInterval2 * 100) == scheduleOffset)
        {
        }

        if (mSecs % (dupInterval2 * 100) == scheduleOffset+100)
        {
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
    puts("UDP Shell\n");
    LED0_OFF;

    thread_create(hkp_stack, sizeof(hkp_stack), PRIO, THREAD_CREATE_STACKTEST, houseKeeper, NULL, "housekeer");

    thread_create(udp_stack, sizeof(udp_stack), PRIO, THREAD_CREATE_STACKTEST, udpServer, NULL, "udpserver");

    timeCorrection = 0;

    batch(shell_commands, "rpl init 6");


    puts("starting shell");
    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(shell_commands, line_buf, SHELL_DEFAULT_BUFSIZE);

    /* never reached */
    return 0;
}
