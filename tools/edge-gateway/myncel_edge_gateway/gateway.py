from __future__ import annotations

import importlib
import logging
import queue
import signal
import sys
import threading
import time
from typing import Any

from .buffer import OfflineBuffer
from .config import load_config
from .connectors import CONNECTOR_MODULES
from .connectors.base import Connector
from .http_client import MyncelClient
from .models import Reading

log = logging.getLogger("myncel_edge_gateway")


class EdgeGateway:
    def __init__(self, config: dict[str, Any]) -> None:
        self.config = config
        gateway_cfg = config.get("gateway", {})
        mycel_cfg = config.get("myncel", {})

        self.poll_interval = float(gateway_cfg.get("poll_interval_seconds", 15))
        self.flush_interval = float(gateway_cfg.get("flush_interval_seconds", 10))
        self.batch_size = int(gateway_cfg.get("batch_size", 100))
        self.stop_event = threading.Event()
        self.subscription_queue: queue.Queue[Reading] = queue.Queue()

        self.buffer = OfflineBuffer(str(gateway_cfg.get("buffer_path", "myncel_edge_gateway_buffer.sqlite3")))
        self.client = MyncelClient(
            base_url=str(mycel_cfg["base_url"]),
            device_token=str(mycel_cfg["device_token"]),
            timeout_seconds=float(mycel_cfg.get("timeout_seconds", 10)),
        )
        self.connectors = self._load_connectors(config.get("connectors", []))

    def _load_connectors(self, connector_configs: list[dict[str, Any]]) -> list[Connector]:
        connectors: list[Connector] = []
        for raw in connector_configs:
            if not raw.get("enabled", True):
                continue
            connector_type = str(raw.get("type", "")).strip().lower()
            name = str(raw.get("name") or connector_type)
            module_name = CONNECTOR_MODULES.get(connector_type)
            if not module_name:
                raise ValueError(f"Unknown connector type '{connector_type}' for connector '{name}'")

            module = importlib.import_module(module_name)
            connector_class = getattr(module, "ConnectorClass")
            connector = connector_class(name=name, config=raw)
            connectors.append(connector)
            log.info("Loaded connector %s (%s, mode=%s)", name, connector_type, connector.mode)
        return connectors

    def _try_send(self, readings: list[Reading]) -> bool:
        if not readings:
            return True
        try:
            result = self.client.send_readings(readings)
            log.info("Forwarded %s readings to Myncel: %s", len(readings), result)
            return True
        except Exception:
            log.exception("Failed to forward readings; buffering %s readings", len(readings))
            self.buffer.add_many(readings)
            return False

    def _flush_buffer_once(self) -> None:
        pending = self.buffer.peek(self.batch_size)
        if not pending:
            return
        ids = [row[0] for row in pending]
        payloads = [row[1] for row in pending]
        try:
            result = self.client.send_readings(payloads)
            self.buffer.delete_ids(ids)
            log.info("Flushed %s buffered readings to Myncel: %s", len(ids), result)
        except Exception:
            log.warning("Buffered flush failed; %s readings still queued", self.buffer.count())

    def _subscription_emit(self, reading: Reading) -> None:
        self.subscription_queue.put(reading)

    def _start_subscription_connectors(self) -> list[threading.Thread]:
        threads: list[threading.Thread] = []
        for connector in self.connectors:
            if connector.mode != "subscribe":
                continue
            thread = threading.Thread(
                target=self._run_subscription_connector,
                args=(connector,),
                name=f"connector-{connector.name}",
                daemon=True,
            )
            thread.start()
            threads.append(thread)
        return threads

    def _run_subscription_connector(self, connector: Connector) -> None:
        while not self.stop_event.is_set():
            try:
                connector.subscribe(self._subscription_emit)
            except Exception:
                log.exception("Subscription connector %s crashed; restarting in 10 seconds", connector.name)
                time.sleep(10)

    def _drain_subscription_queue(self) -> list[Reading]:
        readings: list[Reading] = []
        while len(readings) < self.batch_size:
            try:
                readings.append(self.subscription_queue.get_nowait())
            except queue.Empty:
                break
        return readings

    def _poll_once(self) -> None:
        for connector in self.connectors:
            if connector.mode != "poll":
                continue
            try:
                readings = connector.poll()
                if readings:
                    self._try_send(readings)
                    log.info("%s produced %s readings", connector.name, len(readings))
            except Exception:
                log.exception("Polling connector %s failed", connector.name)

    def run(self) -> None:
        log.info("Myncel Edge Gateway starting with %s connectors", len(self.connectors))
        for connector in self.connectors:
            connector.start()

        self._start_subscription_connectors()
        last_poll = 0.0
        last_flush = 0.0

        try:
            while not self.stop_event.is_set():
                now = time.time()

                queued = self._drain_subscription_queue()
                if queued:
                    self._try_send(queued)

                if now - last_poll >= self.poll_interval:
                    self._poll_once()
                    last_poll = now

                if now - last_flush >= self.flush_interval:
                    self._flush_buffer_once()
                    last_flush = now

                time.sleep(0.25)
        finally:
            for connector in self.connectors:
                try:
                    connector.stop()
                except Exception:
                    log.exception("Connector %s stop hook failed", connector.name)
            log.info("Myncel Edge Gateway stopped")


def setup_logging(level: str = "INFO") -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )


def main(argv: list[str] | None = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Myncel Edge Gateway")
    parser.add_argument("--config", required=True, help="Path to gateway YAML/JSON config")
    parser.add_argument("--log-level", default="INFO", help="DEBUG, INFO, WARNING, ERROR")
    args = parser.parse_args(argv)

    setup_logging(args.log_level)
    config = load_config(args.config)
    gateway = EdgeGateway(config)

    def _handle_signal(signum, frame):
        log.info("Received signal %s; shutting down", signum)
        gateway.stop_event.set()

    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    gateway.run()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
