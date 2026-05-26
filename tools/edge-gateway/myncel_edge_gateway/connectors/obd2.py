from __future__ import annotations

import logging
import time
from typing import Any

from .base import Connector, ConnectorConfigError
from ..models import Reading

log = logging.getLogger(__name__)


# Standard OBD-II PIDs (mode 01) — see SAE J1979 / ISO 15031-5
DEFAULT_PIDS: dict[str, dict[str, Any]] = {
    "rpm": {"pid": "010C", "type": "engine_rpm", "unit": "rpm", "decode": "rpm"},
    "speed": {"pid": "010D", "type": "vehicle_speed", "unit": "km/h", "decode": "byte"},
    "coolant_temp": {"pid": "0105", "type": "coolant_temp", "unit": "C", "decode": "temp"},
    "intake_temp": {"pid": "010F", "type": "intake_temp", "unit": "C", "decode": "temp"},
    "engine_load": {"pid": "0104", "type": "engine_load", "unit": "%", "decode": "percent"},
    "throttle": {"pid": "0111", "type": "throttle_position", "unit": "%", "decode": "percent"},
    "fuel_level": {"pid": "012F", "type": "fuel_level", "unit": "%", "decode": "percent"},
    "battery_voltage": {"pid": "0142", "type": "battery_voltage", "unit": "V", "decode": "voltage"},
    "runtime": {"pid": "011F", "type": "engine_runtime", "unit": "s", "decode": "uint16"},
    "distance_mil": {"pid": "0121", "type": "distance_with_mil_on", "unit": "km", "decode": "uint16"},
    "odometer": {"pid": "01A6", "type": "odometer", "unit": "km", "decode": "uint32_div_10"},
}


def _decode(decode: str, data_bytes: list[int]) -> float:
    if not data_bytes:
        return 0.0
    a = data_bytes[0] if len(data_bytes) > 0 else 0
    b = data_bytes[1] if len(data_bytes) > 1 else 0
    c = data_bytes[2] if len(data_bytes) > 2 else 0
    d = data_bytes[3] if len(data_bytes) > 3 else 0
    if decode == "rpm":
        return ((a * 256) + b) / 4.0
    if decode == "byte":
        return float(a)
    if decode == "temp":
        return float(a - 40)
    if decode == "percent":
        return (a * 100.0) / 255.0
    if decode == "voltage":
        return ((a * 256) + b) / 1000.0
    if decode == "uint16":
        return float((a * 256) + b)
    if decode == "uint32_div_10":
        return ((a << 24) + (b << 16) + (c << 8) + d) / 10.0
    return float(a)


class Obd2Connector(Connector):
    """OBD-II ELM327 connector for cars / light trucks / motorcycles via the
    universal SAE J1962 port (mandated on every passenger vehicle since 1996).

    Supports USB, RS-232, Bluetooth-Serial, and Wi-Fi ELM327 dongles. Reads
    standard mode-01 PIDs (RPM, speed, coolant temp, fuel level, battery, etc.)
    and mode-03 DTCs ("check engine" fault codes).

    Example config:
      type: obd2
      name: van_42_obd2
      serial_port: /dev/ttyUSB0
      baudrate: 38400
      poll_interval_ms: 5000
      read_dtcs: true
      signals: [rpm, speed, coolant_temp, fuel_level, battery_voltage, odometer]
    """

    mode = "poll"

    def __init__(self, name: str, config: dict[str, Any]) -> None:
        super().__init__(name, config)
        self.serial_port = str(config.get("serial_port", "/dev/ttyUSB0"))
        self.baudrate = int(config.get("baudrate", 38400))
        self.poll_interval_ms = int(config.get("poll_interval_ms", 5000))
        self.protocol = str(config.get("protocol", "auto"))
        self.read_dtcs = bool(config.get("read_dtcs", True))
        signals = config.get("signals", list(DEFAULT_PIDS.keys()))
        self.signals: list[dict[str, Any]] = []
        for s in signals:
            if isinstance(s, str):
                preset = DEFAULT_PIDS.get(s)
                if preset:
                    self.signals.append({"name": s, **preset})
            elif isinstance(s, dict):
                self.signals.append(s)
        if not self.signals:
            raise ConnectorConfigError(f"{name}: at least one OBD-II signal must be configured")
        self._serial = None

    def start(self) -> None:
        try:
            import serial  # type: ignore
        except ImportError as exc:
            raise RuntimeError("Install pyserial to use Obd2Connector: pip install pyserial") from exc
        self._serial = serial.Serial(self.serial_port, self.baudrate, timeout=2.0)
        for cmd in ("ATZ", "ATE0", "ATL0", "ATSP" + ("0" if self.protocol == "auto" else self.protocol), "ATH0"):
            self._serial.write((cmd + "\r").encode("ascii"))
            time.sleep(0.2)
            self._serial.read(self._serial.in_waiting or 1)

    def stop(self) -> None:
        if self._serial is not None:
            try:
                self._serial.close()
            except Exception:
                pass
            self._serial = None

    def _query(self, pid: str) -> list[int] | None:
        ser = self._serial
        if ser is None:
            return None
        ser.reset_input_buffer()
        ser.write((pid + "\r").encode("ascii"))
        time.sleep(0.15)
        raw = ser.read_until(b">").decode("ascii", errors="replace").strip()
        line = raw.replace("\r", " ").replace(">", " ").strip()
        parts = [p for p in line.split() if all(c in "0123456789ABCDEFabcdef" for c in p) and len(p) == 2]
        if len(parts) < 3:
            return None
        return [int(p, 16) for p in parts[2:]]

    def poll(self) -> list[Reading]:
        if self._serial is None:
            try:
                self.start()
            except Exception as exc:
                log.warning("%s OBD-II open failed: %s", self.name, exc)
                return []
        readings: list[Reading] = []
        for sig in self.signals:
            try:
                data = self._query(sig["pid"])
                if data is None:
                    continue
                value = _decode(sig.get("decode", "byte"), data)
                readings.append(Reading(
                    type=sig["type"],
                    value=value,
                    unit=sig.get("unit", ""),
                    source=self.name,
                ))
            except Exception as exc:
                log.warning("%s OBD-II query failed for %s: %s", self.name, sig.get("name"), exc)
        if self.read_dtcs and self._serial is not None:
            try:
                self._serial.reset_input_buffer()
                self._serial.write(b"03\r")
                time.sleep(0.2)
                raw = self._serial.read_until(b">").decode("ascii", errors="replace")
                if "NO DATA" not in raw and "43" in raw:
                    readings.append(Reading(type="dtc_present", value=1.0, unit="", source=self.name))
            except Exception as exc:
                log.debug("%s DTC read failed: %s", self.name, exc)
        return readings


ConnectorClass = Obd2Connector
