#include <stdbool.h>
#include <stdio.h>
#include <string.h>

#include "board.h"
#include "shell_commands.h"
#include "shell.h"
#include "thread.h"

#include <xtimer.h>

bool led_status = false;
char flash_stack[THREAD_STACKSIZE_MAIN];

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

static const shell_command_t shell_commands[] = {
    { "led", "use 'led on|red|green|blue|off' to set the LEDs ", led_control },
    { "echo", "prints the input command", print_echo },
    { NULL, NULL, NULL }
};

void *flash(void *arg)
{
    (void) arg;
    LED0_OFF;

    xtimer_sleep(2);

    for (uint8_t i = 0; i < 5; i++)
    {
        LED0_OFF;
        xtimer_usleep(100000);
        LED0_ON;
    }

    LED0_OFF;

    puts("ready");
    return NULL;
}


int main(void)
{

    printf("Simple Test Shell\n");
    xtimer_usleep(3);
    puts("ready");

    (void) thread_create(
            flash_stack, sizeof(flash_stack),
            THREAD_PRIORITY_MAIN - 1,
            THREAD_CREATE_WOUT_YIELD | THREAD_CREATE_STACKTEST,
            flash, NULL, "nr2");

    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(shell_commands, line_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}
