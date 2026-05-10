from __future__ import annotations

import logging
from typing import Iterable

import requests

from .models import Reading

log = logging.getLogger(__name__)


class MyncelClient:
    def __init__(self, base_url: str, device_token: str, timeout_seconds: float = 10.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.device_token = device_token.strip()
        self.timeout_seconds = timeout_seconds
        self.endpoint = f"{self.base_url}/api/iot/ingest"

    def send_readings(self, readings: Iterable[Reading | dict]) -> dict:
        items = [r.to_ingest_dict() if isinstance(r, Reading) else r for r in readings]
        if not items:
            return {"success": True, "accepted": 0}

        response = requests.post(
            self.endpoint,
            headers={
                "Authorization": f"Bearer {self.device_token}",
                "Content-Type": "application/json",
                "User-Agent": "myncel-edge-gateway/0.1.0",
            },
            json={"readings": items},
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
        log.debug("Myncel accepted readings: %s", payload)
        return payload
