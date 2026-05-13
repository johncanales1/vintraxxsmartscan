# BLE vs GPS OBD Scan Parity Report

Manual comparison of BLE OBD scanner (direct OBD-II) vs D450 GPS OBD scanner
(JT/T 808 protocol) on the same vehicle via terminal 18940726930.

## Field-by-field comparison

| BLE Scan Field | GPS D450 Source | Sub-ID | Status | Notes |
|---|---|---|---|---|
| VIN | 0x0205 offset 103 (17-char ASCII) or 0xEC/0x5115 | — | **MATCHED** | Auto-populated on every device reconnect |
| MIL (Check Engine) | 0xEB/0x6014 or 0xEC/0x5112 | 1 byte boolean | **MATCHED** | Also in 0x0900/0xF2 DTC report |
| Stored DTCs | 0x0900/0xF2 fault code packet | — | **MATCHED** | Triggered by 0x201A=1 |
| Pending DTCs | 0x0900/0xF2 fault code packet | — | **MATCHED** | Same F2 packet |
| Permanent DTCs | 0x0900/0xF2 fault code packet | — | **MATCHED** | Same F2 packet |
| Engine RPM | 0xEB/0x60C0 | 2 bytes | **MATCHED** | Precision: 1, Range: 0–8000 |
| Vehicle Speed | 0xEB/0x60D0 | 1 byte | **MATCHED** | km/h, Range: 0–240 |
| Coolant Temp | 0xEB/0x6050 | 1 byte offset -40 | **MATCHED** | °C, Range: -40–210 |
| Intake Air Temp | 0xEB/0x60F0 | 1 byte offset -40 | **MATCHED** | °C, Range: -40–210 |
| Ambient Temp | 0xEB/0x6460 | 1 byte offset -40 | **MATCHED** | °C, Range: -40–210 |
| MAF (air flow) | 0xEB/0x6100 | 2 bytes ÷10 | **MATCHED** | g/s, precision 0.1 |
| Throttle Position | 0xEB/0x6110 | 2 bytes ÷10 | **MATCHED** | %, precision 0.1 |
| Engine Load | 0xEB/0x6040 | 1 byte | **MATCHED** | %, Range: 0–100 |
| Fuel Level | 0xEB/0x62F0 | 2 bytes ÷10 | **MATCHED** | %, bit15=L flag. Was DECODE_ERROR (529%), fixed to ÷10 |
| Battery Voltage | 0xEA/0x0012 | 2 bytes ÷10 | **MATCHED** | Volts, precision 0.1 |
| Distance w/ MIL | 0xEB/0x6210 | 4 bytes | **MATCHED** | km |
| Runtime Since Start | 0xEB/0x61F0 | 2 bytes | **MATCHED** | seconds |
| Accelerator Pedal | 0xEB/0x6490 | 1 byte | **MATCHED** | %, Range: 0–100 |
| Intake Manifold Pressure | 0xEB/0x60B0 / 0xEC/0x50B0 | 1 or 2 bytes | **MATCHED** | kPa |
| Barometric Pressure | 0xEB/0x6330 | 1 byte | **MATCHED** | kPa, Range: 0–125 |
| Fuel Rail Pressure | 0xEB/0x60A0 | 2 bytes | **MATCHED** | kPa, Range: 0–500 |
| Odometer / Mileage | 0xEA/0x0003 (meters÷1000) or 0x0205 offset 120 | — | **MATCHED** | Was DECODE_ERROR (210M km), fixed: ÷1000 for meters→km |
| Long-term Fuel Trim | 0xEB/0x6070 | 2 bytes ÷10 | **MATCHED** | %, precision 0.1 (newly decoded) |
| Timing Advance | 0xEB/0x60E0 | 2 bytes ÷10 - 64 | **MATCHED** | °, precision 0.1 (newly decoded) |
| OBD Protocol | 0xEA/0x0016 or 0xEC/0x5111 | 1 byte | **MATCHED** | Protocol type table |
| Diagnostic Readiness | 0xEC/0x5113 + 0x5114 | 2 bytes each | **MATCHED** | Bitmask (support + completion) |
| Fuel-system Status | N/A | — | **NOT_SUPPORTED_BY_DEVICE** | Not in D450 0xEA/0xEB/0xEC data flows |
| Secondary-air Status | N/A | — | **NOT_SUPPORTED_BY_DEVICE** | Not in D450 data flows |
| Warm-ups Since Clear | N/A | — | **NOT_SUPPORTED_BY_DEVICE** | SAE Mode 01 PID 0x30, not mapped by D450 |
| Distance Since Clear | N/A | — | **NOT_SUPPORTED_BY_DEVICE** | SAE Mode 01 PID 0x31, not mapped by D450 |
| Freeze Frame Data | N/A | — | **NOT_SUPPORTED_BY_DEVICE** | SAE Mode 02, not available via D450 |

## Summary

- **22 fields MATCHED** — GPS scan now produces the same values as BLE for these PIDs
- **5 fields NOT_SUPPORTED_BY_DEVICE** — the D450 protocol simply doesn't expose these SAE J1979 PIDs; they are displayed as "—" in the UI with a tooltip explaining the limitation
- **2 fields were DECODE_ERROR** (fuel level 529%, mileage 210M km) — both fixed:
  - `fuelLevelPct`: raw magnitude ÷ 10 per spec "Display value as upload value divided by 10"
  - `totalMileageKm`: unit is meters (spec says "Mi" = meters), ÷ 1000 for km

## Previously-unknown sub-IDs now decoded

All `b_0x____` and `s_0x____` entries from `unknownPids` have been mapped:

| Old key | Sub-ID | Decoded field | Unit |
|---|---|---|---|
| b_0x0005 | 0x0005 | totalRuntimeSec | seconds |
| b_0x0006 | 0x0006 | totalShutdownSec | seconds |
| b_0x0007 | 0x0007 | totalIdleSec | seconds |
| b_0x0013 | 0x0013 | backupBatteryV | 0.1V |
| b_0x0015 | 0x0015 | vehicleModelId | ID |
| b_0x0016 | 0x0016 | obdProtocolType → diagnosticProtocol | enum |
| b_0x0017 | 0x0017 | drivingCycleLabel | — |
| b_0x0018 | 0x0018 | gpsSatelliteCount | count |
| b_0x0019 | 0x0019 | gpsAccuracy | 0.01 |
| b_0x001a | 0x001A | gpsSnrDb | dB |
| b_0x001d | 0x001D | deviceRemovalStatus | flag |
| b_0x001e | 0x001E | cumulativeMileageKm | meters÷1000 |
| b_0x0020 | 0x0020 | ignitionTypeBits | bitfield |
| s_0x6070 | 0x6070 | longTermFuelTrimPct | 0.1% |
| s_0x60e0 | 0x60E0 | timingAdvanceDeg | 0.1° offset -64 |

Only `b_0x0010` (accelerometer, 14 bytes) and `b_0x0011` (vehicle status, 20 bytes)
remain in `unknownPids` as structured diagnostic blobs not relevant for the scan report UI.
