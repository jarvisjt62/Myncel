'use client';

import { useState } from 'react';
import Link from 'next/link';

const PROTOCOLS = [
  {
    id: 'opcua',
    title: 'OPC-UA',
    icon: '🏭',
    badge: 'Industrial Standard',
    badgeColor: '#635bff',
    subtitle: 'OPC Unified Architecture — IEC 62541',
    description: 'OPC-UA is the modern industrial communication standard used by Siemens, Allen-Bradley, Beckhoff, and virtually all industrial PLCs and SCADA systems. It provides secure, reliable data exchange over TCP/IP.',
    useCases: ['Siemens S7-1200/S7-1500 PLCs', 'Beckhoff TwinCAT', 'ABB robots and drives', 'Kepware OPC Server', 'Ignition SCADA'],
    overview: `OPC-UA Node Bridge:
┌─────────────────┐     OPC-UA     ┌──────────────┐     HTTP      ┌──────────────┐
│  PLC / SCADA    │ ────────────── │  Node Bridge │ ──────────── │ Myncel /api  │
│  (OPC-UA Srv)   │  TCP:4840      │  (Python)    │  X-API-Key   │ /iot         │
└─────────────────┘                └──────────────┘              └──────────────┘`,
    code: `#!/usr/bin/env python3
"""
Myncel OPC-UA Bridge
Connects to an OPC-UA server and forwards tag values to Myncel CMMS

Install: pip install opcua requests
"""

import time
import logging
import requests
from opcua import Client, ua

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# ── Configuration ──────────────────────────────────────────
OPC_SERVER_URL = "opc.tcp://192.168.1.100:4840"  # Your PLC/SCADA OPC-UA endpoint
OPC_USERNAME   = ""  # Leave empty if no auth required
OPC_PASSWORD   = ""

MYNCEL_URL  = "https://yourapp.com/api/iot"
API_KEY     = "mnc_iot_YOUR_API_KEY"
MACHINE_ID  = "YOUR_MACHINE_ID"
INTERVAL    = 30  # seconds

# ── OPC-UA Node ID to Myncel sensor mapping ─────────────────
# Format: { "ns=2;i=2" : { "sensorType": "temperature", "unit": "°C" } }
# Find Node IDs using UAExpert (free tool) or your SCADA browser
NODE_MAP = {
    "ns=2;i=1001": {"sensorType": "temperature",   "unit": "°C"},
    "ns=2;i=1002": {"sensorType": "vibration",     "unit": "mm/s"},
    "ns=2;i=1003": {"sensorType": "pressure",      "unit": "PSI"},
    "ns=2;i=1004": {"sensorType": "current",       "unit": "A"},
    "ns=2;i=1005": {"sensorType": "runtime_hours", "unit": "hrs"},
    # Add more tag mappings here
}

def connect_opcua() -> Client:
    """Create and connect OPC-UA client."""
    client = Client(OPC_SERVER_URL)
    if OPC_USERNAME:
        client.set_user(OPC_USERNAME)
        client.set_password(OPC_PASSWORD)
    client.connect()
    log.info(f"✅ Connected to OPC-UA: {OPC_SERVER_URL}")
    return client

def read_all_nodes(client: Client) -> list[dict]:
    """Read all configured node values."""
    readings = []
    for node_id, config in NODE_MAP.items():
        try:
            node  = client.get_node(node_id)
            value = node.get_value()
            readings.append({
                "machineId":  MACHINE_ID,
                "sensorType": config["sensorType"],
                "value":      round(float(value), 4),
                "unit":       config["unit"],
            })
            log.debug(f"{node_id} ({config['sensorType']}) = {value}")
        except Exception as e:
            log.warning(f"Failed to read {node_id}: {e}")
    return readings

def send_to_myncel(readings: list[dict]) -> bool:
    """POST readings to Myncel API."""
    try:
        r = requests.post(
            MYNCEL_URL,
            json=readings,
            headers={"X-API-Key": API_KEY, "Content-Type": "application/json"},
            timeout=10,
        )
        if r.status_code == 200:
            log.info(f"✅ Sent {len(readings)} readings")
            return True
        log.error(f"❌ HTTP {r.status_code}: {r.text}")
    except Exception as e:
        log.error(f"Send error: {e}")
    return False

# ── Subscription mode (push instead of poll) ───────────────
class NodeChangeHandler:
    """Handler for OPC-UA subscriptions — receives changes in real time."""
    def __init__(self):
        self.pending = []

    def datachange_notification(self, node, val, data):
        node_id = node.nodeid.to_string()
        config  = NODE_MAP.get(node_id)
        if config:
            self.pending.append({
                "machineId":  MACHINE_ID,
                "sensorType": config["sensorType"],
                "value":      round(float(val), 4),
                "unit":       config["unit"],
            })
            if len(self.pending) >= 10:  # flush every 10 changes
                send_to_myncel(self.pending)
                self.pending = []

def main_polling():
    """Poll OPC-UA nodes at a fixed interval."""
    client = None
    while True:
        try:
            if client is None:
                client = connect_opcua()
            readings = read_all_nodes(client)
            if readings:
                send_to_myncel(readings)
        except Exception as e:
            log.error(f"Error: {e} — reconnecting...")
            try:
                client.disconnect()
            except Exception:
                pass
            client = None
            time.sleep(5)
            continue
        time.sleep(INTERVAL)

def main_subscription():
    """Subscribe to OPC-UA node changes (lower latency)."""
    client = connect_opcua()
    handler = NodeChangeHandler()
    sub = client.create_subscription(500, handler)  # 500ms min interval
    nodes = [client.get_node(nid) for nid in NODE_MAP]
    sub.subscribe_data_change(nodes)
    log.info("🔔 Subscribed to OPC-UA nodes. Waiting for changes...")
    try:
        while True:
            time.sleep(1)
            # Flush any remaining pending readings every 30s
            if handler.pending:
                send_to_myncel(handler.pending)
                handler.pending = []
    except KeyboardInterrupt:
        sub.delete()
        client.disconnect()

if __name__ == "__main__":
    import sys
    mode = sys.argv[1] if len(sys.argv) > 1 else "poll"
    if mode == "subscribe":
        main_subscription()
    else:
        main_polling()`,
    tips: [
      'Use UAExpert (free from Unified Automation) to browse your OPC-UA server and find Node IDs',
      'The subscription mode is preferred for real-time monitoring (changes trigger immediately)',
      'Most PLCs require enabling the OPC-UA server in their configuration tool',
      'For Siemens S7: Enable OPC-UA in TIA Portal → PLC Properties → General → OPC UA',
      'Security: Use username/password auth for production. Certificate auth is also supported.',
    ],
  },
  {
    id: 'modbus',
    title: 'Modbus',
    icon: '⚡',
    badge: 'Legacy / Serial',
    badgeColor: '#f59e0b',
    subtitle: 'Modbus RTU / TCP — older industrial standard',
    description: 'Modbus is the oldest industrial protocol (1979) but still widely used in VFDs, power meters, flow meters, and older PLCs. Modbus RTU runs over RS-485 serial; Modbus TCP runs over Ethernet.',
    useCases: ['VFDs / Variable Frequency Drives', 'Power / energy meters', 'Flow meters', 'Older Schneider, ABB, Danfoss equipment', 'Custom sensor modules with RS-485'],
    overview: `Modbus Architecture:
┌─────────────────┐   Modbus RTU    ┌──────────────┐   HTTP    ┌──────────────┐
│  VFD / Meter    │ ─────────────── │  Pi / PC     │ ──────── │ Myncel API   │
│  (RS-485)       │  9600-115200    │  pymodbus    │ API Key  │ /api/iot     │
└─────────────────┘                 └──────────────┘          └──────────────┘

OR:

┌─────────────────┐  Modbus TCP     ┌──────────────┐   HTTP    ┌──────────────┐
│  PLC w/ Modbus  │ ─────────────── │  Pi / PC     │ ──────── │ Myncel API   │
│  TCP enabled    │  Port 502       │  pymodbus    │ API Key  │ /api/iot     │
└─────────────────┘                 └──────────────┘          └──────────────┘`,
    code: `#!/usr/bin/env python3
"""
Myncel Modbus Bridge
Reads registers from Modbus RTU (serial) or Modbus TCP devices
and forwards values to Myncel CMMS

Install: pip install pymodbus requests
"""

import time
import logging
import requests
from pymodbus.client import ModbusTcpClient, ModbusSerialClient
from pymodbus.exceptions import ModbusException

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# ── Myncel Configuration ────────────────────────────────────
MYNCEL_URL = "https://yourapp.com/api/iot"
API_KEY    = "mnc_iot_YOUR_API_KEY"
INTERVAL   = 30  # seconds

# ── Device Configuration ────────────────────────────────────
# Choose ONE of TCP or RTU:

# Option A — Modbus TCP (over Ethernet)
MODBUS_MODE = "tcp"
TCP_HOST    = "192.168.1.50"   # IP of Modbus TCP device
TCP_PORT    = 502

# Option B — Modbus RTU (over RS-485 serial)
# MODBUS_MODE   = "rtu"
# SERIAL_PORT   = "/dev/ttyUSB0"  # or "COM3" on Windows
# SERIAL_BAUD   = 9600
# SERIAL_PARITY = "N"  # N=None, E=Even, O=Odd
# SERIAL_BITS   = 8
# SERIAL_STOP   = 1

# ── Register Map ────────────────────────────────────────────
# Maps Modbus register addresses to Myncel sensor fields.
# machine_id, register address, scale factor, sensorType, unit
REGISTER_MAP = [
    # { machine, register, unit_id, scale, sensor, unit }
    {"machineId": "MACHINE_ID_1", "register": 40001, "unitId": 1, "scale": 0.1,  "sensorType": "temperature",   "unit": "°C"},
    {"machineId": "MACHINE_ID_1", "register": 40002, "unitId": 1, "scale": 0.01, "sensorType": "current",       "unit": "A"},
    {"machineId": "MACHINE_ID_1", "register": 40003, "unitId": 1, "scale": 1.0,  "sensorType": "runtime_hours", "unit": "hrs"},
    {"machineId": "MACHINE_ID_2", "register": 40010, "unitId": 2, "scale": 0.1,  "sensorType": "vibration",     "unit": "mm/s"},
    {"machineId": "MACHINE_ID_2", "register": 40011, "unitId": 2, "scale": 0.1,  "sensorType": "pressure",      "unit": "PSI"},
    # Add more registers here
]

def create_client():
    """Create Modbus client based on mode."""
    if MODBUS_MODE == "tcp":
        client = ModbusTcpClient(TCP_HOST, port=TCP_PORT)
    else:
        client = ModbusSerialClient(
            method="rtu", port=SERIAL_PORT, baudrate=SERIAL_BAUD,
            parity=SERIAL_PARITY, bytesize=SERIAL_BITS, stopbits=SERIAL_STOP,
        )
    if not client.connect():
        raise ConnectionError(f"Failed to connect to Modbus {MODBUS_MODE}")
    log.info(f"✅ Modbus {MODBUS_MODE.upper()} connected")
    return client

def read_registers(client) -> list[dict]:
    """Read all configured registers."""
    readings = []
    for cfg in REGISTER_MAP:
        try:
            # Holding registers = 4xxxx (subtract 40001 for 0-based address)
            addr   = cfg["register"] - 40001 if cfg["register"] >= 40001 else cfg["register"]
            result = client.read_holding_registers(addr, count=1, unit=cfg["unitId"])
            if result.isError():
                log.warning(f"Register {cfg['register']} error: {result}")
                continue
            raw_val = result.registers[0]
            value   = round(raw_val * cfg["scale"], 3)
            readings.append({
                "machineId":  cfg["machineId"],
                "sensorType": cfg["sensorType"],
                "value":      value,
                "unit":       cfg["unit"],
            })
            log.debug(f"Reg {cfg['register']}: {raw_val} → {value} {cfg['unit']}")
        except ModbusException as e:
            log.error(f"Modbus error at register {cfg['register']}: {e}")
    return readings

def send_to_myncel(readings: list[dict]) -> bool:
    try:
        r = requests.post(
            MYNCEL_URL,
            json=readings,
            headers={"X-API-Key": API_KEY, "Content-Type": "application/json"},
            timeout=10,
        )
        if r.status_code == 200:
            log.info(f"✅ Sent {len(readings)} Modbus readings")
            return True
        log.error(f"❌ HTTP {r.status_code}: {r.text}")
    except Exception as e:
        log.error(f"Send error: {e}")
    return False

def main():
    client = None
    while True:
        try:
            if client is None:
                client = create_client()
            readings = read_registers(client)
            if readings:
                send_to_myncel(readings)
        except Exception as e:
            log.error(f"Error: {e} — reconnecting...")
            try:
                client.close()
            except Exception:
                pass
            client = None
            time.sleep(5)
            continue
        time.sleep(INTERVAL)

if __name__ == "__main__":
    main()`,
    tips: [
      'For RS-485, you need a USB-to-RS485 adapter ($8–15). Recommended: FTDI-based adapters',
      'Check your device manual for: baud rate, parity, slave address (unit ID), and register map',
      'Register types: Coils (1x), Discrete Inputs (1x), Input Registers (3x), Holding Registers (4x)',
      'Scale factors convert raw register integers to real values (e.g., 725 × 0.1 = 72.5°C)',
      'Use Modbus Poll (Windows) or mbpoll (Linux) to test register reads before coding',
    ],
  },
  {
    id: 'cloud',
    title: 'Cloud APIs',
    icon: '☁️',
    badge: 'Native Integration',
    badgeColor: '#10b981',
    subtitle: 'Connect existing cloud IoT platforms',
    description: 'If your equipment already sends data to AWS IoT Core, Azure IoT Hub, or other cloud platforms, you can bridge that data into Myncel using serverless functions or webhooks.',
    useCases: ['AWS IoT Core + Lambda', 'Azure IoT Hub + Functions', 'Google Cloud IoT', 'ThingsBoard', 'Losant', 'Particle.io'],
    overview: `Cloud IoT Bridge:
┌──────────────┐  Device Shadow  ┌──────────────┐  Lambda/Fn   ┌──────────────┐
│  IoT Device  │ ─────────────── │  AWS IoT     │ ──────────── │ Myncel API   │
│              │  MQTT           │  Core        │  HTTP POST   │ /api/iot     │
└──────────────┘                 └──────────────┘              └──────────────┘`,
    code: `// ── AWS Lambda: IoT Core → Myncel Bridge ──────────────────
// Deploy as Lambda function triggered by IoT Core rule.
// Rule SQL: SELECT * FROM 'factory/+/+'

const https = require('https');

const MYNCEL_URL = 'https://yourapp.com';
const API_KEY    = process.env.MYNCEL_API_KEY;  // Store in Lambda env vars

// IoT Core rule delivers: { machineId, sensorType, value, unit, timestamp }
exports.handler = async (event) => {
  const readings = Array.isArray(event) ? event : [event];
  
  const body = JSON.stringify(readings.map(r => ({
    machineId:  r.machineId  || r.machine_id || r.device_id,
    sensorType: r.sensorType || r.sensor_type || r.type,
    value:      parseFloat(r.value),
    unit:       r.unit || '',
  })));

  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(MYNCEL_URL).hostname,
      path: '/api/iot',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Myncel response:', res.statusCode, data);
        resolve({ statusCode: res.statusCode });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

// ── Azure Functions: IoT Hub → Myncel ──────────────────────
// module.exports = async function (context, IoTHubMessages) {
//   const readings = IoTHubMessages.map(msg => ({
//     machineId:  msg.deviceId,
//     sensorType: msg.sensorType,
//     value:      msg.value,
//     unit:       msg.unit,
//   }));
//   await fetch('https://yourapp.com/api/iot', {
//     method: 'POST',
//     headers: { 'X-API-Key': process.env.MYNCEL_API_KEY, 'Content-Type': 'application/json' },
//     body: JSON.stringify(readings),
//   });
// };

// ── ThingsBoard Webhook → Myncel ────────────────────────────
// In ThingsBoard: Rule Engine → External → REST API Call
// URL: https://yourapp.com/api/iot
// Method: POST
// Headers: X-API-Key: mnc_iot_YOUR_KEY
// Body template:
// {
//   "machineId":  "$[deviceId]",
//   "sensorType": "$[sensorType]",
//   "value":      $[value],
//   "unit":       "$[unit]"
// }

// ── Particle.io Webhook ─────────────────────────────────────
// In Particle Console: Integrations → New Integration → Webhook
// Event: sensor-reading
// URL: https://yourapp.com/api/iot
// Request Type: POST
// Request Format: JSON
// Headers: X-API-Key: mnc_iot_YOUR_KEY
// JSON Data:
// {
//   "machineId":  "YOUR_MACHINE_ID",
//   "sensorType": "{{sensorType}}",
//   "value":      {{value}},
//   "unit":       "{{unit}}"
// }`,
    tips: [
      'Store your Myncel API key in Lambda/Functions environment variables — never hardcode',
      'Use IoT Core rules with SQL filters to route only relevant topics to the bridge',
      'Batch readings when possible — one Lambda invocation can send 100 readings to Myncel',
      'Set up CloudWatch/Application Insights alerts to monitor bridge health',
      'Test the bridge with the Myncel IoT Simulator before connecting real devices',
    ],
  },
];

