from __future__ import annotations

from typing import Any

from .base import Connector, ConnectorConfigError
from ..models import Reading


class ModbusConnector(Connector):
    """Poll Modbus TCP or RTU registers.

    Example config:
      type: modbus
      name: compressor_modbus
      transport: tcp
      host: 192.168.1.50
      port: 502
      unit_id: 1
      registers:
        - type: temperature
          unit: °C
          address: 40001
          function: holding
          count: 1
          scale: 0.1
    """

    mode = "poll"

    def __init__(self, name: str, config: dict[str, Any]) -> None:
        super().__init__(name, config)
        self.transport = str(config.get("transport", "tcp")).lower()
        self.unit_id = int(config.get("unit_id", config.get("slave_id", 1)))
        self.registers = list(config.get("registers", []))
        if not self.registers:
            raise ConnectorConfigError(f"{name}: modbus.registers is required")

    def _client(self):
        try:
            from pymodbus.client import ModbusSerialClient, ModbusTcpClient
        except ImportError as exc:
            raise RuntimeError("Install pymodbus to use ModbusConnector: pip install pymodbus") from exc

        if self.transport == "tcp":
            return ModbusTcpClient(
                host=self.config["host"],
                port=int(self.config.get("port", 502)),
                timeout=float(self.config.get("timeout_seconds", 3)),
            )

        if self.transport in {"rtu", "serial"}:
            return ModbusSerialClient(
                port=self.config["port"],
                baudrate=int(self.config.get("baudrate", 9600)),
                parity=str(self.config.get("parity", "N")),
                stopbits=int(self.config.get("stopbits", 1)),
                bytesize=int(self.config.get("bytesize", 8)),
                timeout=float(self.config.get("timeout_seconds", 3)),
            )

        raise ConnectorConfigError(f"{self.name}: unsupported Modbus transport {self.transport}")

    @staticmethod
    def _zero_based_address(address: int) -> int:
        # Users often enter 40001/30001 style addresses. pymodbus expects zero-based offsets.
        if address >= 40001:
            return address - 40001
        if address >= 30001:
            return address - 30001
        if address >= 10001:
            return address - 10001
        if address >= 1:
            return address - 1
        return address

    def _read_register(self, client, spec: dict[str, Any]):
        address = self._zero_based_address(int(spec["address"]))
        count = int(spec.get("count", 1))
        function = str(spec.get("function", "holding")).lower()

        kwargs = {"address": address, "count": count, "slave": self.unit_id}
        if function in {"holding", "holding_register"}:
            return client.read_holding_registers(**kwargs)
        if function in {"input", "input_register"}:
            return client.read_input_registers(**kwargs)
        if function in {"coil", "coils"}:
            return client.read_coils(**kwargs)
        if function in {"discrete", "discrete_input"}:
            return client.read_discrete_inputs(**kwargs)
        raise ConnectorConfigError(f"{self.name}: unsupported function {function}")

    @staticmethod
    def _decode(result, spec: dict[str, Any]) -> float:
        if hasattr(result, "isError") and result.isError():
            raise RuntimeError(f"Modbus error response: {result}")

        raw_values = getattr(result, "registers", None)
        if raw_values is None:
            raw_values = getattr(result, "bits", None)
        if not raw_values:
            raise RuntimeError("Modbus response had no registers/bits")

        data_type = str(spec.get("data_type", "uint16")).lower()
        value: float
        if data_type in {"bool", "coil"}:
            value = 1.0 if bool(raw_values[0]) else 0.0
        elif data_type in {"int16", "signed16"}:
            raw = int(raw_values[0])
            value = float(raw - 65536 if raw > 32767 else raw)
        elif data_type in {"uint32", "int32"} and len(raw_values) >= 2:
            combined = (int(raw_values[0]) << 16) + int(raw_values[1])
            if data_type == "int32" and combined > 2147483647:
                combined -= 4294967296
            value = float(combined)
        else:
            value = float(raw_values[0])

        value = value * float(spec.get("scale", 1)) + float(spec.get("offset", 0))
        return value

    def poll(self) -> list[Reading]:
        readings: list[Reading] = []
        client = self._client()
        if not client.connect():
            raise RuntimeError(f"{self.name}: failed to connect to Modbus target")

        try:
            for spec in self.registers:
                result = self._read_register(client, spec)
                value = self._decode(result, spec)
                readings.append(
                    Reading(
                        type=str(spec["type"]),
                        value=value,
                        unit=str(spec.get("unit", "")),
                        source=self.name,
                        metadata={"address": spec.get("address"), "connector": "modbus"},
                    )
                )
        finally:
            client.close()

        return readings


ConnectorClass = ModbusConnector
