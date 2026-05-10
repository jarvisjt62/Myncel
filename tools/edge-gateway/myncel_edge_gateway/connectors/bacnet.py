from __future__ import annotations

import asyncio
from typing import Any

from .base import Connector, ConnectorConfigError
from ..models import Reading


class BacnetConnector(Connector):
    """BACnet/IP polling template for HVAC, chillers, AHUs, boilers, and BMS points.

    This uses bacpypes3 when installed. BACnet deployments vary heavily, so keep
    point maps explicit in config.
    """

    mode = "poll"

    def __init__(self, name: str, config: dict[str, Any]) -> None:
        super().__init__(name, config)
        self.device_address = str(config.get("device_address", ""))
        self.points = list(config.get("points", []))
        if not self.device_address:
            raise ConnectorConfigError(f"{name}: bacnet.device_address is required")
        if not self.points:
            raise ConnectorConfigError(f"{name}: bacnet.points is required")

    async def _poll_async(self) -> list[Reading]:
        try:
            from bacpypes3.app import Application
            from bacpypes3.pdu import Address
            from bacpypes3.primitivedata import ObjectIdentifier
        except ImportError as exc:
            raise RuntimeError("Install bacpypes3 to use BacnetConnector: pip install bacpypes3") from exc

        app = Application.from_args([])
        readings: list[Reading] = []
        try:
            for spec in self.points:
                object_type = str(spec.get("object_type", "analogInput"))
                instance = int(spec["instance"])
                prop = str(spec.get("property", "presentValue"))
                obj_id = ObjectIdentifier((object_type, instance))
                value = await app.read_property(Address(self.device_address), obj_id, prop)
                readings.append(
                    Reading(
                        type=str(spec["type"]),
                        value=float(value) * float(spec.get("scale", 1)) + float(spec.get("offset", 0)),
                        unit=str(spec.get("unit", "")),
                        source=self.name,
                        metadata={"object_type": object_type, "instance": instance, "connector": "bacnet"},
                    )
                )
        finally:
            app.close()

        return readings

    def poll(self) -> list[Reading]:
        return asyncio.run(self._poll_async())


ConnectorClass = BacnetConnector
