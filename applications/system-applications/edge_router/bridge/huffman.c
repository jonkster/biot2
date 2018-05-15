/** This code generated automatically from analyse.ts **/
#include "huffman.h"
#include <stdio.h>

#define MAXBITS (8)

//#define DEBUG (1)


void intAsBinary(char *bin, unsigned int ch, unsigned int bits)
{
#ifdef DEBUG
    printf("expanding %dh ->", ch);
#endif
    size_t j = 0;
    for (int i = (bits-1); i >= 0; i--)
    {
        int k = ch >> i;
                   
        if (k & 1)
        {
            bin[j] = '1';
        }
        else
        {
            bin[j] = '0';
        }
        j++;
    }
#ifdef DEBUG
    printf("%sB\n", bin);
#endif
}

size_t makeByteArray(unsigned char *array, const char *binaryDigits, const int bits)
{
        size_t  byteC = 0;
        size_t  bitC = 0;

        unsigned char byte[8];
        for (int i = 0; i < bits; i++)
        {
                switch (bitC)
                {
                        case 0:
                        case 1:
                        case 2:
                        case 3:
                        case 4:
                        case 5:
                        case 6: byte[bitC++] = binaryDigits[i];
                                break;
                        case 7: byte[bitC] = binaryDigits[i];
                                unsigned char ch = (unsigned char)strtoul((char *)byte, NULL, 2);
                                array[byteC++] = ch;
                                bitC = 0;
                                memset(byte, 0, sizeof(byte));
                                break;
                        default: puts("BUG!"); break;
                }
        }
        return byteC;
}

void make7BitString(unsigned char *compressed, const char* text)
{
        int len = strlen(text);
        char buffer[(7 * len) + 1];
        memset(buffer, 0, sizeof(buffer));
        for (int i = 0; i < len; i++)
        {
                char bin[14];
                memset(bin, 0, sizeof(bin));
                unsigned chInt = text[i];
                intAsBinary(bin, chInt, 7);
                strcat(buffer, (char*)bin);
        }
        int rem = strlen(buffer) % 8;
        for (int i = 0; i < rem; i++)
        {
                strcat(buffer, "0");
        }
        size_t byteC = makeByteArray(compressed, buffer, strlen(buffer));
        compressed[(int)byteC] = '\003';
}

void expand7BitString(char *text, const unsigned char *compressed)
{
        int len = strlen((char*)compressed);
        char buffer[(8 * len) + 1];
        memset(buffer, 0, sizeof(buffer));
        for (int i = 0; i < len; i++)
        {
                unsigned int chInt = compressed[i];
                char bin[14];
                memset(bin, 0, sizeof(bin));
                intAsBinary(bin, chInt, 8);
                strcat(buffer, (char*)bin);
        }
        int j = 0;
        int bp = 0;
        memset(text, 0, sizeof(*text));
        unsigned int chInt = 0;
        for (int i = 0; i < strlen(buffer); i++)
        {
                if (buffer[i] == '1')
                {
                        int v = 1 << (6 - bp);
                        chInt += v;
                }
                bp++;
                if ((i % 7) == 6)
                {
                        text[j++] = chInt;
                        chInt = 0;
                        bp = 0;
                }
        }
        text[j++] = chInt;
        text[j] = '\003';
}


