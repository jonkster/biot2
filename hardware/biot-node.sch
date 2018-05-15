EESchema Schematic File Version 2
LIBS:power
LIBS:device
LIBS:transistors
LIBS:conn
LIBS:linear
LIBS:regul
LIBS:74xx
LIBS:cmos4000
LIBS:adc-dac
LIBS:memory
LIBS:xilinx
LIBS:microcontrollers
LIBS:dsp
LIBS:microchip
LIBS:analog_switches
LIBS:motorola
LIBS:texas
LIBS:intel
LIBS:audio
LIBS:interface
LIBS:digital-audio
LIBS:philips
LIBS:display
LIBS:cypress
LIBS:siliconi
LIBS:opto
LIBS:atmel
LIBS:contrib
LIBS:valves
LIBS:atmelSAM
LIBS:switches
LIBS:biot-node-cache
EELAYER 25 0
EELAYER END
$Descr A4 11693 8268
encoding utf-8
Sheet 1 1
Title "Biot IMU Node"
Date "2018-02-13"
Rev "0"
Comp "Motion Capture Systems"
Comment1 "SMD mount of controller module with regulator"
Comment2 ""
Comment3 ""
Comment4 ""
$EndDescr
$Comp
L Conn_01x06 P1
U 1 1 57B543CA
P 9025 4450
F 0 "P1" H 9025 4800 50  0000 C CNN
F 1 "FTDI/Serial" V 9125 4450 50  0000 C CNN
F 2 "Pin_Headers:Pin_Header_Straight_1x06_Pitch2.54mm_SMD_Pin1Right" H 9025 4450 50  0001 C CNN
F 3 "" H 9025 4450 50  0000 C CNN
	1    9025 4450
	1    0    0    -1  
$EndComp
$Comp
L LED_Small D2
U 1 1 57B546DC
P 9850 2125
F 0 "D2" H 9800 2250 50  0000 L CNN
F 1 "20mA" H 9775 2025 50  0000 L CNN
F 2 "LEDs:LED_1206" V 9850 2125 50  0001 C CNN
F 3 "" V 9850 2125 50  0000 C CNN
	1    9850 2125
	0    1    -1   0   
$EndComp
$Comp
L LED_Small D1
U 1 1 57B58E2E
P 4825 4150
F 0 "D1" H 4775 4275 50  0000 L CNN
F 1 "20mA" H 4725 4050 50  0000 L CNN
F 2 "LEDs:LED_1206" V 4825 4150 50  0001 C CNN
F 3 "" V 4825 4150 50  0000 C CNN
	1    4825 4150
	-1   0    0    -1  
$EndComp
Text GLabel 3725 3750 2    60   Input ~ 0
SDA
Text GLabel 3725 3850 2    60   Input ~ 0
SCLK
Text GLabel 3725 3950 2    60   Input ~ 0
RX
Text GLabel 3725 4050 2    60   Input ~ 0
TX
Text GLabel 9300 3400 2    60   Input ~ 0
SWDIO
Text GLabel 9300 3500 2    60   Input ~ 0
SWDCLK
Text GLabel 9300 3800 2    60   Input ~ 0
NRST
Text GLabel 8825 4650 0    60   Input ~ 0
RX
Text GLabel 8825 4550 0    60   Input ~ 0
TX
$Comp
L R R1
U 1 1 57B66E31
P 5075 4150
F 0 "R1" V 5155 4150 50  0000 C CNN
F 1 "68" V 5075 4150 50  0000 C CNN
F 2 "Resistors_SMD:R_1210" V 5005 4150 50  0001 C CNN
F 3 "" H 5075 4150 50  0000 C CNN
	1    5075 4150
	0    1    1    0   
$EndComp
$Comp
L R R2
U 1 1 57B66E9C
P 9850 1875
F 0 "R2" V 9930 1875 50  0000 C CNN
F 1 "68" V 9850 1875 50  0000 C CNN
F 2 "Resistors_SMD:R_1210" V 9780 1875 50  0001 C CNN
F 3 "" H 9850 1875 50  0000 C CNN
	1    9850 1875
	1    0    0    -1  
