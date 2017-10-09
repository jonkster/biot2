#ifndef MEMORY_COMMON_H
#define MEMORY_COMMON_H

#ifdef __cplusplus
extern "C" {
#endif

char *safe_strdup(const char *ctx, const char *s);

char *safe_strndup(const char *ctx, const char *s, size_t n);

void safe_free(const char *ctx, void *ptr);

#ifdef __cplusplus
}
#endif
#endif /* MEMORY_COMMON_H */
