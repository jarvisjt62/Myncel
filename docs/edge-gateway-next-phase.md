# Myncel Edge Gateway Next Phase

## Overview

This phase adds a local Myncel Edge Gateway toolkit under `tools/edge-gateway/`. The gateway is designed to run close to equipment on an industrial PC, Raspberry Pi, mini PC, or plant network server. It reads equipment data through protocol plugins, normalizes readings into Myncel's telemetry shape, buffers readings when internet is unavailable, and forwards data into Myncel through the secure machine-bound endpoint:

```text
POST /api/iot/ingest
Authorization: Bearer <machine-device-token>
```

The gateway does not replace the Myncel application backend. It complements it. Myncel remains the cloud/web application, while this gateway runs locally at the equipment site.

## What was added

The new implementation lives mainly in:

```text
tools/edge-gateway/
```

Important files:

```text
tools/edge-gateway/run_gateway.py
tools/edge-gateway/requirements.txt
tools/edge-gateway/examples/config.example.yaml
tools/edge-gateway/systemd/myncel-edge-gateway.service
tools/edge-gateway/myncel_edge_gateway/gateway.py
tools/edge-gateway/myncel_edge_gateway/buffer.py
tools/edge-gateway/myncel_edge_gateway/http_client.py
tools/edge-gateway/myncel_edge_gateway/models.py
tools/edge-gateway/myncel_edge_gateway/connectors/modbus.py
tools/edge-gateway/myncel_edge_gateway/connectors/opcua.py
tools/edge-gateway/myncel_edge_gateway/connectors/mqtt.py
tools/edge-gateway/myncel_edge_gateway/connectors/mtconnect.py
tools/edge-gateway/myncel_edge_gateway/connectors/bacnet.py
tools/edge-gateway/myncel_edge_gateway/connectors/siemens_s7.py
tools/edge-gateway/myncel_edge_gateway/connectors/rockwell_ethernet_ip.py
tools/edge-gateway/myncel_edge_gateway/connectors/beckhoff_ads.py
tools/edge-gateway/esp32_myncel_sensor/esp32_myncel_sensor.ino
tools/edge-gateway/raspberry-pi/raspberry_pi_agent.py
tools/edge-gateway/node-red/myncel_mqtt_bridge_flow.json
```

## Connector coverage

The gateway now includes runnable connector templates for the most important missing pieces identified in the connector audit.

| Missing piece | Added file | Status |
|---|---|---|
| Edge gateway runtime with offline buffering and plugin connectors | `myncel_edge_gateway/gateway.py`, `buffer.py`, `http_client.py` | Added |
| Modbus TCP/RTU runnable connector | `connectors/modbus.py` | Added |
| OPC UA runnable connector | `connectors/opcua.py` | Added |
| MQTT subscriber/forwarder agent | `connectors/mqtt.py` | Added |
| ESP32 standalone project | `esp32_myncel_sensor/esp32_myncel_sensor.ino` | Added |
| Raspberry Pi gateway agent | `raspberry-pi/raspberry_pi_agent.py` | Added |
| Node-RED flow export | `node-red/myncel_mqtt_bridge_flow.json` | Added |
| MTConnect CNC connector | `connectors/mtconnect.py` | Added |
| BACnet/IP connector | `connectors/bacnet.py` | Added |
| Siemens S7 connector/gateway pattern | `connectors/siemens_s7.py` | Added |
| Rockwell EtherNet/IP connector/gateway pattern | `connectors/rockwell_ethernet_ip.py` | Added |
| Beckhoff ADS connector/gateway pattern | `connectors/beckhoff_ads.py` | Added |

## Installation

On the gateway machine, copy or clone the repository, then install the Python dependencies.

```bash
cd tools/edge-gateway
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

The `requirements.txt` includes both core and optional connector libraries. In production, you can install only what the site needs. For example, a Modbus-only gateway needs `requests`, `PyYAML`, and `pymodbus`. An OPC UA-only gateway needs `requests`, `PyYAML`, and `asyncua`.

## Device token setup

Create a device token for the exact machine record that should receive the readings. Use the existing Myncel endpoint:

```text
POST /api/machines/[id]/device-token
```

Copy the raw token immediately because Myncel stores only the hash and will not show the raw value again.

The edge gateway uses this token in the config:

```yaml
myncel:
  base_url: https://YOUR-MYNCEL-DOMAIN.com
  device_token: myncel_dt_REPLACE_WITH_MACHINE_DEVICE_TOKEN