$EndComp
Text GLabel 6850 3425 0    60   Input ~ 0
NRST
$Comp
L GND #PWR01
U 1 1 57B671DE
P 9850 2350
F 0 "#PWR01" H 9850 2100 50  0001 C CNN
F 1 "GND" H 9850 2200 50  0000 C CNN
F 2 "" H 9850 2350 50  0000 C CNN
F 3 "" H 9850 2350 50  0000 C CNN
	1    9850 2350
	1    0    0    -1  
$EndComp
$Comp
L GND #PWR02
U 1 1 57B6728D
P 5400 4150
F 0 "#PWR02" H 5400 3900 50  0001 C CNN
F 1 "GND" H 5400 4000 50  0000 C CNN
F 2 "" H 5400 4150 50  0000 C CNN
F 3 "" H 5400 4150 50  0000 C CNN
	1    5400 4150
	1    0    0    -1  
$EndComp
$Comp
L GND #PWR03
U 1 1 57B673C1
P 8475 3800
F 0 "#PWR03" H 8475 3550 50  0001 C CNN
F 1 "GND" H 8475 3650 50  0000 C CNN
F 2 "" H 8475 3800 50  0000 C CNN
F 3 "" H 8475 3800 50  0000 C CNN
	1    8475 3800
	1    0    0    -1  
$EndComp
$Comp
L GND #PWR04
U 1 1 57B674CA
P 8425 4250
F 0 "#PWR04" H 8425 4000 50  0001 C CNN
F 1 "GND" H 8425 4100 50  0000 C CNN
F 2 "" H 8425 4250 50  0000 C CNN
F 3 "" H 8425 4250 50  0000 C CNN
	1    8425 4250
	1    0    0    -1  
$EndComp
$Comp
L GND #PWR05
U 1 1 57B675A9
P 7250 3575
F 0 "#PWR05" H 7250 3325 50  0001 C CNN
F 1 "GND" H 7250 3425 50  0000 C CNN
F 2 "" H 7250 3575 50  0000 C CNN
F 3 "" H 7250 3575 50  0000 C CNN
	1    7250 3575
	1    0    0    -1  
$EndComp
$Comp
L +3.3V #PWR06
U 1 1 57B676BA
P 4450 3050
F 0 "#PWR06" H 4450 2900 50  0001 C CNN
F 1 "+3.3V" H 4450 3190 50  0000 C CNN
F 2 "" H 4450 3050 50  0000 C CNN
F 3 "" H 4450 3050 50  0000 C CNN
	1    4450 3050
	1    0    0    -1  
$EndComp
$Comp
L +3.3V #PWR07
U 1 1 57B67717
P 8425 3400
F 0 "#PWR07" H 8425 3250 50  0001 C CNN
F 1 "+3.3V" H 8425 3540 50  0000 C CNN
F 2 "" H 8425 3400 50  0000 C CNN
F 3 "" H 8425 3400 50  0000 C CNN
	1    8425 3400
	1    0    0    -1  
$EndComp
$Comp
L +3.3V #PWR08
U 1 1 57B677C3
P 8125 4275
F 0 "#PWR08" H 8125 4125 50  0001 C CNN
F 1 "+3.3V" H 8125 4415 50  0000 C CNN
F 2 "" H 8125 4275 50  0000 C CNN
F 3 "" H 8125 4275 50  0000 C CNN
	1    8125 4275
	1    0    0    -1  
$EndComp
$Comp
L PWR_FLAG #FLG09
U 1 1 57B69434
P 7425 1725
F 0 "#FLG09" H 7425 1820 50  0001 C CNN
F 1 "PWR_FLAG" H 7425 1905 50  0000 C CNN
F 2 "" H 7425 1725 50  0000 C CNN
F 3 "" H 7425 1725 50  0000 C CNN
	1    7425 1725
	1    0    0    -1  
