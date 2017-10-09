#include <string.h>
#include <stdlib.h>
#include <stdio.h>

#include "memory.h"

#define MAXMEM 256

#define DEBUG 0

int32_t memused = 0;

char *safe_strdup(const char *ctx, const char *s) {
    if (DEBUG) printf("strdup %s ", ctx);
    if ((memused + strlen(s)) > MAXMEM) {
        if (DEBUG) printf("strdup MEMORY LOW? l=%i '%s'\n", strlen(s), s);
    }
    memused += strlen(s);
    if (DEBUG) printf("used %li\n", memused);
    return strdup(s);
}

char *safe_strndup(const char *ctx, const char *s, size_t n) {
    if (DEBUG) printf("strndup %s ", ctx);
    if ((memused + n) > MAXMEM) {
        if (DEBUG) printf("strndup MEMORY LOW? l=%i '%s'\n", strlen(s), s);
    }
    char *buf =strndup(s, n);
    memused += strlen(buf);
    if (DEBUG) printf("used %li\n", memused);
    return buf;
}

void safe_free(const char *ctx, void *ptr) {
    if (DEBUG) printf("free %s ", ctx);
    memused -= strlen(ptr);
    if (memused < 0) {
        printf("FREE BEYOND ALLOCATED? %i %s\n", strlen(ptr), (char*)ptr);
        memused += strlen(ptr);
        return;
    }
    if (DEBUG) printf("freed. Used %li\n", memused);
    free(ptr);
}

