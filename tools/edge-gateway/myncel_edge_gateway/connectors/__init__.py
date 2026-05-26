from __future__ import annotations

CONNECTOR_MODULES = {
    "modbus": "myncel_edge_gateway.connectors.modbus",
    "opcua": "myncel_edge_gateway.connectors.opcua",
    "mqtt": "myncel_edge_gateway.connectors.mqtt",
    "mtconnect": "myncel_edge_gateway.connectors.mtconnect",
    "bacnet": "myncel_edge_gateway.connectors.bacnet",
    "siemens_s7": "myncel_edge_gateway.connectors.siemens_s7",
    "rockwell_ethernet_ip": "myncel_edge_gateway.connectors.rockwell_ethernet_ip",
    "beckhoff_ads": "myncel_edge_gateway.connectors.beckhoff_ads",
    # Vehicle / vessel / UAV connectors (Big Bet #3 — multi-domain expansion)
    "obd2": "myncel_edge_gateway.connectors.obd2",
    "j1939": "myncel_edge_gateway.connectors.j1939",
    "nmea2000": "myncel_edge_gateway.connectors.nmea2000",
    "mavlink": "myncel_edge_gateway.connectors.mavlink",
}
