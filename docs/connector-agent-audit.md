# Myncel Connector and Agent Audit

## Executive summary

Myncel currently has a working telemetry ingestion foundation, but it does **not** yet have committed runnable connector agents for all common industrial equipment and protocols.

The application already supports telemetry storage and display through backend APIs. It has the new secure device-token endpoint at `POST /api/iot/ingest`, the older API-key endpoint at `POST /api/iot`, and an MQTT-style HTTP bridge at `POST /api/mqtt-bridge`. It also includes documentation/example code for ESP32, Raspberry Pi, Node-RED, OPC UA, and Modbus. However, the only actual runnable agent file committed under `tools/` is `tools/telemetry/laptop_agent.py`.

In short: Myncel has the ingestion layer, one laptop/desktop sample agent, and several docs examples, but it is missing production-ready connector packages for most real industrial machines.

## What exists now

| Area | Status | Evidence | Notes |
|---|---:|---|---|
| Secure machine-bound ingestion | Available | `app/api/iot/ingest/route.ts` | Uses bearer or `x-myncel-device-token`, stores readings against the token's machine. Best foundation for Phase 1+. |
| Device token management | Available | `app/api/machines/[id]/device-token/route.ts` | Creates/revokes machine-specific telemetry tokens. Raw token shown once. |
| Legacy/general IoT ingestion | Available | `app/api/iot/route.ts` | API-key based endpoint requiring `machineId` in the payload. Supports predefined sensor types and alert thresholds. |
| MQTT-style HTTP bridge | Available | `app/api/mqtt-bridge/route.ts` | Accepts MQTT-shaped JSON from Node-RED/Mosquitto gateways, but it is not itself an MQTT broker/client. |
| Laptop/desktop telemetry agent | Available | `tools/telemetry/laptop_agent.py` | Actual runnable script. Sends CPU, memory, disk, network, uptime, battery, temperature if available. |
| Phase 1 telemetry guide | Available | `docs/phase-1-telemetry.md` | Explains token generation and `/api/iot/ingest`. |
| ESP32 guide/example | Documentation only | `app/docs/iot-guides/page.tsx` | Embedded example code, not a standalone committed `.ino` file. |
| Raspberry Pi guide/example | Documentation only | `app/docs/iot-guides/page.tsx` | Embedded example code, not a standalone committed agent package except the laptop script. |
| Node-RED/MQTT guide/example | Documentation plus backend bridge | `app/docs/iot-guides/page.tsx`, `app/api/mqtt-bridge/route.ts` | Useful, but no packaged Node-RED flow file committed under `tools/`. |
| OPC UA guide/example | Documentation only | `app/docs/protocols/page.tsx` | Mentions `myncel_opcua_bridge.py`, but that file does not exist in `tools/`. |
| Modbus guide/example | Documentation only | `app/docs/protocols/page.tsx` | Mentions `myncel_modbus_bridge.py`, but that file does not exist in `tools/`. |

## Missing connector/agent coverage

| Equipment/protocol category | Current coverage | Missing item |
|---|---:|---|
| Generic HTTP-capable devices/gateways | Partially covered | Need reusable generic HTTP agent template with config file, retries, offline buffering, and service install instructions. |
| Laptop/desktop/server monitoring | Covered as sample | Needs hardening if used in production: config file, daemon/service mode, local queue, signed release. |
| ESP32 / Arduino-class sensors | Documentation only | Need standalone `esp32_myncel_sensor.ino` or PlatformIO project. |
| Raspberry Pi sensor/gateway | Documentation only | Need standalone `raspberry_pi_agent.py` with GPIO/1-Wire/I2C examples and systemd service file. |
| Node-RED gateway | Documentation plus backend bridge | Need exportable Node-RED flow JSON file and deployment guide. |
| MQTT broker/client integration | Partial | Backend accepts MQTT-style HTTP payloads, but Myncel does not run an MQTT subscriber/bridge agent that connects to Mosquitto/AWS IoT/HiveMQ and forwards messages. |
| Modbus TCP | Documentation only | Need runnable `modbus_tcp_agent.py` using `pymodbus`, register map config, scaling, units, polling, retries. |
| Modbus RTU / RS-485 | Documentation only | Need runnable serial Modbus agent with `/dev/ttyUSB*` config, slave IDs, baud/parity settings. |
| OPC UA | Documentation only | Need runnable `opcua_agent.py` using `asyncua` or `opcua`, NodeId mapping config, reconnect handling. |
| Siemens S7 PLC | Missing | Need S7 connector, typically `python-snap7` or OPC UA path if PLC exposes OPC UA. |
| Allen-Bradley / Rockwell PLC | Missing | Need EtherNet/IP/CIP connector or route through OPC UA/gateway. |
| Beckhoff | Missing | Need ADS connector or OPC UA route. |
| Omron/Mitsubishi PLCs | Missing | Need vendor protocol connectors or Modbus/OPC UA gateway approach. |
| CNC machines | Mostly missing | Need MTConnect connector first; optional vendor-specific adapters for Fanuc, Haas, Mazak depending access. Existing CNC references are UI/blog/HMI visuals, not telemetry connectors. |
| Compressors, pumps, chillers, HVAC | Missing as equipment-specific agents | Many can be covered through Modbus/BACnet/OPC UA, but no dedicated templates exist. |
| BACnet/IP for HVAC/building equipment | Missing | Need BACnet connector for AHUs, chillers, boilers, VFDs, BMS integrations. |
| EtherCAT / Profinet | Missing | Usually not directly read from cloud app; should be via PLC/SCADA/OPC UA gateway. Need documented gateway pattern. |
| CSV/file-drop/FTP historian import | Missing | Useful for old machines or SCADA exports. Need polling importer. |
| Edge gateway runtime | Missing | Need a packaged gateway service that can run multiple connector plugins locally and forward to `/api/iot/ingest`. |
| Offline buffering/store-and-forward | Missing | Needed for factory networks where internet is intermittent. |
| Remote connector configuration UI | Missing | Admin UI can create tokens, but no full UI for connector maps/registers/topics/nodes. |

## Priority recommendation

The best next step is not to create one connector per machine brand immediately. Instead, build a small set of universal industrial connectors that cover most equipment through standard protocols.

Priority 1 should be a production-ready edge gateway foundation. It should read a YAML/JSON config, poll one or more connector plugins, normalize readings to Myncel's `{ type, value, unit, recordedAt }` shape, authenticate with a machine device token, POST to `/api/iot/ingest`, and support retries/offline buffering.

Priority 2 should be the first three connector plugins: Modbus TCP/RTU, OPC UA, and MQTT subscriber. Those three cover a large portion of PLCs, compressors, pumps, power meters, sensors, chillers, VFDs, and SCADA gateways.

Priority 3 should be device-maker templates and packaged examples: ESP32, Raspberry Pi, Node-RED flow JSON, and hardened laptop/server agent.

Priority 4 should cover specialized industrial protocols: MTConnect for CNC machines, BACnet/IP for HVAC/building systems, Siemens S7 via Snap7, Rockwell EtherNet/IP/CIP, and file/CSV historian import.

## Practical answer

If the question is, "Does Myncel already have all connectors and agents for all necessary machines and equipment?" the answer is **no**.

Myncel has a strong ingestion backend and enough examples to prove the path, but the repository currently only includes one runnable telemetry agent file: `tools/telemetry/laptop_agent.py`. The other machine/protocol coverage is mainly documented examples, not production connector packages.

The next implementation should focus on an edge gateway plus Modbus, OPC UA, and MQTT subscriber connectors because those will cover the broadest range of industrial equipment fastest.