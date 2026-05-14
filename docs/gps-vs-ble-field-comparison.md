# GPS vs BLE Field Comparison Analysis
**VIN:** 5NPD84LF3LH535851  
**GPS Terminal:** 18940726930  
**GPS Scan Report ID:** 10f192a4-89ea-44a3-ad16-a64df53d4d63  
**BLE Scan ID:** 001bbd3e-e410-4ba7-aaf0-47086bc07830 (most recent)

---

## GPS Scan Raw 0x0200 / 0x2017 Payload

### Decoded Fields from rawObdJson.obdLive

| Field | Value | Source |
|-------|-------|--------|
| rpm | 643 | 0x0200 extended PIDs |
| milOn | false | 0x0200 extended PIDs |
| mafGps | 2.2 g/s | 0x0200 extended PIDs |
| throttlePct | 12.9% | 0x0200 extended PIDs |
| ambientTempC | 27°C | 0x0200 extended PIDs |
| coolantTempC | 98°C | 0x0200 extended PIDs |
| fuelLevelPct | 51.3% | 0x0200 extended PIDs |
| barometricKpa | 101 kPa | 0x0200 extended PIDs |
| engineLoadPct | 24% | 0x0200 extended PIDs |
| acceleratorPct | 14% | 0x0200 extended PIDs |
| intakeAirTempC | 57°C | 0x0200 extended PIDs |
| vehicleSpeedKmh | 0 km/h | 0x0200 extended PIDs |
| vehicleVoltageV | 13.6V | 0x0200 extended PIDs |
| timingAdvanceDeg | 2.5° | 0x0200 extended PIDs |
| distanceWithMilKm | 0 km | 0x0200 extended PIDs |
| intakeManifoldKpa | 35 kPa | 0x0200 extended PIDs |
| longTermFuelTrimPct | 103.1% | 0x0200 extended PIDs |
| runtimeSinceStartSec | 2813 sec | 0x0200 extended PIDs |
| vin | 5NPD84LF3LH535851 | 0x0900/0xF2 fault code packet |
| faultCodeCount | 0 | 0x0900/0xF2 fault code packet |

### Unknown PIDs (Raw Bytes)

| PID | Raw Bytes | Status |
|-----|-----------|--------|
| b_0x0010 | [0, 4, 0, 250, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] | UNDECODED |
| b_0x0011 | [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] | UNDECODED (all zeros) |

---

## BLE Scan Fields (Same Vehicle)

| Field | BLE Value | Status |
|-------|-----------|--------|
| vin | 5NPD84LF3LH535851 | MATCHED |
| milOn | false | MATCHED |
| dtcCount | 0 | MATCHED |
| storedDtcCodes | [] | MATCHED |
| pendingDtcCodes | [] | MATCHED |
| permanentDtcCodes | [] | MATCHED |
| fuelSystemStatus | {"system1":4,"system2":0} | **UNSUPPORTED_BY_D450** |
| secondaryAirStatus | null | **UNSUPPORTED_BY_D450** |
| distanceSinceCleared | 514.495188 km | **UNSUPPORTED_BY_D450** |
| timeSinceCleared | 0 | **UNSUPPORTED_BY_D450** |
| warmupsSinceCleared | 46 | **UNSUPPORTED_BY_D450** |
| distanceWithMilOn | 0 | MATCHED |
| milStatusByEcu | {"UNKNOWN":{"milOn":false,"dtcCount":0}} | MATCHED (partial - ECU ID differs) |

---

## Field-by-Field Comparison

### MATCHED Fields (GPS = BLE)

| Field | GPS Value | BLE Value | Notes |
|-------|-----------|-----------|-------|
| vin | 5NPD84LF3LH535851 | 5NPD84LF3LH535851 | ✓ |
| milOn | false | false | ✓ |
| dtcCount | 0 | 0 | ✓ |
| storedDtcCodes | [] | [] | ✓ |
| pendingDtcCodes | [] | [] | ✓ |
| permanentDtcCodes | [] | [] | ✓ |
| distanceWithMilOn | 0 km | 0 | ✓ |

### GPS-Only Fields (Live Telemetry)

