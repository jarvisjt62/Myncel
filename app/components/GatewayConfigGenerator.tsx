'use client';

import { useMemo, useState } from 'react';

type ConnectorKey = 'modbus_tcp' | 'modbus_rtu' | 'opcua' | 'mqtt' | 'mtconnect' | 'bacnet' | 'siemens_s7' | 'rockwell_ethernet_ip' | 'beckhoff_ads';

const CONNECTORS: Record<ConnectorKey, { label: string; port: string; endpoint: string; sample: string }> = {
  modbus_tcp: {
    label: 'Modbus TCP',
    port: '502',
    endpoint: '192.168.1.50',
    sample: `  - name: spindle_load
    type: modbus_tcp
    host: 192.168.1.50
    port: 502
    unit_id: 1
    register: 40001
    data_type: float32
    poll_interval_ms: 1000`,
  },
  modbus_rtu: {
    label: 'Modbus RTU',
    port: '/dev/ttyUSB0',
    endpoint: '9600 baud',
    sample: `  - name: compressor_pressure
    type: modbus_rtu
    serial_port: /dev/ttyUSB0
    baudrate: 9600
    parity: N
    stopbits: 1
    unit_id: 1
    register: 30001
    data_type: int16
    poll_interval_ms: 2000`,
  },
  opcua: {
    label: 'OPC UA',
    port: '4840',
    endpoint: 'opc.tcp://192.168.1.60:4840',
    sample: `  - name: line_runtime
    type: opcua
    endpoint: opc.tcp://192.168.1.60:4840
    node_id: ns=2;s=Machine.RuntimeHours
    security_policy: None
    poll_interval_ms: 1000`,
  },
  mqtt: {
    label: 'MQTT Subscriber',
    port: '1883',
    endpoint: 'mqtt://broker.local:1883',
    sample: `  - name: esp32_temperature
    type: mqtt
    broker_url: mqtt://broker.local:1883
    topic: myncel/plant1/machine-a/temperature
    value_path: temperature
    client_id: myncel-edge-gateway
    qos: 1`,
  },
  mtconnect: {
    label: 'MTConnect CNC',
    port: '5000',
    endpoint: 'http://cnc.local:5000/current',
    sample: `  - name: cnc_execution_state
    type: mtconnect
    url: http://cnc.local:5000/current
    data_item: execution
    poll_interval_ms: 1000`,
  },
  bacnet: {
    label: 'BACnet/IP',
    port: '47808',
    endpoint: '192.168.1.70',
    sample: `  - name: chiller_supply_temp
    type: bacnet
    device_address: 192.168.1.70
    object_type: analogInput
    object_instance: 1
    property: presentValue
    poll_interval_ms: 5000`,
  },
  siemens_s7: {
    label: 'Siemens S7',
    port: '102',
    endpoint: '192.168.1.80',
    sample: `  - name: s7_cycle_count
    type: siemens_s7
    host: 192.168.1.80
    rack: 0
    slot: 1
    db_number: 1
    start: 0
    size: 4
    data_type: dint
    poll_interval_ms: 1000`,
  },
  rockwell_ethernet_ip: {
    label: 'Rockwell EtherNet/IP',
    port: '44818',
    endpoint: '192.168.1.90',
    sample: `  - name: rockwell_motor_amps
    type: rockwell_ethernet_ip
    host: 192.168.1.90
    tag: MotorAmps
    data_type: real
    poll_interval_ms: 1000`,
  },
  beckhoff_ads: {
    label: 'Beckhoff ADS',
    port: '851',
    endpoint: '5.44.160.1.1.1',
    sample: `  - name: beckhoff_part_count
    type: beckhoff_ads
    ams_net_id: 5.44.160.1.1.1
    ams_port: 851
    symbol: MAIN.PartCount
    data_type: dint
    poll_interval_ms: 1000`,
  },
};

export default function GatewayConfigGenerator({ machineId, machineName }: { machineId?: string; machineName?: string }) {
  const [connector, setConnector] = useState<ConnectorKey>('modbus_tcp');
  const [apiBaseUrl, setApiBaseUrl] = useState('https://www.myncel.com');
  const [deviceToken, setDeviceToken] = useState('paste_device_or_gateway_token_here');
  const [siteName, setSiteName] = useState('Plant 1');
  const current = CONNECTORS[connector];

  const yaml = useMemo(() => {
    return `gateway:
  name: ${machineName ? `${machineName} Edge Gateway` : 'Myncel Edge Gateway'}
  site: ${siteName}
  api_base_url: ${apiBaseUrl}
  device_token: ${deviceToken}
  offline_buffer:
    enabled: true
    sqlite_path: ./data/myncel_edge_buffer.sqlite
    flush_interval_seconds: 15
    max_retention_hours: 72

machine:
  id: ${machineId || 'replace_with_machine_id'}
  name: ${machineName || 'replace_with_machine_name'}

connectors:
${current.sample}

forwarding:
  endpoint: /api/iot/ingest
  batch_size: 100
  timeout_seconds: 10
  include_gateway_health: true
`;
  }, [apiBaseUrl, current.sample, deviceToken, machineId, machineName, siteName]);

  const downloadYaml = () => {
    const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `myncel-${connector}-gateway.yaml`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="rounded-2xl border border-[var(--border,#d9e2ef)] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#635bff]">Gateway config generator</p>
          <h3 className="mt-1 text-lg font-bold text-[#0a2540]">Export a ready-to-edit YAML config</h3>
          <p className="mt-1 text-sm text-[#425466]">Choose a connector type, add your endpoint and gateway token, then download the YAML file for the Python edge runtime or Raspberry Pi agent.</p>
        </div>
        <button onClick={downloadYaml} className="rounded-lg bg-[#635bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5]">
          Export YAML
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-semibold text-[#0a2540]">
          Connector type
          <select value={connector} onChange={e => setConnector(e.target.value as ConnectorKey)} className="mt-1 w-full rounded-lg border border-[#d9e2ef] px-3 py-2 text-sm">
            {Object.entries(CONNECTORS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-[#0a2540]">
          Myncel API base URL
          <input value={apiBaseUrl} onChange={e => setApiBaseUrl(e.target.value)} className="mt-1 w-full rounded-lg border border-[#d9e2ef] px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold text-[#0a2540]">
          Device / gateway token
          <input value={deviceToken} onChange={e => setDeviceToken(e.target.value)} className="mt-1 w-full rounded-lg border border-[#d9e2ef] px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold text-[#0a2540]">
          Site / line name
          <input value={siteName} onChange={e => setSiteName(e.target.value)} className="mt-1 w-full rounded-lg border border-[#d9e2ef] px-3 py-2 text-sm" />
        </label>
      </div>

      <div className="mt-4 rounded-xl border border-[#d9e2ef] bg-[#0a2540] p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#c8d3e8]">{current.label} · {current.endpoint} · {current.port}</span>
          <button onClick={() => navigator.clipboard?.writeText(yaml)} className="rounded-md border border-white/20 px-2 py-1 text-xs font-semibold text-white hover:bg-white/10">Copy</button>
        </div>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-[#d6e2ff]">{yaml}</pre>
      </div>
    </div>
  );
}