$EndComp
$Comp
L PWR_FLAG #FLG010
U 1 1 57B69C57
P 9325 2300
F 0 "#FLG010" H 9325 2395 50  0001 C CNN
F 1 "PWR_FLAG" H 9325 2480 50  0000 C CNN
F 2 "" H 9325 2300 50  0000 C CNN
F 3 "" H 9325 2300 50  0000 C CNN
	1    9325 2300
	-1   0    0    1   
$EndComp
$Comp
L Conn_01x04 J2
U 1 1 59F959C0
P 8975 5425
F 0 "J2" H 8975 5675 50  0000 C CNN
F 1 "MPU9250 connection" V 9075 5425 50  0000 C CNN
F 2 "Pin_Headers:Pin_Header_Straight_1x04_Pitch2.54mm" H 8975 5425 50  0001 C CNN
F 3 "" H 8975 5425 50  0001 C CNN
	1    8975 5425
	1    0    0    -1  
$EndComp
$Comp
L +3.3V #PWR011
U 1 1 59F95BD9
P 8775 5325
F 0 "#PWR011" H 8775 5175 50  0001 C CNN
F 1 "+3.3V" H 8775 5465 50  0000 C CNN
F 2 "" H 8775 5325 50  0000 C CNN
F 3 "" H 8775 5325 50  0000 C CNN
	1    8775 5325
	1    0    0    -1  
$EndComp
$Comp
L GND #PWR012
U 1 1 59F95C14
P 8275 5425
F 0 "#PWR012" H 8275 5175 50  0001 C CNN
F 1 "GND" H 8275 5275 50  0000 C CNN
F 2 "" H 8275 5425 50  0000 C CNN
F 3 "" H 8275 5425 50  0000 C CNN
	1    8275 5425
	1    0    0    -1  
$EndComp
Text GLabel 8775 5525 0    60   Input ~ 0
SCLK
Text GLabel 8775 5625 0    60   Input ~ 0
SDA
NoConn ~ 8825 4350
NoConn ~ 8825 4750
$Comp
L SW_Push SW1
U 1 1 5A72B196
P 7050 3425
F 0 "SW1" H 7100 3525 50  0000 L CNN
F 1 "SW_Reset" H 7050 3365 50  0000 C CNN
F 2 "Buttons_Switches_SMD:SW_SPST_B3S-1000" H 7050 3625 50  0001 C CNN
F 3 "" H 7050 3625 50  0001 C CNN
	1    7050 3425
	1    0    0    -1  
$EndComp
$Comp
L ATSAMR21B18-MZ210PA U1
U 1 1 5A72B8AF
P 2775 3950
F 0 "U1" H 2000 4150 60  0000 C CNN
F 1 "ATSAMR21B18-MZ210PA" H 2650 4025 60  0000 C CNN
F 2 "atsamr21:ATSAMR21B18-MZ210PA" H 2775 4100 60  0001 C CNN
F 3 "" H 2775 4100 60  0001 C CNN
	1    2775 3950
	1    0    0    -1  
$EndComp
$Comp
L Conn_02x05_Odd_Even J4
U 1 1 5A72BCA8
P 9000 3600
F 0 "J4" H 9050 3900 50  0000 C CNN
F 1 "ATMEL-CORTEX" H 9050 3300 50  0000 C CNN
F 2 "Pin_Headers:Pin_Header_Straight_2x05_Pitch1.27mm_SMD" H 9000 3600 50  0001 C CNN
F 3 "" H 9000 3600 50  0001 C CNN
	1    9000 3600
	1    0    0    -1  
