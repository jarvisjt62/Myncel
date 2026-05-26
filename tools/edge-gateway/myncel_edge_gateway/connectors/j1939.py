from __future__ import annotations

import logging
import time
from typing import Any

from .base import Connector, ConnectorConfigError
from ..models import Reading

log = logging.getLogger(__name__)


# Common J1939 PGN/SPN combinations for heavy-duty fleet maintenance.
# See SAE J1939-71 for the full Standard Parameter Numbers reference.
DEFAULT_SIGNALS: dict[str, dict[str, Any]] = {
    "engine_rpm":        {"pgn": 0xF004, "spn": 190,  "type": "engine_rpm",        "unit": "rpm",   "scale": 0.125,    "offset": 0,    "byte": 3, "len": 2},
    "engine_load":       {"pgn": 0xF003, "spn": 92,   "type": "engine_load",       "unit": "%",     "scale": 1.0,      "offset": 0,    "byte": 2, "len": 1},
    "coolant_temp":      {"pgn": 0xFEEE, "spn": 110,  "type": "coolant_temp",      "unit": "C",     "scale": 1.0,      "offset": -40,  "byte": 0, "len": 1},
    "oil_pressure":      {"pgn": 0xFEEF, "spn": 100,  "type": "oil_pressure",      "unit": "kPa",   "scale": 4.0,      "offset": 0,    "byte": 3, "len": 1},
    "fuel_rate":         {"pgn": 0xFEF2, "spn": 183,  "type": "fuel_rate",         "unit": "L/h",   "scale": 0.05,     "offset": 0,    "byte": 0, "len": 2},
    "fuel_level":        {"pgn": 0xFEFC, "spn": 96,   "type": "fuel_level",        "unit": "%",     "scale": 0.4,      "offset": 0,    "byte": 1, "len": 1},
    "def_level":         {"pgn": 0xFE56, "spn": 1761, "type": "def_level",         "unit": "%",     "scale": 0.4,      "offset": 0,    "byte": 0, "len": 1},
    "vehicle_speed":     {"pgn": 0xFEF1, "spn": 84,   "type": "vehicle_speed",     "unit": "km/h",  "scale": 0.00390625, "offset": 0,  "byte": 1, "len": 2},
    "transmission_temp": {"pgn": 0xFEF8, "spn": 177,  "type": "transmission_temp", "unit": "C",     "scale": 0.03125,  "offset": -273, "byte": 4, "len": 2},
    "total_engine_hours":{"pgn": 0xFEE5, "spn": 247,  "type": "engine_hours",      "unit": "h",     "scale": 0.05,     "offset": 0,    "byte": 0, "len": 4},
    "total_distance":    {"pgn": 0xFEE0, "spn": 245,  "type": "odometer",          "unit": "km",    "scale": 0.125,    "offset": 0,    "byte": 0, "len": 4},
    "ambient_air_temp":  {"pgn": 0xFEF5, "spn": 171,  "type": "ambient_air_temp",  "unit": "C",     "scale": 0.03125,  "offset": -273, "byte": 3, "len": 2},
    "battery_voltage":   {"pgn": 0xFEF7, "spn": 168,  "type": "battery_voltage",   "unit": "V",     "scale": 0.05,     "offset": 0,    "byte": 6, "len": 2},
    "exhaust_temp":      {"pgn": 0xFEEE, "spn": 173,  "type": "exhaust_temp",      "unit": "C",     "scale": 0.03125,  "offset": -273, "byte": 0, "len": 2},
}


