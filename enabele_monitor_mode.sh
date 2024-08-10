#!/bin/bash

INTERFACE=$1

if [ -z "$INTERFACE" ]; then
    echo "Error: No argument specified for INTERFACE."
    echo "Usage: $0 <interface>"
    exit 1
fi

ip link set "${INTERFACE}" down
iw dev "${INTERFACE}" set type monitor
ip link set "${INTERFACE}" up

echo "Monitor Mode enabled on Interface ${INTERFACE}"
