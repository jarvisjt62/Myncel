'use client';

import { useState } from 'react';
import Link from 'next/link';

const GUIDES = [
  {
    id: 'esp32',
    title: 'ESP32',
    icon: '🔌',
    subtitle: 'WiFi + Bluetooth microcontroller',
    badge: 'Most Popular',
    badgeColor: '#635bff',
    description: 'The ESP32 is the most cost-effective way to connect sensors to Myncel. A $5 board can monitor temperature, vibration, current, and more.',
    steps: [
      { title: 'Hardware Required', content: `• ESP32 DevKit (any variant — $4–8)\n• DHT22 temperature/humidity sensor ($2)\n• Optional: MPU6050 vibration sensor ($3)\n• Optional: ACS712 current sensor ($2)\n• Jumper wires + breadboard` },
      { title: 'Wiring Diagram', content: `DHT22 → ESP32:\n  VCC  → 3.3V\n  DATA → GPIO 4\n  GND  → GND\n\nMPU6050 → ESP32:\n  VCC  → 3.3V\n  GND  → GND\n  SDA  → GPIO 21\n  SCL  → GPIO 22\n\nACS712 → ESP32:\n  VCC  → 5V\n  GND  → GND\n  OUT  → GPIO 34 (ADC)` },
    ],
    code: `// Myncel ESP32 IoT Sensor — Complete Sketch
// Install libraries: WiFi, HTTPClient, ArduinoJson, DHT sensor library

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ── Configuration ──────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* MYNCEL_URL    = "https://yourapp.com/api/iot";
const char* API_KEY       = "mnc_iot_YOUR_API_KEY_HERE";
const char* MACHINE_ID    = "YOUR_MACHINE_ID";
const int   SEND_INTERVAL = 30000;  // ms between readings

#define DHT_PIN  4
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("\\n✅ Connected: " + WiFi.localIP().toString());
}

void sendReading(const char* sensorType, float value, const char* unit) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(MYNCEL_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);

  StaticJsonDocument<256> doc;
  doc["machineId"]  = MACHINE_ID;
  doc["sensorType"] = sensorType;
  doc["value"]      = value;
  doc["unit"]       = unit;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  if (code == 200) {
    Serial.printf("✅ %s = %.2f %s\\n", sensorType, value, unit);
  } else {
    Serial.printf("❌ HTTP %d — %s\\n", code, http.getString().c_str());
  }
  http.end();
}

void loop() {
  float temp     = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (!isnan(temp))     sendReading("temperature", temp, "°C");
  if (!isnan(humidity)) sendReading("humidity", humidity, "%");

  delay(SEND_INTERVAL);
}`,
    libraries: ['WiFi (built-in)', 'HTTPClient (built-in)', 'ArduinoJson by Benoit Blanchon', 'DHT sensor library by Adafruit'],
    notes: [
      'Flash this sketch using Arduino IDE or PlatformIO',
      'Replace YOUR_WIFI_SSID, YOUR_WIFI_PASSWORD, and API_KEY',
      'Get your Machine ID from the machine detail page in Myncel',
      'The ESP32 supports up to 10 sensor readings per POST for efficiency',
    ],
  },
  {
    id: 'raspberrypi',
    title: 'Raspberry Pi',
    icon: '🍓',
    subtitle: 'Linux single-board computer',
    badge: 'Full Python',
    badgeColor: '#10b981',
    description: 'The Raspberry Pi runs full Linux and Python, making it ideal for complex monitoring setups, local data processing, or as an IoT gateway for multiple sensors.',
    steps: [
      { title: 'Hardware Required', content: `• Raspberry Pi 4 (or Zero 2W for smaller installs)\n• DS18B20 temperature probe ($3) — 1-Wire interface\n• Adafruit ADS1115 16-bit ADC ($9) — for analog sensors\n• Optional: USB sensors (CO2, vibration, etc.)\n• MicroSD card + power supply` },
      { title: 'Initial Setup', content: `# Install Python dependencies\npip3 install requests adafruit-circuitpython-ads1x15 RPi.GPIO\n\n# Enable 1-Wire in raspi-config\nsudo raspi-config → Interface Options → 1-Wire → Enable\n\n# Enable I2C\nsudo raspi-config → Interface Options → I2C → Enable\nsudo reboot` },
    ],
    code: `#!/usr/bin/env python3
"""
Myncel Raspberry Pi Sensor Agent
Sends sensor readings to Myncel CMMS via HTTP API
"""

import time
import requests
import logging
from datetime import datetime

# ── Configuration ──────────────────────────────
MYNCEL_URL = "https://yourapp.com/api/iot"
API_KEY    = "mnc_iot_YOUR_API_KEY_HERE"
MACHINE_ID = "YOUR_MACHINE_ID"
INTERVAL   = 30  # seconds between readings

logging.basicConfig(level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

# ── DS18B20 Temperature Reader ──────────────────
def read_ds18b20(device_id: str) -> float | None:
    """Read temperature from DS18B20 1-Wire sensor."""
    try:
        path = f"/sys/bus/w1/devices/{device_id}/w1_slave"
        with open(path) as f:
            lines = f.readlines()
        if lines[0].strip().endswith("YES"):
            temp_raw = lines[1].find("t=")
            return float(lines[1][temp_raw + 2:]) / 1000.0
    except Exception as e:
        log.error(f"DS18B20 read error: {e}")
    return None

# ── CPU Temperature (built-in) ──────────────────
def read_cpu_temp() -> float | None:
    try:
        with open("/sys/class/thermal/thermal_zone0/temp") as f:
            return float(f.read()) / 1000.0
    except Exception:
        return None

# ── Send to Myncel ──────────────────────────────
def send_reading(sensor_type: str, value: float, unit: str) -> bool:
    try:
        resp = requests.post(
            MYNCEL_URL,
            json={"machineId": MACHINE_ID, "sensorType": sensor_type,
                  "value": round(value, 2), "unit": unit},
            headers={"X-API-Key": API_KEY, "Content-Type": "application/json"},
            timeout=10,
        )
        if resp.status_code == 200:
            log.info(f"✅ {sensor_type} = {value:.2f} {unit}")
            return True
        else:
            log.error(f"❌ HTTP {resp.status_code}: {resp.text}")
    except requests.RequestException as e:
        log.error(f"Network error: {e}")
    return False

def send_batch(readings: list[dict]) -> bool:
    """Send multiple readings in one request."""
    try:
        resp = requests.post(
            MYNCEL_URL,
            json=readings,
            headers={"X-API-Key": API_KEY, "Content-Type": "application/json"},
            timeout=10,
        )
        return resp.status_code == 200
    except Exception as e:
        log.error(f"Batch send error: {e}")
    return False

# ── Main loop ───────────────────────────────────
def main():
    log.info("🚀 Myncel sensor agent starting...")
    # Find DS18B20 devices
    import glob
    ds_devices = glob.glob('/sys/bus/w1/devices/28-*/w1_slave')
    log.info(f"Found {len(ds_devices)} DS18B20 sensor(s)")

    while True:
        readings = []

        # CPU temperature (runtime proxy)
        cpu_temp = read_cpu_temp()
        if cpu_temp is not None:
            readings.append({"machineId": MACHINE_ID, "sensorType": "temperature",
                              "value": round(cpu_temp, 2), "unit": "°C"})

        # DS18B20 sensors
        for path in ds_devices:
            device_id = path.split('/')[5]
            temp = read_ds18b20(device_id)
            if temp is not None:
                readings.append({"machineId": MACHINE_ID, "sensorType": "temperature",
                                  "value": round(temp, 2), "unit": "°C"})

        if readings:
            success = send_batch(readings)
            log.info(f"Batch sent: {len(readings)} readings — {'OK' if success else 'FAILED'}")

        time.sleep(INTERVAL)

if __name__ == "__main__":
    main()`,
    libraries: ['requests', 'RPi.GPIO', 'adafruit-circuitpython-ads1x15', 'python3-smbus (I2C)'],
    notes: [
      'Run as a systemd service for automatic restart on reboot',
      'Use cron (@reboot python3 /home/pi/myncel_agent.py) for simple scheduling',
      'For multiple machines on one Pi, create one process per machine',
      'The Pi can act as a WiFi gateway for multiple ESP32 sensors',
    ],
    systemd: `[Unit]
Description=Myncel IoT Sensor Agent
After=network.target

[Service]
ExecStart=/usr/bin/python3 /home/pi/myncel_agent.py
Restart=always
RestartSec=10
User=pi
WorkingDirectory=/home/pi

[Install]
WantedBy=multi-user.target

# Install: sudo systemctl enable myncel-agent && sudo systemctl start myncel-agent`,
  },
  {
    id: 'nodered',
    title: 'Node-RED / MQTT',
    icon: '🔀',
    subtitle: 'Visual flow-based programming',
    badge: 'No-Code',
    badgeColor: '#f59e0b',
    description: 'Node-RED provides a visual drag-and-drop interface for connecting sensors to Myncel. Perfect for teams who prefer a no-code approach or already use MQTT brokers.',
    steps: [
      { title: 'Prerequisites', content: `# Install Node-RED\nnpm install -g --unsafe-perm node-red\n\n# Or via Docker\ndocker run -d -p 1880:1880 nodered/node-red\n\n# Install required palette nodes\n# In Node-RED: Menu → Manage Palette → Install:\n# → node-red-contrib-mqtt-broker\n# → node-red-node-rbe (report by exception)` },
      { title: 'MQTT Broker Setup', content: `# Install Mosquitto MQTT broker\nsudo apt-get install mosquitto mosquitto-clients\n\n# Test with:\nmosquitto_pub -h localhost -t "factory/machine1/temperature" -m "72.5"\n\n# Your sensors publish to topics like:\n# factory/{machineId}/{sensorType}` },
    ],
    code: `// Node-RED Flow JSON — Import via Menu → Import
// This flow subscribes to MQTT topics and forwards to Myncel API

[
  {
    "id": "mqtt-in-1",
    "type": "mqtt in",
    "name": "MQTT Sensor Input",
    "topic": "factory/+/+",
    "qos": "0",
    "broker": "mqtt-broker-1"
  },
  {
    "id": "parse-topic",
    "type": "function",
    "name": "Parse MQTT Topic → Myncel Payload",
    "func": "// Topic format: factory/{machineId}/{sensorType}\\nconst parts = msg.topic.split('/');\\nconst machineId  = parts[1];\\nconst sensorType = parts[2];\\n\\n// Unit lookup\\nconst units = {\\n  temperature: '°C', vibration: 'mm/s',\\n  pressure: 'PSI',  current: 'A',\\n  oil_level: '%',   humidity: '%'\\n};\\n\\nmsg.payload = {\\n  machineId:  machineId,\\n  sensorType: sensorType,\\n  value:      parseFloat(msg.payload),\\n  unit:       units[sensorType] || '',\\n};\\nmsg.headers = {\\n  'Content-Type': 'application/json',\\n  'X-API-Key':    'mnc_iot_YOUR_API_KEY'\\n};\\nmsg.url = 'https://yourapp.com/api/iot';\\nreturn msg;"
  },
  {
    "id": "http-request-1",
    "type": "http request",
    "name": "POST to Myncel API",
    "method": "POST",
    "ret": "obj",
    "url": "",
    "tls": ""
  },
  {
    "id": "debug-1",
    "type": "debug",
    "name": "Response",
    "active": true
  }
]

// ── Arduino / ESP8266 MQTT Publisher ──────────────
// Install: PubSubClient library

#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

const char* ssid     = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* mqtt_server = "YOUR_PI_IP";  // Node-RED host

WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(4, DHT22);

void setup() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  client.setServer(mqtt_server, 1883);
  dht.begin();
}

void loop() {
  if (!client.connected()) {
    client.connect("esp8266-sensor");
  }
  float temp = dht.readTemperature();
  if (!isnan(temp)) {
    String payload = String(temp);
    client.publish("factory/machine_id_here/temperature", payload.c_str());
  }
  delay(30000);
}`,
    libraries: ['Node-RED', 'Mosquitto MQTT broker', 'PubSubClient (Arduino)', 'node-red-contrib-mqtt-broker'],
    notes: [
      'Import the flow JSON via Node-RED Menu → Import → Clipboard',
      'Update YOUR_API_KEY and machine IDs in the function node',
      'Multiple sensors can share one MQTT broker — use unique topic paths',
      'Node-RED runs on Raspberry Pi, making it a perfect all-in-one gateway',
    ],
  },
];

