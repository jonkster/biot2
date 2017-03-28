#ifndef UDP_COMMON_H
#define UDP_COMMON_H

#include "shell.h"

#ifdef __cplusplus
extern "C" {
#endif

/* simplified arg processor - NB will not interpret quotes */
void batch(const shell_command_t *command_list, char *line);

void print_help(const shell_command_t *command_list);

#ifdef __cplusplus
}
#endif

#endif
