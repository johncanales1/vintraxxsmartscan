/**
 * useGpsAlarms — fleet-wide (or terminal-scoped) alarms, REST seed + WS
 * deltas. The /alerts and /devices/[id]?sub=alarms tabs both use this.
 *
 * Filters supported:
 *   • since  — ISO timestamp lower bound (inclusive)
 *   • severity, terminalId, acknowledged
 *
 * On WS `alarm.opened` / `alarm.closed` / `alarm.acknowledged` we mutate the
 * local cache without refetching. Filter mismatch is rechecked client-side.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gpsApi } from "./gpsApi";
import { gpsWs } from "./gpsWs";
import type { GpsAlarm } from "./types";

export interface UseGpsAlarmsOptions {
  since?: string;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  terminalId?: string;
  acknowledged?: boolean;
  limit?: number;
}

export function useGpsAlarms(opts: UseGpsAlarmsOptions = {}) {
  const [alarms, setAlarms] = useState<GpsAlarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // We stringify the opts to make the dep stable for useEffect.
  const optsKey = useMemo(() => JSON.stringify(opts), [opts]);

  const refetch = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    const parsed = JSON.parse(optsKey) as UseGpsAlarmsOptions;
    const res = await gpsApi.listAlarms(parsed, controller.signal);
    if (controller.signal.aborted) return;
    if (res.success && res.data) {
      setAlarms(res.data.alarms ?? []);
    } else if (res.message !== "aborted") {
      setError(res.message ?? "Failed to load alarms");
    }
    setLoading(false);
  }, [optsKey]);

  useEffect(() => {
    refetch();
    return () => abortRef.current?.abort();
  }, [refetch]);

  // WS deltas. We can't fetch the full alarm row from a `alarm.opened` event
  // (the event only carries id+type+severity+at), so we mutate optimistically
  // and the next refetch (e.g. on filter change) reconciles details.
  useEffect(() => {
    const parsed = JSON.parse(optsKey) as UseGpsAlarmsOptions;

    const offOpened = gpsWs.on("alarm.opened", (e) => {
      // Apply filter before inserting.
      if (parsed.terminalId && parsed.terminalId !== e.terminalId) return;
      if (parsed.severity && parsed.severity !== e.severity) return;
      setAlarms((prev) => {
        if (prev.some((a) => a.id === e.alarmId)) return prev;
        // Synthetic row — REST refetch later replaces with full data.
        const synthetic: GpsAlarm = {
          id: e.alarmId,
          terminalId: e.terminalId,
          ownerUserId: e.ownerUserId,
          type: e.alarmType as GpsAlarm["type"],
          severity: e.severity,
          openedAt: e.at,
          closedAt: null,
          locationId: null,
          latitude: null,
          longitude: null,
          speedKmh: null,
          extraData: null,
          acknowledged: false,
          acknowledgedByAdminId: null,
          acknowledgedByUserId: null,
          acknowledgedAt: null,
          ackNote: null,
          serviceAppointmentId: null,
          createdAt: e.at,
        };
        return [synthetic, ...prev];
      });
    });

    const offClosed = gpsWs.on("alarm.closed", (e) => {
      setAlarms((prev) =>
        prev.map<GpsAlarm>((a) =>
          a.id === e.alarmId ? { ...a, closedAt: e.at } : a,
        ),
      );
    });

    const offAck = gpsWs.on("alarm.acknowledged", (e) => {
      setAlarms((prev) =>
        prev.map<GpsAlarm>((a) =>
          a.id === e.alarmId
            ? { ...a, acknowledged: true, acknowledgedAt: e.at }
            : a,
        ),
      );
    });

    return () => {
      offOpened();
      offClosed();
      offAck();
    };
  }, [optsKey]);

  return { alarms, loading, error, refetch, setAlarms };
}
