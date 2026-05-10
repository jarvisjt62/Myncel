from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any


def _load_yaml(path: Path) -> dict[str, Any]:
    try:
        import yaml  # type: ignore
    except ImportError as exc:
        raise RuntimeError("PyYAML is required for YAML config files. Install with: pip install PyYAML") from exc

    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    if not isinstance(data, dict):
        raise ValueError("Gateway configuration must be a YAML/JSON object")
    return data


def load_config(path: str | os.PathLike[str]) -> dict[str, Any]:
    config_path = Path(path)
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")

    if config_path.suffix.lower() in {".yaml", ".yml"}:
        data = _load_yaml(config_path)
    else:
        with config_path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)

    data.setdefault("gateway", {})
    data.setdefault("myncel", {})
    data.setdefault("connectors", [])

    mycel = data["myncel"]
    if "base_url" not in mycel:
        mycel["base_url"] = os.getenv("MYNCEL_BASE_URL", "")
    if "device_token" not in mycel:
        mycel["device_token"] = os.getenv("MYNCEL_DEVICE_TOKEN", "")

    if not mycel.get("base_url"):
        raise ValueError("Missing myncel.base_url or MYNCEL_BASE_URL")
    if not mycel.get("device_token"):
        raise ValueError("Missing myncel.device_token or MYNCEL_DEVICE_TOKEN")

    return data
