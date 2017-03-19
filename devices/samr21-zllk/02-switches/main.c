#include <stdbool.h>
#include <stdio.h>
#include <string.h>

#include "board.h"
#include "periph/gpio.h"
#include "shell_commands.h"
#include "shell.h"
#include "thread.h"

#include <xtimer.h>

bool led_status = false;

void btnCallback(void* arg)
{
    puts("Button pressed!");
    LED_RGB_B_ON;
    xtimer_sleep(1);
    LED_RGB_OFF;
}

static int led_control(int argc, char **argv)
{
    if (argc == 2) {
        if (strcmp(argv[1], "on") == 0) {
            led_status = true;
            LED0_ON;
            LED1_OFF;
            return 0;
        }
        else if (strcmp(argv[1], "off") == 0) {
            led_status = false;
            LED0_OFF;
            LED1_ON;
            LED_RGB_OFF;
            return 0;
        }
        else if (strcmp(argv[1], "red") == 0) {
            led_status = false;
            LED_RGB_OFF;
            LED_RGB_R_ON;
            return 0;
        }
        else if (strcmp(argv[1], "green") == 0) {
            led_status = false;
            LED_RGB_OFF;
            LED_RGB_G_ON;
            return 0;
        }
        else if (strcmp(argv[1], "blue") == 0) {
            led_status = false;
            LED_RGB_OFF;
            LED_RGB_B_ON;
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



int main(void)
{

    printf("Simple Test Shell\n");
    xtimer_usleep(3);
    puts("ready");

    gpio_init_int(BUTTON_GPIO, GPIO_IN_PU, GPIO_RISING, (gpio_cb_t)btnCallback, NULL);

    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(shell_commands, line_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}