```

For a multi-machine site, the safest first approach is one gateway config per machine token. Later, the gateway can be extended to support per-connector or per-reading machine routing.

## Configuration

Start from:

```text
tools/edge-gateway/examples/config.example.yaml
```

Copy it to a real config path:

```bash
cp tools/edge-gateway/examples/config.example.yaml edge-gateway.yaml
```

Then set:

```yaml
myncel:
  base_url: https://your-production-domain.com
  device_token: myncel_dt_...
```

Enable only the connector required for the site by changing `enabled: false` to `enabled: true`.

## Running manually

```bash
cd tools/edge-gateway
. .venv/bin/activate
python run_gateway.py --config examples/config.example.yaml --log-level INFO
```

For production, do not run the example config unchanged. Create a site-specific config with the correct device token and equipment addresses.

## Running as a systemd service

A service template is included:

```text
tools/edge-gateway/systemd/myncel-edge-gateway.service
```

Typical deployment:

```bash
sudo useradd --system --home /opt/myncel-edge-gateway --shell /usr/sbin/nologin myncel
sudo mkdir -p /opt/myncel-edge-gateway /etc/myncel
sudo cp -r tools/edge-gateway/* /opt/myncel-edge-gateway/
sudo cp edge-gateway.yaml /etc/myncel/edge-gateway.yaml
sudo chown -R myncel:myncel /opt/myncel-edge-gateway /etc/myncel
cd /opt/myncel-edge-gateway
sudo -u myncel python3 -m venv .venv
sudo -u myncel .venv/bin/pip install -r requirements.txt
sudo cp systemd/myncel-edge-gateway.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable myncel-edge-gateway
sudo systemctl start myncel-edge-gateway
sudo journalctl -u myncel-edge-gateway -f
```

## Offline buffering

The gateway includes SQLite-backed offline buffering. If Myncel is unreachable, readings are stored locally and flushed later.

The buffer path is configured here:

```yaml
gateway:
  buffer_path: ./myncel_edge_gateway_buffer.sqlite3
```

For production, use a persistent writable path, for example:

```yaml
gateway:
  buffer_path: /var/lib/myncel-edge-gateway/buffer.sqlite3
```

## Modbus TCP/RTU

Use the Modbus connector for equipment such as compressors, pumps, energy meters, VFDs, chillers, boilers, PLCs, and sensors that expose Modbus registers.

Example Modbus TCP:

```yaml
- type: modbus
  name: compressor_modbus_tcp
  enabled: true
  transport: tcp
  host: 192.168.1.50
  port: 502
  unit_id: 1
  registers:
    - type: temperature
      unit: °C
      address: 40001
      function: holding
      data_type: uint16
      scale: 0.1
```

Example Modbus RTU:

```yaml
- type: modbus
  name: power_meter_modbus_rtu
  enabled: true
  transport: rtu
  port: /dev/ttyUSB0
  baudrate: 9600
  parity: N
  stopbits: 1
  unit_id: 1
  registers:
    - type: current
      unit: A
      address: 30001
      function: input
      data_type: uint16
      scale: 0.1
```

## OPC UA

Use OPC UA for PLCs, SCADA systems, industrial gateways, and modern machines exposing a structured data model.

```yaml
- type: opcua
  name: plc_opcua
  enabled: true
  endpoint: opc.tcp://192.168.1.100:4840
  nodes:
    - type: temperature
      unit: °C
      node_id: ns=2;s=Machine.Temperature
```

## MQTT subscriber

Use the MQTT connector when devices publish data to a broker such as Mosquitto, HiveMQ, EMQX, AWS IoT Core, or a Node-RED broker.

```yaml
- type: mqtt
  name: shopfloor_mqtt
  enabled: true
  host: 192.168.1.20
  port: 1883
  topics:
    - factory/+/temperature
    - factory/+/vibration
  unit_map:
    temperature: °C
    vibration: mm/s
```

The connector accepts numeric payloads and JSON payloads such as:

```json
{"value": 74.2, "unit": "°C"}
```

## MTConnect for CNC machines

Use MTConnect for CNC machines where available. It is often a better first approach than vendor-specific CNC protocols.

```yaml
- type: mtconnect
  name: cnc_mtconnect
  enabled: true
  url: http://192.168.1.60:5000
  items:
    - type: spindle_speed
      unit: rpm
      data_item_id: spindle_speed
```

## BACnet/IP

Use BACnet/IP for building equipment and HVAC/BMS assets such as chillers, AHUs, boilers, VAVs, and facility meters.

```yaml
- type: bacnet
  name: chiller_bacnet
  enabled: true
  device_address: 192.168.1.70
  points:
    - type: chilled_water_temp
      unit: °C
      object_type: analogInput
      instance: 1
```

BACnet networks vary significantly. Confirm object IDs and network routing with the BMS technician.

## Siemens S7

Use this only where direct S7 access is approved. If the Siemens PLC exposes OPC UA, prefer OPC UA.

```yaml
- type: siemens_s7
  name: siemens_line_plc
  enabled: true
  host: 192.168.1.80
  rack: 0
  slot: 1
  points:
    - type: runtime_hours
      unit: h
      db_number: 1
      start: 0
      size: 4
      data_type: real
```

## Rockwell EtherNet/IP

Use this for Allen-Bradley/ControlLogix/CompactLogix tags when plant security permits direct read access. Otherwise, route through OPC UA or a historian.

```yaml
- type: rockwell_ethernet_ip
  name: rockwell_line_plc
  enabled: true
  path: 192.168.1.90/1
  tags:
    - type: motor_current
      unit: A
      tag: MotorCurrent
```

## Beckhoff ADS

Use this for Beckhoff/TwinCAT systems when ADS routing is configured.

```yaml
- type: beckhoff_ads
  name: beckhoff_cell
  enabled: true
  ams_net_id: 5.44.160.1.1.1
  ams_port: 851
  ip_address: 192.168.1.95
  symbols:
    - type: temperature
      unit: °C
      symbol: MAIN.temperature
      data_type: real
```

## ESP32 standalone project

The ESP32 sketch is here:

```text
tools/edge-gateway/esp32_myncel_sensor/esp32_myncel_sensor.ino
```

It sends readings directly to `/api/iot/ingest` using a machine device token. Update WiFi, `MYNCEL_BASE_URL`, and `MYNCEL_DEVICE_TOKEN` before flashing.

## Raspberry Pi standalone agent

The Raspberry Pi agent is here:

```text
tools/edge-gateway/raspberry-pi/raspberry_pi_agent.py
```

Run it with:

```bash
export MYNCEL_BASE_URL="https://YOUR-MYNCEL-DOMAIN.com"
export MYNCEL_DEVICE_TOKEN="myncel_dt_..."
python3 raspberry_pi_agent.py
```

It supports CPU temperature, DS18B20 1-Wire sensors, and optional DHT sensors.

## Node-RED flow

The Node-RED flow export is here:

```text
tools/edge-gateway/node-red/myncel_mqtt_bridge_flow.json
```

Import it in Node-RED using:

```text
Menu → Import → Clipboard
```

Then update:

```text
Authorization: Bearer myncel_dt_REPLACE_WITH_DEVICE_TOKEN
https://YOUR-MYNCEL-DOMAIN.com/api/iot/ingest
```

## Security recommendations

Do not expose PLCs directly to the public internet. Run the edge gateway inside the plant network and allow only outbound HTTPS to Myncel. Store device tokens securely. Use one token per machine where possible. Rotate tokens if a gateway is replaced or compromised. Prefer read-only PLC accounts and protocol gateways. Confirm any direct PLC access with the controls engineer or OEM before deployment.

## Next improvement ideas

The next development phase should add a connector management UI in Myncel, signed gateway releases, encrypted local secrets, per-connector machine token routing, health check telemetry, remote configuration pull, and a first-run setup wizard for non-technical installers.