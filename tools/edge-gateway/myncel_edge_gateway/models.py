from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Any


@dataclass
class Reading:
    """A normalized Myncel telemetry reading."""

    type: str
    value: float
    unit: str
    recordedAt: str | None = None
    source: str | None = None
    metadata: dict[str, Any] | None = None

    def __post_init__(self) -> None:
        if self.recordedAt is None:
            self.recordedAt = datetime.now(timezone.utc).isoformat()
        self.type = str(self.type).strip().lower().replace(" ", "_")
        self.unit = str(self.unit).strip()
        self.value = float(self.value)

    def to_ingest_dict(self) -> dict[str, Any]:
        """Return only fields accepted by /api/iot/ingest."""
        return {
            "type": self.type,
            "value": self.value,
            "unit": self.unit,
            "recordedAt": self.recordedAt,
        }

    def to_buffer_dict(self) -> dict[str, Any]:
        return asdict(self)
