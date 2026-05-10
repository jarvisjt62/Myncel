from __future__ import annotations

import xml.etree.ElementTree as ET
from typing import Any

import requests

from .base import Connector, ConnectorConfigError
from ..models import Reading


class MTConnectConnector(Connector):
    """Poll MTConnect current/sample XML endpoints for CNC telemetry."""

    mode = "poll"

    def __init__(self, name: str, config: dict[str, Any]) -> None:
        super().__init__(name, config)
        self.url = str(config.get("url", "")).rstrip("/")
        self.items = list(config.get("items", []))
        if not self.url:
            raise ConnectorConfigError(f"{name}: mtconnect.url is required")
        if not self.items:
            raise ConnectorConfigError(f"{name}: mtconnect.items is required")

    @staticmethod
    def _strip_namespace(tag: str) -> str:
        return tag.split("}", 1)[-1] if "}" in tag else tag

    def poll(self) -> list[Reading]:
        endpoint = self.url
        if not endpoint.endswith(("/current", "/sample")):
            endpoint = f"{endpoint}/current"

        response = requests.get(endpoint, timeout=float(self.config.get("timeout_seconds", 5)))
        response.raise_for_status()
        root = ET.fromstring(response.text)

        values: dict[str, str] = {}
        for elem in root.iter():
            data_item_id = elem.attrib.get("dataItemId") or elem.attrib.get("name")
            if data_item_id and elem.text:
                values[data_item_id] = elem.text.strip()
                values[self._strip_namespace(elem.tag)] = elem.text.strip()

        readings: list[Reading] = []
        for spec in self.items:
            key = str(spec.get("data_item_id") or spec.get("name"))
            if key not in values:
                continue
            raw = values[key]
            if raw.upper() in {"AVAILABLE", "ACTIVE", "READY", "ON"}:
                value = 1.0
            elif raw.upper() in {"UNAVAILABLE", "STOPPED", "OFF"}:
                value = 0.0
            else:
                value = float(raw)
            readings.append(
                Reading(
                    type=str(spec["type"]),
                    value=value * float(spec.get("scale", 1)) + float(spec.get("offset", 0)),
                    unit=str(spec.get("unit", "")),
                    source=self.name,
                    metadata={"data_item_id": key, "connector": "mtconnect"},
                )
            )

        return readings


ConnectorClass = MTConnectConnector