export default function ProtocolsPage() {
  const [active, setActive] = useState(PROTOCOLS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const proto = PROTOCOLS.find(p => p.id === active)!;

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="dash-theme min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>

      {/* Nav */}
      <div className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between"
        style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-75 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <span style={{ color: 'var(--border)' }}>›</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>OPC-UA / Modbus Guides</span>
        </div>
        <div className="flex gap-2">
          <Link href="/docs/iot-guides" className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)' }}>
            ← ESP32 / Pi Guides
          </Link>
          <Link href="/docs/api" className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ color: '#635bff', backgroundColor: 'rgba(99,91,255,0.08)', border: '1px solid rgba(99,91,255,0.25)' }}>
            API Docs →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Industrial Protocol Guides</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Connect PLCs, VFDs, SCADA systems, and cloud IoT platforms to Myncel CMMS.
          </p>
        </div>

        {/* Protocol tabs */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {PROTOCOLS.map(p => (
            <button key={p.id} onClick={() => setActive(p.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={active === p.id
                ? { backgroundColor: 'var(--bg-surface)', border: `2px solid ${p.badgeColor}`, color: 'var(--text-primary)' }
                : { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
              }>
              <span className="text-base">{p.icon}</span>
              <span>{p.title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white"
                style={{ backgroundColor: p.badgeColor, opacity: active === p.id ? 1 : 0.6 }}>
                {p.badge}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{proto.icon}</span>
                <div>
                  <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>{proto.title}</h2>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{proto.subtitle}</p>
                </div>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{proto.description}</p>
            </div>

            {/* Architecture diagram */}
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Architecture</h3>
              <pre className="text-xs font-mono whitespace-pre-wrap overflow-auto"
                style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-page)', borderRadius: '8px', padding: '10px', border: '1px solid var(--border)' }}>
                {proto.overview}
              </pre>
            </div>

            {/* Common use cases */}
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Common Use Cases</h3>
              <ul className="space-y-1.5">
                {proto.useCases.map(uc => (
                  <li key={uc} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-primary)' }}>
                    <span style={{ color: proto.badgeColor }}>▸</span> {uc}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tips */}
            <div className="rounded-xl p-4" style={{ backgroundColor: `rgba(99,91,255,0.06)`, border: '1px solid rgba(99,91,255,0.2)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-2 text-[#635bff]">💡 Tips</h3>
              <ul className="space-y-1.5">
                {proto.tips.map(tip => (
                  <li key={tip} className="text-xs flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <span className="text-[#635bff] flex-shrink-0">•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick links */}
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-secondary)' }}>Related Resources</h3>
              <div className="space-y-2">
                {[
                  { href: '/settings/api-keys',    label: '🔑 Get API Keys',         color: '#635bff' },
                  { href: '/docs/iot-guides',       label: '📡 ESP32 / Pi Guides',   color: 'var(--text-secondary)' },
                  { href: '/dashboard/iot-simulator', label: '🔬 IoT Simulator',     color: 'var(--text-secondary)' },
                  { href: '/docs/api',              label: '📖 Full API Reference',  color: 'var(--text-secondary)' },
                  { href: '/setup',                 label: '⚡ Setup Wizard',         color: 'var(--text-secondary)' },
                ].map(link => (
                  <Link key={link.href} href={link.href}
                    className="block text-xs px-3 py-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: link.color, backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)' }}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Code panel */}
          <div className="lg:col-span-2">
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-page)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {proto.id === 'opcua'   ? 'myncel_opcua_bridge.py' :
                     proto.id === 'modbus'  ? 'myncel_modbus_bridge.py' :
                     'cloud_bridge.js'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono"
                    style={{ backgroundColor: 'rgba(99,91,255,0.1)', color: '#635bff' }}>
                    {proto.id === 'cloud' ? 'JavaScript' : 'Python 3'}
                  </span>
                </div>
                <button
                  onClick={() => copy(proto.code, 'code')}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    backgroundColor: copiedId === 'code' ? 'rgba(16,185,129,0.15)' : 'rgba(99,91,255,0.1)',
                    color: copiedId === 'code' ? '#10b981' : '#635bff',
                    border: `1px solid ${copiedId === 'code' ? 'rgba(16,185,129,0.3)' : 'rgba(99,91,255,0.3)'}`,
                  }}>
                  {copiedId === 'code' ? '✓ Copied!' : '📋 Copy Code'}
                </button>
              </div>

              <div className="overflow-auto max-h-[70vh]">
                <pre className="p-5 text-xs font-mono leading-relaxed"
                  style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-page)', margin: 0 }}>
                  <code>{proto.code}</code>
                </pre>
              </div>
            </div>

            {/* MQTT Bridge promo */}
            <div className="mt-4 rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">🔀</div>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Using MQTT? Try the MQTT Bridge
                  </h3>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Myncel includes a built-in MQTT bridge endpoint at{' '}
                    <code className="text-[#635bff] bg-[#635bff]/10 px-1 rounded text-xs">POST /api/mqtt-bridge</code>.
                    It accepts topic-based payloads (e.g.{' '}
                    <code className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>factory/machineId/temperature</code>) and
                    auto-routes them to the right equipment without any custom code.
                  </p>
                  <div className="rounded-lg p-3 font-mono text-xs overflow-auto"
                    style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: '#10b981' }}>
                    {`# Send via Mosquitto or any MQTT client:\ncurl -X POST /api/mqtt-bridge \\
     -H "X-API-Key: YOUR_KEY" \\
     -d '{"topic":"factory/machineId/temperature","value":72.5}'`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}