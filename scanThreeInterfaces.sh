#!/bin/bash

SSID=$1
INTERFACE1=$2
TIME1=$3
INTERFACE2=$4
TIME2=$5
INTERFACE3=$6
TIME3=$7

tshark -i ${INTERFACE1} -a duration:${TIME1} -Y "wlan.fc.type_subtype == 0x08 && wlan.ssid == \"${SSID}\"" -T fields -e frame.time -e wlan.bssid -e wlan.ssid -e wlan_radio.channel -e radiotap.dbm_antsignal -E header=n -E separator=, -E quote=d -E occurrence=f & tshark -i ${INTERFACE2} -a duration:${TIME2} -Y "wlan.fc.type_subtype == 0x08 && wlan.ssid == \"${SSID}\"" -T fields -e frame.time -e wlan.bssid -e wlan.ssid -e wlan_radio.channel -e radiotap.dbm_antsignal -E header=n -E separator=, -E quote=d -E occurrence=f & tshark -i ${INTERFACE3} -a duration:${TIME3} -Y "wlan.fc.type_subtype == 0x08 && wlan.ssid == \"${SSID}\"" -T fields -e frame.time -e wlan.bssid -e wlan.ssid -e wlan_radio.channel -e radiotap.dbm_antsignal -E header=n -E separator=, -E quote=d -E occurrence=f
