#include <stdio.h>
#include "shell.h"
#include "msg.h"
#include <stdbool.h>
#include <string.h>
#include <thread.h>
#include <xtimer.h>
#include "board.h"
#include "thread.h"
#include "ssd1306.h"
#include "periph/gpio.h"

#define PRIO    (THREAD_PRIORITY_MAIN + 1)
#define Q_SZ    (8)
static msg_t msg_q[Q_SZ];

static char housekeeping_stack[THREAD_STACKSIZE_DEFAULT];

static const shell_command_t shell_commands[];

extern  void *display_handler(void *arg);
static char display_stack[THREAD_STACKSIZE_DEFAULT];

extern void batch(const shell_command_t *command_list, char *line);

/* ########################################################################## */
extern int oledCmd(int argc, char **argv);
extern int oledClearAll(void);
extern void oledWriteText(const char *string);

static const shell_command_t shell_commands[] = {
    { "oled", "test oled display", oledCmd },
    { NULL, NULL, NULL }
};


/* set interval to 1 second */
#define INTERVAL (1000000U)

void *housekeeping_handler(void *arg)
{
   int factor = 1; 
   uint16_t i = 0;
    while(1)
    {
        xtimer_ticks32_t last_wakeup = xtimer_now();
        thread_yield();
        xtimer_periodic_wakeup(&last_wakeup, INTERVAL/(2*factor));
        LED0_OFF;
        thread_yield();
        xtimer_periodic_wakeup(&last_wakeup, INTERVAL/factor);
        LED0_ON;
        char st[10];
        sprintf(st, "%d", i++);
                oledClearAll();
                oledWriteText(st);
    }
}


int main(void)
{
    msg_init_queue(msg_q, Q_SZ);

    puts("Type 'help' for a list of available commands");

    LED0_OFF;
    LED1_ON;
    LED_RGB_OFF;

    puts("Biotz OLED experiment\n");
    kernel_pid_t hkpid = thread_create(housekeeping_stack, sizeof(housekeeping_stack), PRIO, THREAD_CREATE_SLEEPING+THREAD_CREATE_STACKTEST, housekeeping_handler,
                  NULL, "housekeeping");

    printf("%i\n", hkpid);
    kernel_pid_t dhpid = thread_create(display_stack, sizeof(display_stack), PRIO, THREAD_CREATE_SLEEPING+THREAD_CREATE_STACKTEST, display_handler,
                  NULL, "display");

    thread_wakeup(hkpid);
    thread_wakeup(dhpid);

    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(shell_commands, line_buf, SHELL_DEFAULT_BUFSIZE);

    /* never reached */
    return 0;
}
