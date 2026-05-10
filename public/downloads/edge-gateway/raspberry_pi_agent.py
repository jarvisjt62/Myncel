#!/usr/bin/env python3
"""Raspberry Pi Myncel gateway agent.

This lightweight agent is for simple Pi sensor setups. For industrial
multi-protocol gateways, use ../run_gateway.py with config.example.yaml.

Supported examples:
  - CPU temperature from /sys/class/thermal
  - 1-Wire DS18B20 temperature sensors
  - Optional DHT22/DHT11 via adafruit-circuitpython-dht if installed
"""

from __future__ import annotations

import glob
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

BASE_URL = os.environ["MYNCEL_BASE_URL"].rstrip("/")
DEVICE_TOKEN = os.environ["MYNCEL_DEVICE_TOKEN"]
INTERVAL_SECONDS = int(os.getenv("MYNCEL_PI_INTERVAL_SECONDS", "15"))
DHT_PIN = os.getenv("MYNCEL_DHT_PIN")  # Example: D4


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def reading(reading_type: str, value: float, unit: str) -> dict:
    return {
        "type": reading_type,
        "value": round(float(value), 4),
        "unit": unit,
        "recordedAt": now_iso(),
    }


def cpu_temperature() -> float | None:
    path = Path("/sys/class/thermal/thermal_zone0/temp")
    if not path.exists():
        return None
    try:
        return int(path.read_text().strip()) / 1000.0
    except Exception:
        return None


def ds18b20_temperatures() -> list[dict]:
    readings: list[dict] = []
    for device_file in glob.glob("/sys/bus/w1/devices/28-*/w1_slave"):
        try:
            text = Path(device_file).read_text()
            if "YES" not in text:
                continue
            marker = "t="
            raw = text.split(marker, 1)[1].strip()
            temp_c = int(raw) / 1000.0
            sensor_id = Path(device_file).parent.name.replace("-", "_")
            readings.append(reading(f"temperature_{sensor_id}", temp_c, "°C"))
        except Exception:
            continue
    return readings


def dht_readings() -> list[dict]:
    if not DHT_PIN:
        return []
    try:
        import board
        import adafruit_dht
    except ImportError:
        return []

    pin = getattr(board, DHT_PIN)
    sensor = adafruit_dht.DHT22(pin)
    try:
        items = []
        if sensor.temperature is not None:
            items.append(reading("temperature", sensor.temperature, "°C"))
        if sensor.humidity is not None:
            items.append(reading("humidity", sensor.humidity, "%"))
        return items
    finally:
        sensor.exit()


def collect_readings() -> list[dict]:
    readings: list[dict] = []

    cpu_temp = cpu_temperature()
    if cpu_temp is not None:
        readings.append(reading("pi_cpu_temperature", cpu_temp, "°C"))

    readings.extend(ds18b20_temperatures())
    readings.extend(dht_readings())

    return readings


def send(readings: list[dict]) -> None:
    if not readings:
        print("No readings collected")
        return

    endpoint = f"{BASE_URL}/api/iot/ingest"
    response = requests.post(
        endpoint,
        headers={
            "Authorization": f"Bearer {DEVICE_TOKEN}",
            "Content-Type": "application/json",
            "User-Agent": "myncel-raspberry-pi-agent/0.1.0",
        },
        data=json.dumps({"readings": readings}),
        timeout=10,
    )
    response.raise_for_status()
    print(f"Sent {len(readings)} readings: {response.text}")


def main() -> None:
    print("Myncel Raspberry Pi agent starting")
    while True:
        try:
            send(collect_readings())
        except Exception as exc:
            print(f"Error: {exc}")
        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
