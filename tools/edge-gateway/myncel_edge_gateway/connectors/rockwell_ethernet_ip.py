from __future__ import annotations

from typing import Any

from .base import Connector, ConnectorConfigError
from ..models import Reading


class RockwellEtherNetIPConnector(Connector):
    """Allen-Bradley/Rockwell EtherNet/IP connector using pycomm3."""

    mode = "poll"

    def __init__(self, name: str, config: dict[str, Any]) -> None:
        super().__init__(name, config)
        self.path = str(config.get("path") or config.get("host") or "")
        self.tags = list(config.get("tags", []))
        if not self.path:
            raise ConnectorConfigError(f"{name}: rockwell.path or host is required")
        if not self.tags:
            raise ConnectorConfigError(f"{name}: rockwell.tags is required")

    def poll(self) -> list[Reading]:
        try:
            from pycomm3 import LogixDriver
        except ImportError as exc:
            raise RuntimeError("Install pycomm3 to use RockwellEtherNetIPConnector: pip install pycomm3") from exc

        readings: list[Reading] = []
        with LogixDriver(self.path) as plc:
            for spec in self.tags:
                tag = str(spec["tag"])
                result = plc.read(tag)
                if result.error:
                    raise RuntimeError(f"Rockwell read failed for {tag}: {result.error}")
                readings.append(
                    Reading(
                        type=str(spec.get("type", tag)),
                        value=float(result.value) * float(spec.get("scale", 1)) + float(spec.get("offset", 0)),
                        unit=str(spec.get("unit", "")),
                        source=self.name,
                        metadata={"tag": tag, "connector": "rockwell_ethernet_ip"},
                    )
                )
        return readings


ConnectorClass = RockwellEtherNetIPConnector
