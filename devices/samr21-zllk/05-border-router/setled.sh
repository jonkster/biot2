#!/bin/bash

if [ $# -eq 0 ]
      then
          COLOUR="green"
          echo "usage: $0 off|red|green|blue"
      else
          COLOUR=$1
      fi

echo $COLOUR | nc -6u -q 1 affe::2 8888
