from __future__ import annotations

import logging
import time
from typing import Any

from .base import Connector, ConnectorConfigError
from ..models import Reading

log = logging.getLogger(__name__)


class MavlinkConnector(Connector):
    """MAVLink connector for drones / UAVs running PX4 or ArduPilot
    (Pixhawk, Cube, Holybro, Matek, Mateksys flight controllers).

    Reads battery voltage / current / remaining percent, GPS position and
    fix type, ground speed, altitude, system status, flight mode, and any
    pre-arm or critical error conditions reported by the autopilot.

    Hardware: any standard MAVLink telemetry path —
      * 915/433 MHz radio modem (RFD900, SiK telemetry)
      * USB direct to flight controller
      * Wi-Fi (ESP8266 telemetry bridge)
      * Network UDP forwarder

    Example config:
      type: mavlink
      name: ardupilot_quad_07
      connection: udpin:0.0.0.0:14550   # or serial:/dev/ttyUSB0:57600
      poll_interval_ms: 5000
      signals: [battery_voltage, battery_remaining, ground_speed,
                altitude_msl, gps_fix_type, satellites_visible]
    """

    mode = "poll"

    DEFAULT_SIGNALS = {
        "battery_voltage":   {"msg": "BATTERY_STATUS", "field": "voltages_0", "type": "battery_voltage", "unit": "V", "scale": 0.001},
        "battery_current":   {"msg": "BATTERY_STATUS", "field": "current_battery", "type": "battery_current", "unit": "A", "scale": 0.01},
        "battery_remaining": {"msg": "BATTERY_STATUS", "field": "battery_remaining", "type": "battery_remaining", "unit": "%", "scale": 1.0},
        "ground_speed":      {"msg": "VFR_HUD",        "field": "groundspeed",      "type": "ground_speed",      "unit": "m/s","scale": 1.0},
        "airspeed":          {"msg": "VFR_HUD",        "field": "airspeed",         "type": "airspeed",          "unit": "m/s","scale": 1.0},
        "altitude_msl":      {"msg": "VFR_HUD",        "field": "alt",              "type": "altitude_msl",      "unit": "m",  "scale": 1.0},
        "climb_rate":        {"msg": "VFR_HUD",        "field": "climb",            "type": "climb_rate",        "unit": "m/s","scale": 1.0},
        "throttle":          {"msg": "VFR_HUD",        "field": "throttle",         "type": "throttle",          "unit": "%",  "scale": 1.0},
        "gps_fix_type":      {"msg": "GPS_RAW_INT",    "field": "fix_type",         "type": "gps_fix_type",      "unit": "",   "scale": 1.0},
        "satellites_visible":{"msg": "GPS_RAW_INT",    "field": "satellites_visible","type": "satellites",       "unit": "",   "scale": 1.0},
        "gps_lat":           {"msg": "GLOBAL_POSITION_INT","field": "lat",          "type": "gps_latitude",      "unit": "deg","scale": 1e-7},
        "gps_lon":           {"msg": "GLOBAL_POSITION_INT","field": "lon",          "type": "gps_longitude",     "unit": "deg","scale": 1e-7},
        "rel_altitude":      {"msg": "GLOBAL_POSITION_INT","field": "relative_alt", "type": "rel_altitude",      "unit": "m",  "scale": 0.001},
        "system_voltage":    {"msg": "SYS_STATUS",     "field": "voltage_battery",  "type": "system_voltage",    "unit": "V",  "scale": 0.001},
        "system_load":       {"msg": "SYS_STATUS",     "field": "load",             "type": "system_load",       "unit": "%",  "scale": 0.1},
    }

    def __init__(self, name: str, config: dict[str, Any]) -> None:
        super().__init__(name, config)
        self.connection_string = str(config.get("connection", "udpin:0.0.0.0:14550"))
        self.poll_interval_ms = int(config.get("poll_interval_ms", 5000))
        signals = config.get("signals", list(self.DEFAULT_SIGNALS.keys()))
        self.signals: list[dict[str, Any]] = []
        for s in signals:
            if isinstance(s, str):
                preset = self.DEFAULT_SIGNALS.get(s)
                if preset:
                    self.signals.append({"name": s, **preset})
            elif isinstance(s, dict):
                self.signals.append(s)
        if not self.signals:
            raise ConnectorConfigError(f"{name}: at least one MAVLink signal must be configured")
        self._mav = None
        self._latest: dict[str, dict[str, Any]] = {}

    def start(self) -> None:
        try:
            from pymavlink import mavutil  # type: ignore
        except ImportError as exc:
            raise RuntimeError(
                "Install pymavlink to use MavlinkConnector: pip install pymavlink"
            ) from exc
        self._mav = mavutil.mavlink_connection(self.connection_string)
        # Wait briefly for the autopilot heartbeat so we know the link is up.
        try:
            self._mav.wait_heartbeat(timeout=5)
            log.info("%s heartbeat received from system %s", self.name, getattr(self._mav, "target_system", "?"))
        except Exception as exc:
            log.warning("%s no MAVLink heartbeat: %s", self.name, exc)

    def stop(self) -> None:
        if self._mav is not None:
            try:
                self._mav.close()
            except Exception:
                pass
            self._mav = None

    def poll(self) -> list[Reading]:
        if self._mav is None:
            try:
                self.start()
            except Exception as exc:
                log.warning("%s MAVLink start failed: %s", self.name, exc)
                return []
        deadline = time.time() + max(self.poll_interval_ms, 200) / 1000.0
        wanted = {sig["msg"] for sig in self.signals}
        while time.time() < deadline:
            msg = self._mav.recv_match(blocking=False)
            if msg is None:
                time.sleep(0.05)
                continue
            mtype = msg.get_type()
            if mtype in wanted:
                self._latest[mtype] = msg.to_dict()
            elif mtype == "STATUSTEXT":
                # Surface high-severity flight controller messages as a single boolean reading.
                sev = msg.to_dict().get("severity", 7)
                if sev <= 3:  # EMERGENCY..ERROR
                    self._latest["__alert__"] = {"severity": sev}
        readings: list[Reading] = []
        for sig in self.signals:
            payload = self._latest.get(sig["msg"])
            if not payload:
                continue
            field = sig["field"]
            # BATTERY_STATUS.voltages is an array — support voltages_0..voltages_N flattening.
            if field.startswith("voltages_") and "voltages" in payload:
                idx = int(field.split("_", 1)[1])
                voltages = payload["voltages"]
                if isinstance(voltages, (list, tuple)) and idx < len(voltages):
                    raw = voltages[idx]
                else:
                    continue
            else:
                raw = payload.get(field)
            if raw is None:
                continue
            try:
                value = float(raw) * float(sig.get("scale", 1.0))
                readings.append(Reading(
                    type=sig["type"],
                    value=value,
                    unit=sig.get("unit", ""),
                    source=self.name,
                ))
            except (TypeError, ValueError):
                continue
        if "__alert__" in self._latest:
            readings.append(Reading(type="autopilot_alert", value=1.0, unit="", source=self.name))
            self._latest.pop("__alert__", None)
        return readings


ConnectorClass = MavlinkConnector
