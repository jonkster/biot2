 #!/bin/bash
  
TUNSLIP="../utils/tunslip6.new"
 
sudo killall $TUNSLIP

port=${1:-0}
attempts=4
   
echo /dev/ttyUSB$port
sudo -Sb ../utils/$TUNSLIP affe::1/64 -t tun0 -s /dev/ttyUSB$port -B115200

for (( i=1; i<=$attempts; i++ ))
do
    echo "connection attempt: $i of $attempts"
    echo "sudo -Sb $TUNSLIP affe::1/64 -t tun0 -s /dev/ttyUSB$port -B115200 > /dev/null"
    sudo -Sb $TUNSLIP affe::1/64 -t tun0 -s /dev/ttyUSB$port -B115200 > /dev/null
    sleep 2
    ping6 -c1 -t1 affe::1 > /dev/null
    if [ $? -eq 0 ]; then
        echo "Interface up, check connectivity..."
        sleep 1
        echo "ping6 -c1 -t1 affe::2 > /dev/null"
        ping6 -c1 -t1 affe::2 > /dev/null
        if [ $? -eq 0 ]; then
            echo "WORKING!"
            exit 0
        else
            echo "didn't work. Shutting down interface..."
        fi
    else
        echo "interface would not create... weird.  Goodbye"
        exit 1
    fi
    sudo killall $TUNSLIP > /dev/null 2>&1 
done
echo Could not get it to work after $attempts attempts.  Sorry Jim.
exit 1