| Field | GPS Value | BLE Value | Status |
|-------|-----------|-----------|--------|
| rpm | 643 | N/A | GPS_LIVE_ONLY |
| vehicleSpeedKmh | 0 | N/A | GPS_LIVE_ONLY |
| coolantTempC | 98°C | N/A | GPS_LIVE_ONLY |
| intakeAirTempC | 57°C | N/A | GPS_LIVE_ONLY |
| throttlePct | 12.9% | N/A | GPS_LIVE_ONLY |
| engineLoadPct | 24% | N/A | GPS_LIVE_ONLY |
| mafGps | 2.2 g/s | N/A | GPS_LIVE_ONLY |
| fuelLevelPct | 51.3% | N/A | GPS_LIVE_ONLY |
| batteryVoltageMv | 13600 mV (13.6V) | N/A | GPS_LIVE_ONLY |
| ambientTempC | 27°C | N/A | GPS_LIVE_ONLY |
| barometricKpa | 101 kPa | N/A | GPS_LIVE_ONLY |
| acceleratorPct | 14% | N/A | GPS_LIVE_ONLY |
| intakeManifoldKpa | 35 kPa | N/A | GPS_LIVE_ONLY |
| longTermFuelTrimPct | 103.1% | N/A | GPS_LIVE_ONLY |
| timingAdvanceDeg | 2.5° | N/A | GPS_LIVE_ONLY |
| runtimeSinceStartSec | 2813 sec | N/A | GPS_LIVE_ONLY |

### BLE-Only Fields (Unsupported by D450)

| Field | BLE Value | GPS Value | Status |
|-------|-----------|-----------|--------|
| fuelSystemStatus | {"system1":4,"system2":0} | null | **UNSUPPORTED_BY_D450** |
| secondaryAirStatus | null | null | **UNSUPPORTED_BY_D450** (both null) |
| distanceSinceCleared | 514.495188 km | null | **UNSUPPORTED_BY_D450** |
| timeSinceCleared | 0 | null | **UNSUPPORTED_BY_D450** |
| warmupsSinceCleared | 46 | null | **UNSUPPORTED_BY_D450** |

### Missing Fields (Not in Either)

| Field | Status | Reason |
|-------|--------|--------|
| Freeze Frame Data | NOT_REQUESTED | SAE Mode 02, not available via D450 |
| Diagnostic Readiness Monitors | NOT_REQUESTED | D450 supports 0x5113/0x5114 but not requested in scan |

---

## D450 Protocol Analysis

### Commands Used in GPS Scan

The GPS scan report service sends:
- `0x8103 {0x2017=1, 0x201A=1}` - Enable OBD + request fault codes
- `0x8104` - Query terminal parameters

### D450 Support Matrix

| Field | D450 Support | Command/PID | Notes |
|-------|--------------|-------------|-------|
| VIN | ✓ | 0x0900/0xF2 | Fault code packet |
| MIL Status | ✓ | 0x0900/0xF2 | Fault code packet |
| DTC Codes | ✓ | 0x0900/0xF2 | Fault code packet |
| Live PIDs (RPM, speed, temps, etc.) | ✓ | 0x0200 extended | 0x0200 with OBD data |
| Distance with MIL | ✓ | 0x0200 extended | |
| Fuel System Status | ✗ | N/A | Not in D450 0xEA/0xEB/0xEC data flows |
| Secondary Air Status | ✗ | N/A | Not in D450 data flows |
| Warm-ups Since Clear | ✗ | N/A | SAE Mode 01 PID 0x30, not mapped by D450 |
| Distance Since Clear | ✗ | N/A | SAE Mode 01 PID 0x31, not mapped by D450 |
| Freeze Frame Data | ✗ | N/A | SAE Mode 02, not available via D450 |
| Diagnostic Readiness | ✓ | 0x5113/0x5114 | Bitmask (support + completion) - NOT REQUESTED |

### Missing D450 Commands

According to the documentation (`docs/GPS_OBD_SCANNER.md` and `docs/ble-vs-gps-parity.md`):

- **Fuel System Status**: Not in D450 data flows
- **Secondary Air Status**: Not in D450 data flows  
- **Warm-ups Since Clear**: SAE Mode 01 PID 0x30, not mapped by D450
- **Distance Since Clear**: SAE Mode 01 PID 0x31, not mapped by D450
- **Freeze Frame Data**: SAE Mode 02, not available via D450
- **Diagnostic Readiness**: Supported via 0x5113/0x5114 but NOT requested in current scan

