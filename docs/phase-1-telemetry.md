# Myncel Phase 1 Telemetry Setup

Phase 1 adds a secure path for real devices, laptops, edge gateways, or simple scripts to send equipment readings into Myncel.

## What was added

- `POST /api/machines/[id]/device-token`  
  Creates a machine-specific telemetry device token. The raw token is shown only once.

- `GET /api/machines/[id]/device-token`  
  Lists token metadata for a machine.

- `DELETE /api/machines/[id]/device-token?tokenId=...`  
  Revokes a machine device token.

- `POST /api/iot/ingest`  
  Accepts telemetry readings from a device token and stores them in `SensorReading`.

- `tools/telemetry/laptop_agent.py`  
  Sample Python laptop/desktop telemetry agent.

## Token security model

Device tokens are not user login sessions. They are machine-scoped API credentials.

The raw token is returned only when it is created. Myncel stores only a SHA-256 hash, plus a short display prefix. If the raw token is lost, revoke it and create a new one.

Devices can authenticate with either header:

```http
Authorization: Bearer <device-token>
```

or:

```http
x-myncel-device-token: <device-token>
```

## Generate a device token

You must be signed in as an owner/admin for that machine's organization, or as a platform super admin.

Example:

```bash
curl -X POST "https://YOUR-MYNCEL-DOMAIN.com/api/machines/MACHINE_ID/device-token" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_BROWSER_SESSION_COOKIE" \
  -d '{"name":"Laptop test agent"}'
```

The response includes:

```json
{
  "success": true,
  "deviceToken": "myncel_dt_...",
  "warning": "Copy this deviceToken now..."
}
```

Copy `deviceToken` immediately.

## Send a manual test reading

```bash
curl -X POST "https://YOUR-MYNCEL-DOMAIN.com/api/iot/ingest" \
  -H "Authorization: Bearer myncel_dt_YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "readings": [
      { "type": "temperature", "value": 72.4, "unit": "°C" },
      { "type": "cpu_load", "value": 38.2, "unit": "%" }
    ]
  }'
```

A successful response looks like:

```json
{
  "success": true,
  "accepted": 2,
  "machineId": "...",
  "machineName": "...",
  "receivedAt": "..."
}
```

## Run the sample laptop agent

Install dependencies:

```bash
python3 -m pip install requests psutil
```

Set environment variables:

```bash
export MYNCEL_BASE_URL="https://YOUR-MYNCEL-DOMAIN.com"
export MYNCEL_DEVICE_TOKEN="myncel_dt_YOUR_TOKEN"
export MYNCEL_INTERVAL_SECONDS="5"
```

Run:

```bash
python3 tools/telemetry/laptop_agent.py
```

The agent sends readings such as:

- `cpu_load`
- `memory_usage`
- `disk_usage`
- `network_bytes_sent`
- `network_bytes_recv`
- `uptime`
- `cpu_temperature`, when available
- `battery`, when available

## Read readings back from Myncel

Use the existing dashboard sensor API:

```bash
curl "https://YOUR-MYNCEL-DOMAIN.com/api/dashboard/sensors?machineId=MACHINE_ID&limit=50"
```

You can filter by type:

```bash
curl "https://YOUR-MYNCEL-DOMAIN.com/api/dashboard/sensors?machineId=MACHINE_ID&type=cpu_load&limit=50"
```

## Payload format

Batch payload:

```json
{
  "readings": [
    {
      "type": "vibration",
      "value": 2.4,
      "unit": "mm/s",
      "recordedAt": "2026-01-01T12:00:00.000Z"
    }
  ]
}
```

Single-reading payload:

```json
{
  "type": "pressure",
  "value": 81.5,
  "unit": "PSI"
}
```

`recordedAt` is optional. If omitted, Myncel uses the server receive time.

## Limits and validation

- Maximum batch size: 100 readings.
- Reading timestamps cannot be more than 30 days old.
- Reading timestamps cannot be more than 5 minutes in the future.
- `type`, `unit`, and numeric `value` are required.
- Token must be active and not revoked.

## Next recommended improvements

Phase 1 proves secure telemetry ingestion. Next improvements should include:

1. A UI button in the machine record to create/revoke device tokens.
2. Live polling in the HMI modal to display latest readings.
3. Threshold rules that create alerts/work orders automatically.
4. MQTT or OPC UA gateway support for industrial machines.