class J1939Connector(Connector):
    """SAE J1939 connector for heavy-duty diesel equipment over CAN bus.

    Targets Class 7-8 trucks (Freightliner, Kenworth, Peterbilt, Volvo, Mack),
    buses, and off-highway equipment from Caterpillar, John Deere, Komatsu,
    Cummins, Detroit Diesel, etc. Reads engine, fuel, DEF, transmission, and
    odometer parameters via standard PGN/SPN definitions.

    Hardware: any SocketCAN-compatible CAN-bus interface — PCAN-USB, Kvaser,
    Peak System, Innomaker USB-CAN, or a Raspberry Pi with MCP2515 hat.
    Connect to the green 9-pin Deutsch diagnostic connector under the dash.

    Example config:
      type: j1939
      name: kenworth_t680_18
      can_interface: can0
      bitrate: 250000
      poll_interval_ms: 1000
      signals: [engine_rpm, vehicle_speed, fuel_level, def_level,
                coolant_temp, oil_pressure, total_engine_hours, total_distance]
    """

    mode = "poll"

    def __init__(self, name: str, config: dict[str, Any]) -> None:
        super().__init__(name, config)
        self.can_interface = str(config.get("can_interface", "can0"))
        self.bitrate = int(config.get("bitrate", 250000))
        self.poll_interval_ms = int(config.get("poll_interval_ms", 1000))
        self.read_dtcs = bool(config.get("read_dtcs", True))
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
            raise ConnectorConfigError(f"{name}: at least one J1939 signal must be configured")
        self._bus = None
        self._latest: dict[int, list[int]] = {}

    def start(self) -> None:
        try:
            import can  # type: ignore  # python-can
        except ImportError as exc:
            raise RuntimeError(
                "Install python-can to use J1939Connector: pip install python-can"
            ) from exc
        self._bus = can.interface.Bus(channel=self.can_interface, bustype="socketcan")
        log.info("%s opened CAN bus %s @ %d bps", self.name, self.can_interface, self.bitrate)

    def stop(self) -> None:
        if self._bus is not None:
            try:
                self._bus.shutdown()
            except Exception:
                pass
            self._bus = None

    def _decode_signal(self, sig: dict[str, Any], data: list[int]) -> float | None:
        byte = int(sig.get("byte", 0))
        length = int(sig.get("len", 1))
        if byte + length > len(data):
            return None
        raw = 0
        # J1939 is little-endian within a frame
        for i in range(length):
            raw |= data[byte + i] << (8 * i)
        scale = float(sig.get("scale", 1.0))
        offset = float(sig.get("offset", 0))
        return raw * scale + offset

    def poll(self) -> list[Reading]:
        if self._bus is None:
            try:
                self.start()
            except Exception as exc:
                log.warning("%s J1939 start failed: %s", self.name, exc)
                return []
        # Drain ~poll_interval_ms worth of frames into _latest, keyed by PGN.
        deadline = time.time() + max(self.poll_interval_ms, 200) / 1000.0
        while time.time() < deadline:
            msg = self._bus.recv(timeout=0.05)
            if msg is None:
                continue
            # 29-bit ID: priority(3) | reserved(1) | data-page(1) | PF(8) | PS(8) | SA(8)
            arb_id = msg.arbitration_id
            pf = (arb_id >> 16) & 0xFF
            ps = (arb_id >> 8) & 0xFF
            pgn = (pf << 8) | ps if pf >= 240 else (pf << 8)
            self._latest[pgn] = list(msg.data)
        readings: list[Reading] = []
        for sig in self.signals:
            data = self._latest.get(int(sig["pgn"]))
            if data is None:
                continue
            value = self._decode_signal(sig, data)
            if value is None:
                continue
            readings.append(Reading(
                type=sig["type"],
                value=value,
                unit=sig.get("unit", ""),
                source=self.name,
            ))
        # Active DTCs are broadcast on PGN 0xFECA (DM1).
        if self.read_dtcs and 0xFECA in self._latest:
            data = self._latest[0xFECA]
            mil_lamp = (data[0] >> 6) & 0x03 if data else 0
            if mil_lamp > 0:
                readings.append(Reading(type="dtc_present", value=1.0, unit="", source=self.name))
        return readings


ConnectorClass = J1939Connector
