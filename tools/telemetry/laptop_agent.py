#!/usr/bin/env python3
"""
Myncel Phase 1 Laptop Telemetry Agent

Collects basic laptop/desktop metrics and posts them to Myncel's telemetry
ingestion endpoint.

Required environment variables:
  MYNCEL_BASE_URL      Example: https://your-myncel-domain.com
  MYNCEL_DEVICE_TOKEN  Token generated from POST /api/machines/{id}/device-token

Optional environment variables:
  MYNCEL_INTERVAL_SECONDS  Default: 5
  MYNCEL_VERIFY_TLS        Default: true. Set false only for local self-signed testing.
"""

from __future__ import annotations

import json
import os
import platform
import socket
import sys
import time
from datetime import datetime, timezone
from typing import Any

try:
    import psutil  # type: ignore
except ImportError:
    psutil = None

try:
    import requests  # type: ignore
except ImportError:
    requests = None


def env_required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        print(f"Missing required environment variable: {name}", file=sys.stderr)
        sys.exit(2)
    return value


def env_int(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        return max(1, int(raw))
    except ValueError:
        return default


def env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name, "").strip().lower()
    if not raw:
        return default
    return raw not in {"0", "false", "no", "off"}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def add_reading(readings: list[dict[str, Any]], metric_type: str, value: Any, unit: str) -> None:
    if value is None:
        return
    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        return
    readings.append(
        {
            "type": metric_type,
            "value": round(numeric_value, 4),
            "unit": unit,
            "recordedAt": now_iso(),
        }
    )


def collect_temperature_c() -> float | None:
    if not psutil or not hasattr(psutil, "sensors_temperatures"):
        return None

    try:
        temps = psutil.sensors_temperatures(fahrenheit=False)
    except Exception:
        return None

    candidates: list[float] = []
    for entries in temps.values():
        for entry in entries:
            current = getattr(entry, "current", None)
            if isinstance(current, (int, float)) and current > 0:
                candidates.append(float(current))

    if not candidates:
        return None

    return max(candidates)


def collect_battery_percent() -> float | None:
    if not psutil or not hasattr(psutil, "sensors_battery"):
        return None

    try:
        battery = psutil.sensors_battery()
    except Exception:
        return None

    if not battery:
        return None

    return float(battery.percent)


def collect_readings() -> list[dict[str, Any]]:
    readings: list[dict[str, Any]] = []

    if psutil:
        add_reading(readings, "cpu_load", psutil.cpu_percent(interval=1), "%")
        add_reading(readings, "memory_usage", psutil.virtual_memory().percent, "%")
        add_reading(readings, "disk_usage", psutil.disk_usage("/").percent, "%")

        net = psutil.net_io_counters()
        add_reading(readings, "network_bytes_sent", net.bytes_sent, "bytes")
        add_reading(readings, "network_bytes_recv", net.bytes_recv, "bytes")

        boot_age_hours = (time.time() - psutil.boot_time()) / 3600
        add_reading(readings, "uptime", boot_age_hours, "h")

        add_reading(readings, "cpu_temperature", collect_temperature_c(), "°C")
        add_reading(readings, "battery", collect_battery_percent(), "%")
    else:
        # Minimal fallback if psutil is not installed. This still proves connectivity.
        load_avg = os.getloadavg()[0] if hasattr(os, "getloadavg") else 0
        add_reading(readings, "system_load_1m", load_avg, "load")

    return readings


def post_readings(base_url: str, token: str, readings: list[dict[str, Any]], verify_tls: bool) -> dict[str, Any]:
    if not requests:
        raise RuntimeError("The 'requests' package is required. Install with: pip install requests psutil")

    endpoint = base_url.rstrip("/") + "/api/iot/ingest"
    response = requests.post(
        endpoint,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": f"myncel-laptop-agent/1.0 ({platform.system()} {platform.release()}; {socket.gethostname()})",
        },
        data=json.dumps({"readings": readings}),
        timeout=15,
        verify=verify_tls,
    )

    try:
        payload = response.json()
    except Exception:
        payload = {"raw": response.text}

    if response.status_code >= 400:
        raise RuntimeError(f"HTTP {response.status_code}: {payload}")

    return payload


def main() -> None:
    base_url = env_required("MYNCEL_BASE_URL")
    token = env_required("MYNCEL_DEVICE_TOKEN")
    interval = env_int("MYNCEL_INTERVAL_SECONDS", 5)
    verify_tls = env_bool("MYNCEL_VERIFY_TLS", True)

    print("Myncel laptop telemetry agent started")
    print(f"Base URL: {base_url}")
    print(f"Interval: {interval}s")
    print(f"TLS verification: {'on' if verify_tls else 'off'}")
    print("Press Ctrl+C to stop.")

    while True:
        try:
            readings = collect_readings()
            if not readings:
                print("No readings collected; install psutil for richer metrics.")
            else:
                result = post_readings(base_url, token, readings, verify_tls)
                print(
                    f"{datetime.now().isoformat(timespec='seconds')} "
                    f"accepted={result.get('accepted')} machine={result.get('machineName')}"
                )
        except KeyboardInterrupt:
            print("\nStopping telemetry agent.")
            return
        except Exception as exc:
            print(f"Telemetry post failed: {exc}", file=sys.stderr)

        time.sleep(interval)


if __name__ == "__main__":
    main()