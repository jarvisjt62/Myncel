from __future__ import annotations

import asyncio
from typing import Any

from .base import Connector, ConnectorConfigError
from ..models import Reading


class OpcUaConnector(Connector):
    """Poll OPC UA nodes and convert them to Myncel readings."""

    mode = "poll"

    def __init__(self, name: str, config: dict[str, Any]) -> None:
        super().__init__(name, config)
        self.endpoint = str(config.get("endpoint", ""))
        self.nodes = list(config.get("nodes", []))
        if not self.endpoint:
            raise ConnectorConfigError(f"{name}: opcua.endpoint is required")
        if not self.nodes:
            raise ConnectorConfigError(f"{name}: opcua.nodes is required")

    async def _poll_async(self) -> list[Reading]:
        try:
            from asyncua import Client
        except ImportError as exc:
            raise RuntimeError("Install asyncua to use OpcUaConnector: pip install asyncua") from exc

        readings: list[Reading] = []
        async with Client(url=self.endpoint) as client:
            for spec in self.nodes:
                node_id = str(spec["node_id"])
                node = client.get_node(node_id)
                value = await node.read_value()
                numeric = float(value)
                scale = float(spec.get("scale", 1))
                offset = float(spec.get("offset", 0))
                readings.append(
                    Reading(
                        type=str(spec["type"]),
                        value=numeric * scale + offset,
                        unit=str(spec.get("unit", "")),
                        source=self.name,
                        metadata={"node_id": node_id, "connector": "opcua"},
                    )
                )
        return readings

    def poll(self) -> list[Reading]:
        return asyncio.run(self._poll_async())


ConnectorClass = OpcUaConnector