$EndComp
NoConn ~ 8800 3700
NoConn ~ 9300 3600
NoConn ~ 9300 3700
Text GLabel 2500 3250 1    60   Input ~ 0
SWDIO
Text GLabel 2650 3250 1    60   Input ~ 0
SWDCLK
Text GLabel 2450 4525 3    60   Input ~ 0
NRST
Text GLabel 7100 4725 0    60   Input ~ 0
PA14
Text GLabel 7100 4925 0    60   Input ~ 0
PA15
Text GLabel 2325 3250 1    60   Input ~ 0
PA14
Text GLabel 2650 4525 3    60   Input ~ 0
PA15
$Comp
L LP2985-3.3 U2
U 1 1 5A821785
P 8300 1825
F 0 "U2" H 8050 2050 50  0000 C CNN
F 1 "LP2985-3.3" H 8300 2050 50  0000 L CNN
F 2 "TO_SOT_Packages_SMD:SOT-23-5" H 8300 2150 50  0001 C CNN
F 3 "" H 8300 1825 50  0001 C CNN
	1    8300 1825
	1    0    0    -1  
$EndComp
$Comp
L GND #PWR013
U 1 1 5A821888
P 8300 2450
F 0 "#PWR013" H 8300 2200 50  0001 C CNN
F 1 "GND" H 8300 2300 50  0000 C CNN
F 2 "" H 8300 2450 50  0000 C CNN
F 3 "" H 8300 2450 50  0000 C CNN
	1    8300 2450
	1    0    0    -1  
$EndComp
$Comp
L C_Small C1
U 1 1 5A8218B9
P 7425 1825
F 0 "C1" H 7435 1895 50  0000 L CNN
F 1 "1uF" H 7435 1745 50  0000 L CNN
F 2 "Capacitors_SMD:C_1206" H 7425 1825 50  0001 C CNN
F 3 "" H 7425 1825 50  0001 C CNN
	1    7425 1825
	1    0    0    -1  
$EndComp
$Comp
L C_Small C2
U 1 1 5A821998
P 9250 1825
F 0 "C2" H 9260 1895 50  0000 L CNN
F 1 "4.7uF" H 9260 1745 50  0000 L CNN
F 2 "Capacitors_SMD:C_1206" H 9250 1825 50  0001 C CNN
F 3 "" H 9250 1825 50  0001 C CNN
	1    9250 1825
	1    0    0    -1  
$EndComp
$Comp
L GND #PWR014
U 1 1 5A821A64
P 7425 1925
F 0 "#PWR014" H 7425 1675 50  0001 C CNN
F 1 "GND" H 7425 1775 50  0000 C CNN
F 2 "" H 7425 1925 50  0000 C CNN
F 3 "" H 7425 1925 50  0000 C CNN
	1    7425 1925
	1    0    0    -1  
$EndComp
$Comp
L GND #PWR015
U 1 1 5A821AA7
P 9250 1925
F 0 "#PWR015" H 9250 1675 50  0001 C CNN
F 1 "GND" H 9250 1775 50  0000 C CNN
F 2 "" H 9250 1925 50  0000 C CNN
F 3 "" H 9250 1925 50  0000 C CNN
	1    9250 1925
	1    0    0    -1  
$EndComp
NoConn ~ 8700 1825
$Comp
L GND #PWR016
U 1 1 5A822113
P 6750 2425
F 0 "#PWR016" H 6750 2175 50  0001 C CNN
F 1 "GND" H 6750 2275 50  0000 C CNN
F 2 "" H 6750 2425 50  0000 C CNN
F 3 "" H 6750 2425 50  0000 C CNN
	1    6750 2425
	1    0    0    -1  
$EndComp
$Comp
L +3.3V #PWR017
U 1 1 5A82234C
P 9250 1525
F 0 "#PWR017" H 9250 1375 50  0001 C CNN
F 1 "+3.3V" H 9250 1665 50  0000 C CNN
F 2 "" H 9250 1525 50  0000 C CNN
F 3 "" H 9250 1525 50  0000 C CNN
	1    9250 1525
	1    0    0    -1  
