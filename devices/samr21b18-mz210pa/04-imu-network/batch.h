#ifndef BATCH_H
#define BATCH_H

#include "shell.h"
#include "shell_commands.h"

#ifdef __cplusplus
extern "C" {
#endif

/* simplified arg processor - NB will not interpret quotes */
void batch(const shell_command_t *command_list, char *line);

#ifdef __cplusplus
}
#endif
#endif /* UDP_COMMON_H */
/** @} */