export default function IoTGuidesPage() {
  const [activeGuide, setActiveGuide] = useState(GUIDES[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const guide = GUIDES.find(g => g.id === activeGuide)!;

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>IoT Wiring & Connection Guides</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Copy-paste code for connecting physical sensors to Myncel CMMS.
        </p>
      </div>

      {/* Guide selector tabs */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {GUIDES.map(g => (
          <button key={g.id} onClick={() => setActiveGuide(g.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={activeGuide === g.id
              ? { backgroundColor: 'var(--bg-surface)', border: `2px solid ${g.badgeColor}`, color: 'var(--text-primary)' }
              : { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
            }>
            <span className="text-base">{g.icon}</span>
            <span>{g.title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white"
              style={{ backgroundColor: g.badgeColor, opacity: activeGuide === g.id ? 1 : 0.6 }}>
              {g.badge}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sidebar: steps + notes */}
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">{guide.icon}</span>
              <div>
                <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>{guide.title}</h2>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{guide.subtitle}</p>
              </div>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{guide.description}</p>
          </div>

          {guide.steps.map((step, i) => (
            <div key={i} className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                Step {i + 1}: {step.title}
              </h3>
              <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-page)', borderRadius: '8px', padding: '10px', border: '1px solid var(--border)' }}>
                {step.content}
              </pre>
            </div>
          ))}

          {/* Required libraries */}
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Required Libraries</h3>
            <ul className="space-y-1">
              {guide.libraries.map(lib => (
                <li key={lib} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-primary)' }}>
                  <span className="text-[#635bff]">▸</span> {lib}
                </li>
              ))}
            </ul>
          </div>

          {/* Notes */}
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(99,91,255,0.06)', border: '1px solid rgba(99,91,255,0.2)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-2 text-[#635bff]">💡 Tips</h3>
            <ul className="space-y-1.5">
              {guide.notes.map(note => (
                <li key={note} className="text-xs flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <span className="text-[#635bff] flex-shrink-0">•</span> {note}
                </li>
              ))}
            </ul>
          </div>

          {'systemd' in guide && (
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>systemd Service</h3>
                <button onClick={() => copy((guide as any).systemd, 'systemd')} className="text-xs text-[#635bff] hover:underline">
                  {copiedId === 'systemd' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <pre className="text-xs font-mono whitespace-pre-wrap text-emerald-600 dark:text-emerald-400"
                style={{ backgroundColor: 'var(--bg-page)', borderRadius: '8px', padding: '10px', border: '1px solid var(--border)' }}>
                {(guide as any).systemd}
              </pre>
            </div>
          )}
        </div>

        {/* Main code panel */}
        <div className="lg:col-span-2">
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-page)' }}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {guide.id === 'esp32' ? 'esp32_myncel_sensor.ino' :
                   guide.id === 'raspberrypi' ? 'myncel_agent.py' :
                   'nodered_flow.json'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-mono"
                  style={{ backgroundColor: 'rgba(99,91,255,0.1)', color: '#635bff' }}>
                  {guide.id === 'esp32' ? 'Arduino / C++' :
                   guide.id === 'raspberrypi' ? 'Python 3' :
                   'JSON / JS'}
                </span>
              </div>
              <button
                onClick={() => copy(guide.code, 'code')}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{
                  backgroundColor: copiedId === 'code' ? 'rgba(16,185,129,0.15)' : 'rgba(99,91,255,0.1)',
                  color: copiedId === 'code' ? '#10b981' : '#635bff',
                  border: `1px solid ${copiedId === 'code' ? 'rgba(16,185,129,0.3)' : 'rgba(99,91,255,0.3)'}`,
                }}>
                {copiedId === 'code' ? '✓ Copied!' : '📋 Copy Code'}
              </button>
            </div>

            <div className="overflow-auto max-h-[65vh]">
              <pre className="p-5 text-xs font-mono leading-relaxed"
                style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-page)', margin: 0 }}>
                <code>{guide.code}</code>
              </pre>
            </div>
          </div>

          {/* Quick reference card */}
          <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>📡 API Endpoint Reference</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Endpoint',     value: 'POST /api/iot' },
                { label: 'Auth Header',  value: 'X-API-Key: mnc_iot_...' },
                { label: 'Content-Type', value: 'application/json' },
                { label: 'Batch limit',  value: '100 readings per request' },
              ].map(item => (
                <div key={item.label} className="rounded-lg p-3"
                  style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)' }}>
                  <div className="font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>{item.label}</div>
                  <code className="text-[#635bff]">{item.value}</code>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-3">
              <Link href="/settings/api-keys"
                className="flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-colors"
                style={{ backgroundColor: 'rgba(99,91,255,0.08)', color: '#635bff', border: '1px solid rgba(99,91,255,0.25)' }}>
                🔑 Get API Key
              </Link>
              <Link href="/setup"
                className="flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-colors"
                style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                ⚡ Setup Wizard
              </Link>
              <Link href="/docs/api"
                className="flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-colors"
                style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                📖 Full API Docs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
);
}