size_t compress(const char *text, unsigned char *compressed, size_t compressedSize)
{
        size_t i;
        size_t inLen = strlen(text);

        size_t bufferLen = (compressedSize+1) * MAXBITS;
        char buffer[bufferLen + 1];
        memset(buffer, 0, sizeof(buffer));

        int fallback = 0;
        for (i = 0; i < inLen; i++)
        {
                char c = text[i];
                switch(c)
		{
			case ':': strcat(buffer, "101"); break; // 5 (3bits)
			case '0': strcat(buffer, "011"); break; // 3 (3bits)
			case '7': strcat(buffer, "1101"); break; // 13 (4bits)
			case '6': strcat(buffer, "1100"); break; // 12 (4bits)
			case 'a': strcat(buffer, "0010"); break; // 2 (4bits)
			case '9': strcat(buffer, "0001"); break; // 1 (4bits)
			case '2': strcat(buffer, "0000"); break; // 0 (4bits)
			case '3': strcat(buffer, "1001"); break; // 9 (4bits)
			case '1': strcat(buffer, "0100"); break; // 4 (4bits)
			case '.': strcat(buffer, "0101"); break; // 5 (4bits)
			case '4': strcat(buffer, "0011"); break; // 3 (4bits)
			case '-': strcat(buffer, "10000"); break; // 16 (5bits)
			case '5': strcat(buffer, "11110"); break; // 30 (5bits)
			case 'f': strcat(buffer, "11101"); break; // 29 (5bits)
			case '8': strcat(buffer, "11100"); break; // 28 (5bits)
			case 'e': strcat(buffer, "111110"); break; // 62 (6bits)
			case 'b': strcat(buffer, "111111"); break; // 63 (6bits)
			case '#': strcat(buffer, "100010"); break; // 34 (6bits)
			case 'd': strcat(buffer, "1000111"); break; // 71 (7bits)
			case 'c': strcat(buffer, "10001101"); break; // 141 (8bits)
			case '\3': strcat(buffer, "10001100"); break; // 140 (8bits)

			default:
				   printf("uncompressible character: %c\n", c);
				   fallback = 1;
				   break;
		}
                if (strlen(buffer) >= bufferLen )
                {
                        printf("too big!!\n");
                        break;
                }
#ifdef DEBUG
                printf("compressing %ld/%ld  %c -> %s\n", i, inLen, c, buffer);
#endif
        }
        strcat(buffer, "10001100");
        strcat(buffer, "10001100");
        size_t  outLen = strlen(buffer);
#ifdef DEBUG
        printf("%s\n", buffer);
#endif


        size_t byteC = makeByteArray(compressed, buffer, outLen);
        if ((inLen < byteC) || fallback)
        {
                // we have a string that wasn't efficiently encoded, instead try a 7 byte
                // represention as a 'last resort' to at least try and save
                // some space.
                make7BitString((unsigned char*)buffer, text);
                strcpy((char*)compressed, "3");
                strcat((char*)compressed, buffer);
                byteC = strlen((char*)compressed);
        }
#ifdef DEBUG
        printf("com: '%s'\n", compressed);
#endif
        return byteC;
}

size_t uncompress(const unsigned char *compressed, const size_t compressedSize, char *text)
{
#ifdef DEBUG
    printf("uncompress: '%s'\n", compressed);
#endif
    if (strncmp("3", (char*)compressed, 1) == 0)
    {
            // we have a string that wasn't huffman encoded, instead it is
            // probably a 7 byte representation
#ifdef DEBUG
            printf("expanding 7 bit string\n");
#endif
            expand7BitString(text, compressed + sizeof(char));
            return strlen(text);
    }
    char buffer[(compressedSize+1) * 8];
    memset(buffer, 0, sizeof(buffer));
    for (size_t i = 0; i < compressedSize; i++)
    {
        char bin[MAXBITS+1];
        memset(bin, 0, sizeof(bin));
        unsigned int chInt = compressed[i];
        intAsBinary(bin, chInt, 8);
#ifdef DEBUG
        printf("uncompressing %lu/%lu compressedSize %d\n", i, compressedSize, chInt);
#endif
        strcat(buffer, bin);
    }
#ifdef DEBUG
        printf("%s\n", buffer);
#endif
    
    size_t start = 0;
    size_t len = 0;
    size_t bufLen = strlen(buffer);
    char testBuf[MAXBITS+1];
    memset(testBuf, 0, sizeof(testBuf));
    int i = 0;
    while (start < bufLen)
    {
        len++;
        strncpy(testBuf, buffer + start, len);
	if (strcmp("101", testBuf) == 0) { text[i++] = ':'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("011", testBuf) == 0) { text[i++] = '0'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("1101", testBuf) == 0) { text[i++] = '7'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("1100", testBuf) == 0) { text[i++] = '6'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("0010", testBuf) == 0) { text[i++] = 'a'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("0001", testBuf) == 0) { text[i++] = '9'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("0000", testBuf) == 0) { text[i++] = '2'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("1001", testBuf) == 0) { text[i++] = '3'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("0100", testBuf) == 0) { text[i++] = '1'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("0101", testBuf) == 0) { text[i++] = '.'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("0011", testBuf) == 0) { text[i++] = '4'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("10000", testBuf) == 0) { text[i++] = '-'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("11110", testBuf) == 0) { text[i++] = '5'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("11101", testBuf) == 0) { text[i++] = 'f'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("11100", testBuf) == 0) { text[i++] = '8'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("111110", testBuf) == 0) { text[i++] = 'e'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("111111", testBuf) == 0) { text[i++] = 'b'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("100010", testBuf) == 0) { text[i++] = '#'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("1000111", testBuf) == 0) { text[i++] = 'd'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("10001101", testBuf) == 0) { text[i++] = 'c'; start += len; len = 0; memset(testBuf, 0, sizeof(testBuf)); }
	else if (strcmp("10001100", testBuf) == 0) {  break; }        
    }
#ifdef DEBUG
        printf("uncompressed ->%s\n", text);
#endif
    return strlen(text);
}


