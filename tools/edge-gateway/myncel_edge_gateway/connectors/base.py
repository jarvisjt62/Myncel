from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Callable

from ..models import Reading


class Connector(ABC):
    """Base class for all Myncel edge gateway connectors."""

    mode = "poll"

    def __init__(self, name: str, config: dict) -> None:
        self.name = name
        self.config = config
        self.enabled = bool(config.get("enabled", True))

    def start(self) -> None:
        """Optional hook called once before polling/subscribing starts."""

    def stop(self) -> None:
        """Optional hook called on shutdown."""

    def poll(self) -> list[Reading]:
        return []

    def subscribe(self, emit: Callable[[Reading], None]) -> None:
        raise NotImplementedError(f"{self.__class__.__name__} does not support subscribe mode")


class ConnectorConfigError(ValueError):
    pass
