class ScanEntry {
    constructor(frameTime, bssid, ssid, channel, signalStrength) {
      this.frameTime = frameTime;
      this.bssid = bssid;
      this.ssid = ssid;
      this.channel = channel;
      this.signalStrength = parseInt(signalStrength, 10);
    }
  }

  module.exports = ScanEntry;
