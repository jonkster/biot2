#include "batch.h"
#include <string.h>
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include "shell_commands.h"
#include "../common/memory/memory.h"

void print_help(const shell_command_t *command_list)
{
    printf("%-20s %s\n", "Command", "Description");
    puts("---------------------------------------");
    printf("%-20s %s\n", "help", "display this help");

    const shell_command_t *command_lists[] = {
        command_list,
#ifdef MODULE_SHELL_COMMANDS
        _shell_command_list,
#endif
    };

    const shell_command_t *entry;

    /* iterating over command_lists */
    for (unsigned int i = 0; i < sizeof(command_lists) / sizeof(entry); i++) {
        if ((entry = command_lists[i])) {
            /* iterating over commands in command_lists entry */
            while (entry->name != NULL) {
                printf("%-20s %s\n", entry->name, entry->desc);
                entry++;
            }
        }
    }
    puts("");
    printf("> ");
    fflush(stdout);
}


static shell_command_handler_t find_handler(const shell_command_t *command_list, char *command)
{
    const shell_command_t *command_lists[] = {
        command_list,
        _shell_command_list,
    };

    const shell_command_t *entry;

    for (unsigned int i = 0; i < sizeof(command_lists) / sizeof(entry); i++) {
        if ((entry = command_lists[i])) {
            while (entry->name != NULL) {
                if (strcmp(entry->name, command) == 0) {
                    return entry->handler;
                }
                else {
                    entry++;
                }
            }
        }
    }

    return NULL;
}

/* simplified arg processor - NB will not interpret quotes */
void batch(const shell_command_t *command_list, char *line)
{
    char* argString = safe_strdup("line", line);

    enum { kMaxArgs = 5 };
    int argc = 0;
    char *argv[kMaxArgs];

    char *p = strtok(argString, " ");
    while (p && argc < kMaxArgs-1)
    {
        argv[argc++] = p;
        p = strtok(0, " ");
    }
    argv[argc] = 0;
    
    /* then we call the appropriate handler */
    shell_command_handler_t handler = find_handler(command_list, argv[0]);
    if (handler != NULL) {
        handler(argc, argv);
    }
    else {
        printf("shell: command not found: %s\n", argv[0]);
    }
    safe_free("arg", argString);
}