**Conclusion**: The D450 firmware/protocol does not support these BLE-style fields through any command group. This is a device limitation, not a backend decode error.

---

## 0x0104 Parameter Response Analysis

### Terminal 18940726930 Parameters

```json
{
  "obdEnabled": 1
}
```

### Expected OBD Parameters (from m0104-query-params-response.ts)

| Parameter ID | Name | Expected | Present |
|--------------|------|----------|---------|
| 0x2017 | OBD Enable | ✓ | ✓ (value: 1) |
| 0x201A | Read Fault Codes | ✓ | ✗ |
| 0x201B | Upload Interval (&3Z) | ✓ | ✗ |
| 0x201C | Large Packet Interval (&5R) | ✓ | ✗ |
| 0x201D | Diag Log Setting (&5P) | ✓ | ✗ |
| 0x2012 | Mileage and Fuel Type | ✓ | ✗ |
| 0x2013 | Mileage Coefficient | ✓ | ✗ |
| 0x2014 | Fuel Coefficient | ✓ | ✗ |
| 0x2015 | Fuel Density | ✓ | ✗ |
| 0x2016 | Idle Fuel Coefficient | ✓ | ✗ |

### Missing Parameters

The following parameters are NOT present in the 0x0104 response:
- **&5A**: Not found in code - may be device-specific or different ID
- **&3Z** (0x201B): Upload interval - MISSING
- **&5R** (0x201C): Large packet interval - MISSING
- **&5S**: Not found in code
- **&5T**: Not found in code

**Note**: The device may only return parameters that have been explicitly set via 0x8103, or may have default values that aren't exposed in the query response.

---

## Revoked Terminal 18940726929 Investigation

### Terminal Status

| Field | Value |
|-------|-------|
| ID | cde83c41-04c0-496e-bcbd-dabb682954a9 |
| Device Identifier | 18940726929 |
| Status | **REVOKED** |
| Owner User ID | null |

### Conclusion

✓ Terminal 18940726929 is a **separate** terminal from 18940726930  
✓ It is REVOKED (unpaired by admin)  
✓ The warnings are expected behavior for a revoked terminal attempting to connect  
✓ This **does NOT interfere** with terminal 18940726930 operations  
✓ The warnings can be ignored for the purposes of this analysis

---

## Recommendations

### 1. UI Note (Required)

Add this note to the GPS scan report UI:

> **GPS scanner supports live OBD telemetry; some BLE diagnostic fields may be unavailable unless supported by D450 firmware/protocol.**

### 2. Decode Unknown PIDs (Optional Enhancement)

The raw payload contains unknown PIDs:
- `b_0x0010`: [0, 4, 0, 250, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
- `b_0x0011`: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

These should be investigated against the D450 specification to determine if they contain useful data.

### 3. Request Diagnostic Readiness (Optional Enhancement)

The D450 supports diagnostic readiness via 0x5113/0x5114. Consider adding this to the scan request to match BLE parity more closely.

### 4. Do Not Fake Unsupported Fields

**Critical**: Do NOT populate the following fields in GPS scan reports:
- fuelSystemStatus
- secondaryAirStatus  
- distanceSinceCleared
- warmupsSinceCleared
- freezeFrameData

These should remain `null` to accurately reflect D450 capabilities.

---

## Summary

| Category | Count | Notes |
|----------|-------|-------|
| MATCHED | 7 | Core diagnostic fields (VIN, MIL, DTCs) |
| GPS_LIVE_ONLY | 16 | Real-time telemetry not in BLE scans |
| UNSUPPORTED_BY_D450 | 5 | Device limitation, not backend error |
| NOT_REQUESTED | 2 | Readiness monitors - could be added |
| UNDECODED | 2 | Unknown PIDs in raw payload |

**Bottom Line**: The GPS scanner is working correctly. The missing BLE-style fields are due to D450 firmware/protocol limitations, not backend decode failures. The GPS scanner provides rich live telemetry that BLE does not, while BLE provides some historical/emissions fields that D450 does not support.
