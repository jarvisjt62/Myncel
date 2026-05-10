from __future__ import annotations

import json
import logging
import re
import time
from typing import Any, Callable

from .base import Connector, ConnectorConfigError
from ..models import Reading

log = logging.getLogger(__name__)


class MqttConnector(Connector):
    """Subscribe to MQTT topics and forward messages as Myncel readings."""

    mode = "subscribe"

    def __init__(self, name: str, config: dict[str, Any]) -> None:
        super().__init__(name, config)
        self.host = str(config.get("host", ""))
        self.port = int(config.get("port", 1883))
        self.topics = config.get("topics", [])
        if isinstance(self.topics, str):
            self.topics = [self.topics]
        if not self.host:
            raise ConnectorConfigError(f"{name}: mqtt.host is required")
        if not self.topics:
            raise ConnectorConfigError(f"{name}: mqtt.topics is required")

    @staticmethod
    def _topic_to_type(topic: str, pattern: str | None = None) -> str:
        if pattern:
            match = re.match(pattern, topic)
            if match and "type" in match.groupdict():
                return match.group("type")
        parts = topic.strip("/").split("/")
        return parts[-1] if parts else "mqtt_value"

    def _message_to_reading(self, topic: str, payload: bytes) -> Reading | None:
        text = payload.decode("utf-8", errors="replace").strip()
        unit_map = self.config.get("unit_map", {})
        topic_regex = self.config.get("topic_regex")

        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                reading_type = parsed.get("type") or parsed.get("sensorType") or self._topic_to_type(topic, topic_regex)
                value = parsed.get("value", parsed.get("payload"))
                unit = parsed.get("unit") or unit_map.get(str(reading_type), "")
                recorded_at = parsed.get("recordedAt") or parsed.get("timestamp")
                return Reading(type=str(reading_type), value=float(value), unit=str(unit), recordedAt=recorded_at, source=self.name)
        except json.JSONDecodeError:
            pass

        reading_type = self._topic_to_type(topic, topic_regex)
        return Reading(type=reading_type, value=float(text), unit=str(unit_map.get(reading_type, "")), source=self.name)

    def subscribe(self, emit: Callable[[Reading], None]) -> None:
        try:
            import paho.mqtt.client as mqtt
        except ImportError as exc:
            raise RuntimeError("Install paho-mqtt to use MqttConnector: pip install paho-mqtt") from exc

        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        username = self.config.get("username")
        password = self.config.get("password")
        if username:
            client.username_pw_set(str(username), str(password or ""))

        if self.config.get("tls", False):
            client.tls_set()

        def on_connect(client, userdata, flags, reason_code, properties=None):
            log.info("%s connected to MQTT broker with code %s", self.name, reason_code)
            for topic in self.topics:
                client.subscribe(topic)
                log.info("%s subscribed to %s", self.name, topic)

        def on_message(client, userdata, msg):
            try:
                reading = self._message_to_reading(msg.topic, msg.payload)
                if reading:
                    emit(reading)
            except Exception:
                log.exception("%s failed to parse MQTT message on %s", self.name, msg.topic)

        client.on_connect = on_connect
        client.on_message = on_message
        client.connect(self.host, self.port, keepalive=int(self.config.get("keepalive", 60)))
        client.loop_start()
        try:
            while True:
                time.sleep(1)
        finally:
            client.loop_stop()
            client.disconnect()


ConnectorClass = MqttConnector
