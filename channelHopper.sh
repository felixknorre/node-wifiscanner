#!/bin/bash

INTERFACE=$1
CHANNELS=$2
WIDTH=$3
DURATION=$4

trap "echo 'Termination signal received. Exiting...'; exit" SIGINT SIGTERM


while true; do
	for ch in ${CHANNELS}; do
		echo "Setting Channel ${ch} - ${WIDTH} in ${INTERFACE}"
		iw dev "${INTERFACE}" set channel "${ch}" "${WIDTH}"
		sleep ${DURATION}
	done
done
