# node-wifiscanner

The project can be used together with [Valetudo](https://github.com/Hypfer/Valetudo) and [Valeronoi](https://github.com/ccoors/Valeronoi) to create maps of the Wi-Fi signal strength of the 5 GHz frequency band, which is not possible with the integrated Wi-Fi modules of the robot vacuum cleaners. To use the project, a setup consisting of a Raspberry Pi, a battery pack and three Wi-Fi adapters must be attached to a robot vacuum cleaner. Valeronoi uses the Valetudo API to get the RSSI of the current connection and the location information. This project mimics the Wi-Fi part of the Valetudo API, but in the background it scans all channels for Beacan frames and then filters for your specific SSID. To return the information in the same format as Valetudo, the SerializableEntity and ValetudoWifiStatus classes from the Valetudo project are reused.

Valeronoi was customized to actually generate Wi-Fi signal strength maps with the project. The customizations can be found in the Frok [felixknorre/Valeronoi](https://github.com/felixknorre/Valeronoi).

## Usage

Before the server can be started, `server.js` must be edited and the desired SSID must be entered in the variable `SSID`.

The node server can be started with the following command:

```bash
node server.js
```
The API can then be tested with the command:

```bash
  curl -X 'GET' \
  'http://<ip>:3000/api/v2/robot/capabilities/WifiConfigurationCapability' \
  -H 'accept: application/json'
```
