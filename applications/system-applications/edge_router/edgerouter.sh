#!/bin/bash

getPassword() {
	password=$(tempfile 2>/dev/null)
	trap "rm -f $password" 0 1 2 5 15
	dialog --backtitle "Biotz Edge Router" \
	       --title "Info" \
	       --msgbox "You will need to enter your password to set up the DODAG root interface." 10 30


       dialog  --backtitle "Biotz Edge Router" \
		--title "Password" \
		--clear \
		--insecure \
		--passwordbox "Enter your password" 10 30 2> $password

	ret=$?
	case $ret in
	   1) echo "bye - cancelled"; exit 0;;
	   255) echo "bye - [ESC] key pressed."; exit 0;;
	esac
	password=`cat $password`
}

choice=$(tempfile 2>/dev/null)
trap "rm -f $choice" 0 1 2 5 15

dialog  --backtitle "Biotz Edge Router" \
   --checklist "Select Options" 10 40 2 \
	   DODAG "Start DODAG Root" on \
	   ERBRIDGE "Start Bridge" on 2>$choice

WANTDODAG=0
WANTBRIDGE=0
CHOICE=`cat $choice`
if grep -q DODAG <<< $CHOICE
then
	WANTDODAG=1
fi
if grep -q ERBRIDGE <<< $CHOICE
then
	WANTBRIDGE=1
fi

DODAGON=0
if [ `pgrep sunshine` ]
then
	DODAGON=1
fi

ERBRIDGEON=0
if [ `pgrep erbridge` ]
then
	ERBRIDGEON=1
fi


if [ $WANTDODAG -eq 0 ] && [ $DODAGON -eq 1 ]
then
dialog  --backtitle "Biotz Edge Router" \
   --yesno "Dodag is running - Stop DODAG?" 10 40
   if [ $? -eq 0 ]
   then
	getPassword
	echo "stopping previous DODAG interface"
	echo $password | sudo killall sunshine
   else
	echo "OK leaving DODAG"
   fi
fi

if [ $WANTBRIDGE -eq 0 ] && [ $ERBRIDGEON -eq 1 ]
then
dialog  --backtitle "Biotz Edge Router" \
   --yesno "Bridge is running - Stop Bridge?" 10 40
   if [ $? -eq 0 ]
   then
	    echo "stopping previous bridge"
	    killall erbridge
   else
		echo "OK leaving Bridge"
   fi
fi



if [ $WANTDODAG -eq 1 ]
then
	echo "Want Dodag..."

	getPassword

	if [ $DODAGON -eq 1 ]
	then
	    echo "stopping previous DODAG interface"
	    echo $password | sudo killall sunshine
	fi

	echo "removing dodag log..."
	rm dodag.log
	echo "starting dodag interface"
	echo $password | sudo -b ./sunshine  -I32 -ilowpan0 -r 1 --dagid 0xaffe0000000000000000000000000005 -m -p affe::5/64 > dodag.log 2>&1  &
	echo "checking dodag..."

	ping6 -c1 -q -W1 affe::5 > /dev/null
	if [ $? -eq 0 ]
	then
	    echo "dodag interface appears OK"
	else
	    dialog --backtitle "Biotz Edge Router" \
		    --title "WARNING" \
		    --msgbox "DODAG Root node NOT working :(" 10 30
	    exit 0
	fi
fi

if [ $WANTBRIDGE -eq 1 ]
then
	echo "Want Bridge..."

	if [ $ERBRIDGEON ]
	then
		echo "stopping previous erbridge..."
		killall erbridge
	fi
	echo "removing erbridge log..."
	rm erbridge.log erbridge.errs
	echo "starting erbridge..."
	./erbridge 1> erbridge.log 2>erbridge.errs &
	echo "checking erbridge..."
	if [ `pgrep erbridge` ]
	then
		echo "bridge appears to be running OK"
	else
		dialog --backtitle "Biotz Edge Router" \
			--title "WARNING" \
			--msgbox "erbridge NOT working :(" 10 30
	    exit 0
	fi
fi

