from __future__ import annotations

from typing import Any

from .base import Connector, ConnectorConfigError
from ..models import Reading


class BeckhoffADSConnector(Connector):
    """Beckhoff/TwinCAT ADS connector using pyads."""

    mode = "poll"

    def __init__(self, name: str, config: dict[str, Any]) -> None:
        super().__init__(name, config)
        self.ams_net_id = str(config.get("ams_net_id", ""))
        self.ams_port = int(config.get("ams_port", 851))
        self.ip_address = config.get("ip_address")
        self.symbols = list(config.get("symbols", []))
        if not self.ams_net_id:
            raise ConnectorConfigError(f"{name}: beckhoff_ads.ams_net_id is required")
        if not self.symbols:
            raise ConnectorConfigError(f"{name}: beckhoff_ads.symbols is required")

    def poll(self) -> list[Reading]:
        try:
            import pyads
        except ImportError as exc:
            raise RuntimeError("Install pyads to use BeckhoffADSConnector: pip install pyads") from exc

        plc = pyads.Connection(self.ams_net_id, self.ams_port, self.ip_address)
        plc.open()
        readings: list[Reading] = []
        type_map = {
            "bool": pyads.PLCTYPE_BOOL,
            "int": pyads.PLCTYPE_INT,
            "dint": pyads.PLCTYPE_DINT,
            "real": pyads.PLCTYPE_REAL,
            "lreal": pyads.PLCTYPE_LREAL,
        }

        try:
            for spec in self.symbols:
                symbol = str(spec["symbol"])
                data_type = str(spec.get("data_type", "real")).lower()
                plc_type = type_map.get(data_type, pyads.PLCTYPE_REAL)
                value = plc.read_by_name(symbol, plc_type)
                readings.append(
                    Reading(
                        type=str(spec.get("type", symbol)),
                        value=float(value) * float(spec.get("scale", 1)) + float(spec.get("offset", 0)),
                        unit=str(spec.get("unit", "")),
                        source=self.name,
                        metadata={"symbol": symbol, "connector": "beckhoff_ads"},
                    )
                )
        finally:
            plc.close()

        return readings


ConnectorClass = BeckhoffADSConnector