$EndComp
$Comp
L Battery 3.6VNiMH1
U 1 1 5A8B66E0
P 6750 2225
F 0 "3.6VNiMH1" H 6850 2325 50  0000 L CNN
F 1 "Battery" H 6850 2225 50  0000 L CNN
F 2 "atsamr21:varta3v200h" V 6750 2285 50  0001 C CNN
F 3 "" V 6750 2285 50  0001 C CNN
	1    6750 2225
	1    0    0    -1  
$EndComp
$Comp
L Conn_01x03 J3
U 1 1 5A94A810
P 6750 1525
F 0 "J3" H 6750 1725 50  0000 C CNN
F 1 "on/off" H 6750 1325 50  0000 C CNN
F 2 "Pin_Headers:Pin_Header_Straight_1x03_Pitch2.54mm_SMD_Pin1Right" H 6750 1525 50  0001 C CNN
F 3 "" H 6750 1525 50  0001 C CNN
	1    6750 1525
	0    -1   -1   0   
$EndComp
$Comp
L PWR_FLAG #FLG018
U 1 1 5A94C7FA
P 6025 1725
F 0 "#FLG018" H 6025 1820 50  0001 C CNN
F 1 "PWR_FLAG" H 6025 1905 50  0000 C CNN
F 2 "" H 6025 1725 50  0000 C CNN
F 3 "" H 6025 1725 50  0000 C CNN
	1    6025 1725
	1    0    0    -1  
$EndComp
$Comp
L Conn_01x03 J1
U 1 1 5AA9B3F4
P 7300 4825
F 0 "J1" H 7300 5025 50  0000 C CNN
F 1 "test points" H 7300 4625 50  0000 C CNN
F 2 "Pin_Headers:Pin_Header_Straight_1x03_Pitch2.54mm_SMD_Pin1Right" H 7300 4825 50  0001 C CNN
F 3 "" H 7300 4825 50  0001 C CNN
	1    7300 4825
	1    0    0    -1  
$EndComp
Wire Wire Line
	5225 4150 5400 4150
Wire Wire Line
	3725 4150 4725 4150
Wire Wire Line
	3725 3650 5400 3650
Wire Wire Line
	8475 3800 8800 3800
Wire Wire Line
	8425 4250 8825 4250
Wire Wire Line
	7250 3425 7250 3575
Wire Wire Line
	4450 3550 3725 3550
Wire Wire Line
	4450 3050 4450 3550
Wire Wire Line
	8425 3400 8800 3400
Wire Wire Line
	8125 4275 8125 4450
Wire Wire Line
	8125 4450 8825 4450
Wire Wire Line
	8800 3600 8475 3600
Wire Wire Line
	8475 3500 8475 3800
Wire Wire Line
	8800 3500 8475 3500
Connection ~ 8475 3600
Wire Wire Line
	5400 3650 5400 4150
Wire Wire Line
	8275 5425 8775 5425
Wire Wire Line
	8700 1725 9850 1725
Wire Wire Line
	6850 1725 7900 1725
Wire Wire Line
	7900 1725 7900 1825
Connection ~ 7425 1725
Wire Wire Line
	9250 1725 9250 1525
Connection ~ 9250 1725
Wire Wire Line
	9850 2225 9850 2350
Connection ~ 9850 2275
Wire Wire Line
	9850 2275 9325 2275
Wire Wire Line
	9325 2275 9325 2300
Wire Wire Line
	6025 1725 6650 1725
Wire Wire Line
	6500 5125 6500 4825
Wire Wire Line
	6500 4825 7100 4825
$Comp
L GND #PWR019
U 1 1 5AA9B987
P 6500 5125
F 0 "#PWR019" H 6500 4875 50  0001 C CNN
F 1 "GND" H 6500 4975 50  0000 C CNN
F 2 "" H 6500 5125 50  0000 C CNN
F 3 "" H 6500 5125 50  0000 C CNN
	1    6500 5125
	1    0    0    -1  
$EndComp
Wire Wire Line
	6750 2025 6750 1725
Connection ~ 7150 1725
Wire Wire Line
	8300 2125 8300 2450
Connection ~ 8300 2250
$EndSCHEMATC
