/*
** This code generated automatically from analyse.ts 
*/
#ifndef _HUFFMAN_
#define _HUFFMAN_
#include <stdlib.h>
#include <string.h>

size_t compress(const char *text, unsigned char *compressed, size_t compressedSize);

size_t uncompress(const unsigned char *compressed, const size_t compressedSize, char *text);

//**********
// by codes
//**********
// 101            ':'
// 011            '0'
// 1101           '7'
// 1100           '6'
// 0010           'a'
// 0001           '9'
// 0000           '2'
// 1001           '3'
// 0100           '1'
// 0101           '.'
// 0011           '4'
// 10000          '-'
// 11110          '5'
// 11101          'f'
// 11100          '8'
// 111110         'e'
// 111111         'b'
// 100010         '#'
// 1000111        'd'
// 10001101       'c'
// 10001100       '\3'
//**********
// by symbols
//**********
// '#'         100010
// '-'          10000
// '.'           0101
// '0'            011
// '1'           0100
// '2'           0000
// '3'           1001
// '4'           0011
// '5'          11110
// '6'           1100
// '7'           1101
// '8'          11100
// '9'           0001
// ':'            101
// '\3'       10001100
// 'a'           0010
// 'b'         111111
// 'c'       10001101
// 'd'        1000111
// 'e'         111110
// 'f'          11101
#endif
