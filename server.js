const express = require('express');
const { exec, spawn, spawnSync } = require('child_process');
const path = require('path');
const os = require("os");

const ValetudoWifiStatus = require("./ValetudoWifiStatus");
const ScanEntry = require("./ScanEntry");

const port = 3000;
const host = "0.0.0.0";

const monitorModeScript = path.join(__dirname, 'enabele_monitor_mode.sh');
const channelHoppingScript = path.join(__dirname, 'channelHopper.sh');

const app = express();
app.use(express.json());


//-----------------------------------------------------------------
//---------------------- Helper Functions -------------------------
//-----------------------------------------------------------------

function hexToASCII(hexstr){
	var hex  = hexstr.toString();
	var str = '';
	for (var n = 0; n < hex.length; n += 2) {
		str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
	}
	return str;
 }

function enableMonitorMode(interface){
  exec(`sudo ${monitorModeScript} ${interface}`, (error, stdout, stderr) => {
      if (error) {
          console.error(`Error executing script: ${error}`);
          return;
      }
  
      if (stderr) {
          console.error(`Script error output: ${stderr}`);
          return;
      }
  
      console.log(`Script output: ${stdout}`);
  });
}

function startChannelHopping(interface, channels, width, duration){
  const process = spawn('sudo', [channelHoppingScript, interface, channels, width, duration]);
  console.log("Start channel hopping on interface " + interface + ", channels: " + channels);

  return process;
}

function parseCsv(data){

  if(data == ''){
      console.log("empty scan");
      return null;
  }
  // split data into lines
  const lines = data.trim().split('\n');
  
  const entries = [];
  
  lines.forEach(line => {
    const fields = line.split('","').map(field => field.replace(/^"/, '').replace(/"$/, ''));
    
    const entry = new ScanEntry(
      fields[0], // frame.time
      fields[1], // wlan.bssid
      hexToASCII(fields[2]), // wlan.ssid
      fields[3], // wlan_radio.channel
      fields[4]  // radiotap.dbm_antsignal
    );
    
    entries.push(entry);
  });
  
  return entries;
};

function findBestSignalEntry(entries){
if (entries.length === 0) {
  return null; 
}
// use first element as start element
let bestEntry = entries[0];

for (const entry of entries) {
  if (entry.signalStrength > bestEntry.signalStrength) {
    bestEntry = entry;
  }
}

return bestEntry;
};

//-----------------------------------------------------------------
//-------------------------- Setup --------------------------------
//-----------------------------------------------------------------

const SSID = 'MySSID';
const scanMode = "5"; // 2_4 or 5
enableMonitorMode("wlan1");
enableMonitorMode("wlan2");
enableMonitorMode("wlan3");

//-----------------------------------------------------------------
//---------------------- Channel Scanning -------------------------
//-----------------------------------------------------------------

/*
*
* WifiConfigurationCapability
*
*/
app.get('/api/v2/robot/capabilities/WifiConfigurationCapability', (req, res) => {

  let hopper_wlan1, hopper_wlan2, hopper_wlan3;
  let scan_interval_wlan1, scan_interval_wlan2, scan_interval_wlan3;

  if(scanMode == "2_4") {
    console.log("Scanning in 2.4 GHz");
    hopper_wlan1 = startChannelHopping("wlan1", "1 2 3 4", "HT20", 0.25);
    hopper_wlan2 = startChannelHopping("wlan2", "5 6 7 8", "HT20", 0.25);
    hopper_wlan3 = startChannelHopping("wlan3", "9 10 11", "HT20", 0.25);
    scan_interval_wlan1 = 1;
    scan_interval_wlan2 = 1;
    scan_interval_wlan3 = 1;
  } else {
    console.log("Scanning in 5 GHz");
    hopper_wlan1 = startChannelHopping("wlan1", "36 40 44 48 52 56 60", "HT20", 0.25);
    hopper_wlan2 = startChannelHopping("wlan2", "64 100 104 108 112 116 120", "HT20", 0.25);
    hopper_wlan3 = startChannelHopping("wlan3", "124 128 132 136 140 144", "HT20", 0.25);
    scan_interval_wlan1 = 1.75;
    scan_interval_wlan2 = 1.75;
    scan_interval_wlan3 = 1.5;
  }

  hopper_wlan1.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`)
  });
    
  hopper_wlan1.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  hopper_wlan1.on('close', (code) => {
    console.log(`process exited with code ${code}`);
  });

hopper_wlan2.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
  });
    
  hopper_wlan2.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  hopper_wlan2.on('close', (code) => {
    console.log(`process exited with code ${code}`);
  });

  hopper_wlan3.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
  });

  hopper_wlan3.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
  });

  hopper_wlan3.on('close', (code) => {
  console.log(`process exited with code ${code}`);
  });

    const command = 'sh';
    const args = ['scanThreeInterfaces.sh', SSID, "wlan1", scan_interval_wlan1 ,"wlan2", scan_interval_wlan2, "wlan3", scan_interval_wlan3];
    // execute the command
    const result = spawnSync(command, args, { encoding: 'utf8' });

    hopper_wlan1.stdin.pause();
    hopper_wlan2.stdin.pause();
    hopper_wlan3.stdin.pause();

    hopper_wlan1.kill('SIGTERM');
    hopper_wlan2.kill('SIGTERM');
    hopper_wlan3.kill('SIGTERM');

    // capture the output
    const tsharkOutput = result.stdout.trim();

    const scanEntries = parseCsv(tsharkOutput);
    // get entry with the best signal
    const bestEntry = findBestSignalEntry(scanEntries);

    // create Valetudo class instance
    const output = {
        state: ValetudoWifiStatus.STATE.UNKNOWN,
        details: {}
    };
    output.state = ValetudoWifiStatus.STATE.CONNECTED;
    output.details.bssid = bestEntry.bssid;
    output.details.ssid = bestEntry.ssid;
    output.details.signal = bestEntry.signalStrength;
    output.details.upspeed = 0; // not used
    if(scanMode == "2_4"){
      output.details.frequency = ValetudoWifiStatus.FREQUENCY_TYPE.W2_4Ghz;
    } else {
      output.details.frequency = ValetudoWifiStatus.FREQUENCY_TYPE.W5Ghz;
    }
    output.details.ips = [];

    const wifiStatus = new ValetudoWifiStatus(output)

    console.log(tsharkOutput);
    console.log(bestEntry);
    console.log(wifiStatus);
    res.json(wifiStatus);
});

app.listen(port, host, () => {
  console.log(`Server runs on htt:<hostip>:${port}`);
});
