from __future__ import annotations

import logging
import time
from typing import Any

from .base import Connector, ConnectorConfigError
from ..models import Reading

log = logging.getLogger(__name__)


# Common NMEA 2000 PGNs for marine engine room and navigation telemetry.
# See NMEA 2000 (IEC 61162-3) appendix B for the full PGN reference.
DEFAULT_SIGNALS: dict[str, dict[str, Any]] = {
    "engine_rpm":       {"pgn": 127488, "type": "engine_rpm",       "unit": "rpm",   "field": "engineSpeed"},
    "engine_hours":     {"pgn": 127489, "type": "engine_hours",     "unit": "h",     "field": "engineHours"},
    "engine_oil_temp":  {"pgn": 127489, "type": "oil_temp",         "unit": "C",     "field": "oilTemperature"},
    "engine_oil_press": {"pgn": 127489, "type": "oil_pressure",     "unit": "kPa",   "field": "oilPressure"},
    "coolant_temp":     {"pgn": 127489, "type": "coolant_temp",     "unit": "C",     "field": "coolantTemperature"},
    "fuel_rate":        {"pgn": 127489, "type": "fuel_rate",        "unit": "L/h",   "field": "fuelRate"},
    "alternator_volt":  {"pgn": 127489, "type": "alternator_voltage","unit": "V",    "field": "alternatorPotential"},
    "engine_load":      {"pgn": 127489, "type": "engine_load",      "unit": "%",     "field": "percentEngineLoad"},
    "fuel_level":       {"pgn": 127505, "type": "fuel_level",       "unit": "%",     "field": "fluidLevel"},
    "battery_voltage":  {"pgn": 127508, "type": "battery_voltage",  "unit": "V",     "field": "batteryVoltage"},
    "battery_current":  {"pgn": 127508, "type": "battery_current",  "unit": "A",     "field": "batteryCurrent"},
    "speed_water":      {"pgn": 128259, "type": "boat_speed",       "unit": "kn",    "field": "speedWaterReferenced"},
    "depth":            {"pgn": 128267, "type": "depth",            "unit": "m",     "field": "depthBelowTransducer"},
    "gps_lat":          {"pgn": 129025, "type": "gps_latitude",     "unit": "deg",   "field": "latitude"},
    "gps_lon":          {"pgn": 129025, "type": "gps_longitude",    "unit": "deg",   "field": "longitude"},
    "speed_over_ground":{"pgn": 129026, "type": "speed_over_ground","unit": "kn",    "field": "sog"},
    "wind_speed":       {"pgn": 130306, "type": "wind_speed",       "unit": "kn",    "field": "windSpeed"},
    "rudder_angle":     {"pgn": 127245, "type": "rudder_angle",     "unit": "deg",   "field": "rudderPosition"},
    "water_temp":       {"pgn": 130310, "type": "water_temp",       "unit": "C",     "field": "waterTemperature"},
}


class Nmea2000Connector(Connector):
    """NMEA 2000 connector for vessels — yachts, workboats, charter fleets,
    sportfishing boats, and commercial marine. Reads engine room (RPM, oil
    temp/press, coolant, fuel rate, alternator), tank levels, GPS, depth,
    speed, wind, and rudder via the marine industry's standard CAN-bus.

    Hardware options:
      * Actisense NGT-1 / W2K-1 USB or wireless gateway
      * Yacht Devices YDEN-02 / YDWG-02 Ethernet/Wi-Fi gateway
      * Maretron USB100 USB gateway
      * Raspberry Pi + CAN hat with canboatjs

    The connector talks to a canboat / N2K-Daemon UDP feed (default UDP/2598)
    that emits parsed JSON frames. This avoids re-implementing the binary
    fast-packet protocol in Python and is the same approach OpenCPN, Signal-K,
    and most commercial chartplotters use under the hood.

    Example config:
      type: nmea2000
      name: charter_boat_alpha
      udp_host: 127.0.0.1
      udp_port: 2598
      poll_interval_ms: 1000
      signals: [engine_rpm, engine_hours, coolant_temp, oil_pressure,
                fuel_rate, fuel_level, gps_lat, gps_lon, speed_over_ground]
    """

    mode = "poll"

    def __init__(self, name: str, config: dict[str, Any]) -> None:
        super().__init__(name, config)
        self.udp_host = str(config.get("udp_host", "127.0.0.1"))
        self.udp_port = int(config.get("udp_port", 2598))
        self.poll_interval_ms = int(config.get("poll_interval_ms", 1000))
        signals = config.get("signals", list(DEFAULT_SIGNALS.keys()))
        self.signals: list[dict[str, Any]] = []
        for s in signals:
            if isinstance(s, str):
                preset = DEFAULT_SIGNALS.get(s)
                if preset:
                    self.signals.append({"name": s, **preset})
            elif isinstance(s, dict):
                self.signals.append(s)
        if not self.signals:
            raise ConnectorConfigError(f"{name}: at least one NMEA 2000 signal must be configured")
        self._socket = None
        self._latest: dict[int, dict[str, Any]] = {}

    def start(self) -> None:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind((self.udp_host, self.udp_port))
        s.settimeout(0.05)
        self._socket = s
        log.info("%s listening for NMEA 2000 JSON frames on %s:%d", self.name, self.udp_host, self.udp_port)

    def stop(self) -> None:
        if self._socket is not None:
            try:
                self._socket.close()
            except Exception:
                pass
            self._socket = None

    def poll(self) -> list[Reading]:
        if self._socket is None:
            try:
                self.start()
            except Exception as exc:
                log.warning("%s NMEA 2000 start failed: %s", self.name, exc)
                return []
        import json
        deadline = time.time() + max(self.poll_interval_ms, 200) / 1000.0
        while time.time() < deadline:
            try:
                data, _ = self._socket.recvfrom(4096)
            except Exception:
                continue
            try:
                frame = json.loads(data.decode("utf-8", errors="replace").strip())
            except Exception:
                continue
            pgn = frame.get("pgn")
            fields = frame.get("fields") or frame
            if isinstance(pgn, int) and isinstance(fields, dict):
                self._latest[pgn] = fields
        readings: list[Reading] = []
        for sig in self.signals:
            fields = self._latest.get(int(sig["pgn"]))
            if not fields:
                continue
            value = fields.get(sig["field"])
            if value is None:
                continue
            try:
                readings.append(Reading(
                    type=sig["type"],
                    value=float(value),
                    unit=sig.get("unit", ""),
                    source=self.name,
                ))
            except (TypeError, ValueError):
                continue
        return readings


ConnectorClass = Nmea2000Connector
