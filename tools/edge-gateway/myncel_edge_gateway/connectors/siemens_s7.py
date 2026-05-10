from __future__ import annotations

from typing import Any

from .base import Connector, ConnectorConfigError
from ..models import Reading


class SiemensS7Connector(Connector):
    """Siemens S7 connector using python-snap7.

    If your Siemens PLC exposes OPC UA, prefer the OPC UA connector. Use this
    direct S7 connector only where Snap7 access is approved on the plant network.
    """

    mode = "poll"

    def __init__(self, name: str, config: dict[str, Any]) -> None:
        super().__init__(name, config)
        self.host = str(config.get("host", ""))
        self.rack = int(config.get("rack", 0))
        self.slot = int(config.get("slot", 1))
        self.points = list(config.get("points", []))
        if not self.host:
            raise ConnectorConfigError(f"{name}: siemens_s7.host is required")
        if not self.points:
            raise ConnectorConfigError(f"{name}: siemens_s7.points is required")

    @staticmethod
    def _decode(data: bytes, spec: dict[str, Any]) -> float:
        try:
            from snap7 import util
        except ImportError as exc:
            raise RuntimeError("Install python-snap7 to use SiemensS7Connector: pip install python-snap7") from exc

        data_type = str(spec.get("data_type", "real")).lower()
        byte_index = int(spec.get("byte_index", 0))
        bit_index = int(spec.get("bit_index", 0))

        if data_type == "real":
            return float(util.get_real(data, byte_index))
        if data_type in {"int", "int16"}:
            return float(util.get_int(data, byte_index))
        if data_type in {"dint", "int32"}:
            return float(util.get_dint(data, byte_index))
        if data_type in {"bool", "bit"}:
            return 1.0 if util.get_bool(data, byte_index, bit_index) else 0.0
        raise ConnectorConfigError(f"Unsupported Siemens data_type {data_type}")

    def poll(self) -> list[Reading]:
        try:
            import snap7
        except ImportError as exc:
            raise RuntimeError("Install python-snap7 to use SiemensS7Connector: pip install python-snap7") from exc

        client = snap7.client.Client()
        client.connect(self.host, self.rack, self.slot, int(self.config.get("tcp_port", 102)))
        readings: list[Reading] = []

        try:
            for spec in self.points:
                db_number = int(spec["db_number"])
                start = int(spec.get("start", 0))
                size = int(spec.get("size", 4))
                data = client.db_read(db_number, start, size)
                value = self._decode(data, spec)
                readings.append(
                    Reading(
                        type=str(spec["type"]),
                        value=value * float(spec.get("scale", 1)) + float(spec.get("offset", 0)),
                        unit=str(spec.get("unit", "")),
                        source=self.name,
                        metadata={"db_number": db_number, "start": start, "connector": "siemens_s7"},
                    )
                )
        finally:
            client.disconnect()

        return readings


ConnectorClass = SiemensS7Connector
