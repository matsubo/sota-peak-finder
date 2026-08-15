import { Loader2, LocateFixed, Target } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SotaSummit } from "../types/location";
import {
  trackPositionCheckResult,
  trackPositionCheckStart,
  trackPositionCheckStop,
} from "../utils/analytics";
import { haversineDistance } from "../utils/coordinate";

interface PositionCheckerProps {
  summit: SotaSummit;
}

/**
 * GPS activation-zone checker: watches the device position and reports whether
 * the operator is inside the 25 m vertical activation zone of this summit.
 *
 * Extracted from SummitPage, which owned this feature's state, three effects
 * and ~325 lines of markup on top of everything else the page does.
 */
export function PositionChecker({ summit }: PositionCheckerProps) {
  // GPS activation zone checker
  const [gpsStatus, setGpsStatus] = useState<"idle" | "watching" | "error">("idle");
  const [gpsPos, setGpsPos] = useState<{
    lat: number;
    lon: number;
    altitude: number | null;
    accuracy: number;
    altitudeAccuracy: number | null;
    updatedAt: number;
  } | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const watchIdRef = useRef<number | null>(null);
  const trackedFirstResultRef = useRef(false);

  const stopGpsWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (summit) trackPositionCheckStop(summit.ref);
    setGpsStatus("idle");
    setGpsPos(null);
    setSecondsAgo(0);
  }, [summit]);

  const startGpsWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      return;
    }
    if (summit) trackPositionCheckStart(summit.ref);
    trackedFirstResultRef.current = false;
    setGpsStatus("watching");
    setGpsPos(null);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsPos({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          altitude: pos.coords.altitude,
          accuracy: Math.round(pos.coords.accuracy),
          altitudeAccuracy: pos.coords.altitudeAccuracy
            ? Math.round(pos.coords.altitudeAccuracy)
            : null,
          updatedAt: Date.now(),
        });
        setSecondsAgo(0);
      },
      () => setGpsStatus("error"),
      { enableHighAccuracy: true, maximumAge: 0 },
    );
  }, [summit]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  useEffect(() => {
    if (!gpsPos) return;
    const interval = setInterval(
      () => setSecondsAgo(Math.floor((Date.now() - gpsPos.updatedAt) / 1000)),
      1000,
    );
    return () => clearInterval(interval);
  }, [gpsPos]);

  // Track first position check result with altitude
  useEffect(() => {
    if (!gpsPos || !summit || trackedFirstResultRef.current) return;
    if (gpsPos.altitude === null) return;
    const vertDist = Math.round(gpsPos.altitude - summit.altitude);
    const horizDist = Math.round(haversineDistance(gpsPos.lat, gpsPos.lon, summit.lat, summit.lon));
    const inRange = vertDist >= -25;
    const uncertain =
      inRange &&
      vertDist < 0 &&
      gpsPos.altitudeAccuracy != null &&
      Math.abs(vertDist) + gpsPos.altitudeAccuracy > 25;
    const result = uncertain ? "uncertain" : inRange ? "in_range" : "out_of_range";
    trackPositionCheckResult(summit.ref, result, vertDist, horizDist);
    trackedFirstResultRef.current = true;
  }, [gpsPos, summit]);

  const HALF_RANGE = 60;
  const vertDist = gpsPos?.altitude != null ? Math.round(gpsPos.altitude - summit.altitude) : null;
  const horizDist = gpsPos
    ? Math.round(haversineDistance(gpsPos.lat, gpsPos.lon, summit.lat, summit.lon))
    : null;
  const inRange = vertDist !== null && vertDist >= -25;
  // Uncertain: altitude accuracy could push you across the lower zone boundary
  const uncertain =
    inRange &&
    vertDist !== null &&
    vertDist < 0 &&
    gpsPos?.altitudeAccuracy != null &&
    Math.abs(vertDist ?? 0) + gpsPos.altitudeAccuracy > 25;
  // Gauge: map deviation from summit (-HALF_RANGE..+HALF_RANGE) to 0..100%
  const gaugePos =
    vertDist !== null
      ? Math.max(2, Math.min(98, ((vertDist + HALF_RANGE) / (HALF_RANGE * 2)) * 100))
      : null;
  const zoneL = ((-25 + HALF_RANGE) / (HALF_RANGE * 2)) * 100;
  // Guidance when out of range (only when below summit by more than 25m)
  const guidance =
    !inRange && vertDist !== null
      ? `↑ Ascend ${Math.abs(vertDist) - 25}m to enter activation zone`
      : null;
  // Dynamic styling
  let borderClass = "border-l-orange-500";
  let badgeBg = "bg-black/20 border border-teal-500/10";
  let badgeTextClass = "text-teal-400/30";
  let badgeLabel = "— AWAITING GPS —";
  if (gpsPos?.altitude != null) {
    if (uncertain) {
      borderClass = "border-l-amber-500";
      badgeBg = "bg-amber-500/10 border border-amber-500/30";
      badgeTextClass = "text-amber-400";
      badgeLabel = "⚠ UNCERTAIN";
    } else if (inRange) {
      borderClass = "border-l-green-500";
      badgeBg = "bg-green-500/10 border border-green-500/30";
      badgeTextClass = "text-green-400";
      badgeLabel = "✓ IN RANGE";
    } else {
      borderClass = "border-l-red-500";
      badgeBg = "bg-red-500/10 border border-red-500/30";
      badgeTextClass = "text-red-400";
      badgeLabel = "✗ OUT OF RANGE";
    }
  }
  return (
    <div className={`card-technical rounded-none border-l-4 ${borderClass} p-5 animate-fade-in`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded bg-orange-500/10 border border-orange-500/30">
            <Target className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h2 className="font-display text-base text-orange-400 tracking-wider leading-none">
              POSITION CHECKER
            </h2>
            <p className="text-[10px] font-mono-data text-teal-400/40 mt-0.5">
              Activation zone: within 25m below summit peak
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {gpsStatus === "watching" && gpsPos && (
            <span className="text-[10px] font-mono-data text-teal-400/40">
              {secondsAgo === 0 ? "● live" : `${secondsAgo}s ago`}
            </span>
          )}
          {gpsStatus === "watching" && !gpsPos && (
            <span className="flex items-center gap-1 text-[10px] font-mono-data text-teal-400/60">
              <Loader2 className="w-3 h-3 animate-spin" />
              acquiring
            </span>
          )}
          {gpsStatus === "error" && (
            <button
              type="button"
              onClick={startGpsWatch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-all text-xs font-mono-data text-red-400"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              Retry
            </button>
          )}
          {gpsStatus === "idle" && (
            <button
              type="button"
              onClick={startGpsWatch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 transition-all text-xs font-mono-data text-orange-400"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              Start Check
            </button>
          )}
          {gpsStatus === "watching" && (
            <button
              type="button"
              onClick={stopGpsWatch}
              className="flex items-center gap-1.5 px-2 py-1 rounded border border-teal-500/30 bg-black/30 hover:bg-red-500/10 hover:border-red-500/30 transition-all text-[10px] font-mono-data text-teal-400/50 hover:text-red-400"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* IDLE */}
      {gpsStatus === "idle" && (
        <div className="text-center py-5 space-y-4">
          <p className="text-sm font-mono-data text-gray-400 leading-relaxed">
            Verify your vertical distance
            <br />
            from the summit in real-time.
          </p>
          <button
            type="button"
            onClick={startGpsWatch}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 transition-all text-sm font-mono-data text-orange-400"
          >
            <LocateFixed className="w-4 h-4" />
            Start GPS Check
          </button>
        </div>
      )}

      {/* ACQUIRING */}
      {gpsStatus === "watching" && !gpsPos && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
          <p className="font-mono-data text-teal-400 text-sm tracking-wider">
            Acquiring GPS signal...
          </p>
          <p className="text-[11px] font-mono-data text-gray-500 text-center leading-relaxed">
            Move to an open area if this
            <br />
            takes longer than expected
          </p>
        </div>
      )}

      {/* ACTIVE: no altitude from device */}
      {gpsPos && gpsPos.altitude === null && (
        <div className="space-y-3">
          <div className="data-panel rounded p-3 border border-amber-500/20">
            <p className="text-xs font-mono-data text-amber-400/80 leading-relaxed">
              ⚠ Altitude unavailable — vertical range check not possible.
              <span className="text-gray-500 block mt-1">
                Device may not support GPS altitude, or you are indoors.
              </span>
            </p>
          </div>
          <div className="data-panel rounded p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono-data text-teal-400/50 mb-0.5">
                ↔ HORIZONTAL DISTANCE
              </div>
              <div className="text-xl font-mono-data text-cyan-400">
                {(horizDist ?? 0) >= 1000
                  ? `${((horizDist ?? 0) / 1000).toFixed(2)}km`
                  : `${horizDist}m`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono-data text-teal-400/50 mb-0.5">GPS ±</div>
              <div className="text-sm font-mono-data text-gray-400">{gpsPos.accuracy}m</div>
            </div>
          </div>
          <div className="text-right text-[10px] font-mono-data text-teal-400/30">
            {secondsAgo === 0 ? "● live" : `${secondsAgo}s ago`}
          </div>
        </div>
      )}

      {/* ACTIVE: has altitude */}
      {gpsPos && gpsPos.altitude !== null && (
        <div className="space-y-4">
          {/* Primary status badge */}
          <div className={`rounded p-4 text-center ${badgeBg}`}>
            <div className={`text-2xl font-mono-data font-bold tracking-widest ${badgeTextClass}`}>
              {badgeLabel}
            </div>
            {uncertain && (
              <div className="text-[11px] font-mono-data text-amber-400/60 mt-1.5">
                Altitude accuracy ±{gpsPos.altitudeAccuracy}m overlaps zone boundary — move closer
                to confirm
              </div>
            )}
          </div>

          {/* Deviation gauge */}
          <div>
            <div className="flex justify-between text-[9px] font-mono-data text-teal-400/30 mb-1 px-0.5">
              <span>−{HALF_RANGE}m</span>
              <span>★ SUMMIT</span>
              <span>+{HALF_RANGE}m</span>
            </div>
            <div className="relative h-9 rounded bg-black/50 border border-teal-500/20 overflow-hidden">
              {/* Activation zone band: from -25m to summit and above */}
              <div
                className="absolute inset-y-0 bg-green-500/15 border-l border-green-500/25"
                style={{ left: `${zoneL}%`, right: "0%" }}
              />
              {/* −25 label (lower boundary) */}
              <div className="absolute inset-y-0 flex items-center" style={{ left: `${zoneL}%` }}>
                <span className="text-[8px] font-mono-data text-green-500/50 pl-1">−25</span>
              </div>
              {/* Summit center line */}
              <div className="absolute inset-y-0 w-px bg-amber-400/50" style={{ left: "50%" }} />
              <div
                className="absolute inset-y-0 flex items-center"
                style={{ left: "calc(50% + 3px)" }}
              >
                <span className="text-[9px] text-amber-400/60">★</span>
              </div>
              {/* Your position dot */}
              {gaugePos !== null && (
                <div
                  className="absolute inset-y-0 flex items-center"
                  style={{ left: `${gaugePos}%`, transform: "translateX(-50%)" }}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 shadow-lg ${
                      uncertain
                        ? "bg-amber-400 border-amber-200"
                        : inRange
                          ? "bg-green-400 border-green-200"
                          : "bg-red-400 border-red-200"
                    }`}
                  />
                </div>
              )}
            </div>
            <div className="text-center text-[9px] font-mono-data text-teal-400/25 mt-0.5">
              ← below summit · above summit →
            </div>
          </div>

          {/* Guidance hint when out of range */}
          {guidance && (
            <div className="data-panel rounded p-3 text-center border border-amber-500/20">
              <span className="text-sm font-mono-data text-amber-400 tracking-wide">
                {guidance}
              </span>
            </div>
          )}

          {/* Distance numbers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="data-panel rounded p-3">
              <div className="text-[10px] font-mono-data text-teal-400/50 mb-1">↕ VERTICAL</div>
              <div
                className={`text-2xl font-mono-data leading-none ${(vertDist ?? 0) >= -25 ? "text-green-400" : "text-red-400"}`}
              >
                {(vertDist ?? 0) > 0 ? "+" : ""}
                {vertDist}m
              </div>
              <div className="text-[9px] font-mono-data text-gray-500 mt-1">
                {(vertDist ?? 0) > 0
                  ? "above summit"
                  : (vertDist ?? 0) < 0
                    ? "below summit"
                    : "at summit level"}
              </div>
            </div>
            <div className="data-panel rounded p-3">
              <div className="text-[10px] font-mono-data text-teal-400/50 mb-1">↔ HORIZONTAL</div>
              <div className="text-2xl font-mono-data text-cyan-400 leading-none">
                {(horizDist ?? 0) >= 1000
                  ? `${((horizDist ?? 0) / 1000).toFixed(2)}km`
                  : `${horizDist}m`}
              </div>
              <div className="text-[9px] font-mono-data text-gray-500 mt-1">from summit</div>
            </div>
          </div>

          {/* GPS accuracy + freshness footer */}
          <div className="flex items-center justify-between text-[10px] font-mono-data text-teal-400/35">
            <span>
              GPS ±{gpsPos.accuracy}m
              {gpsPos.altitudeAccuracy ? ` · Alt ±${gpsPos.altitudeAccuracy}m` : ""}
            </span>
            <div className="flex items-center gap-3">
              <span>{secondsAgo === 0 ? "● live" : `${secondsAgo}s ago`}</span>
              <button
                type="button"
                onClick={stopGpsWatch}
                className="px-2 py-0.5 rounded border border-teal-500/20 hover:border-red-500/30 hover:text-red-400 transition-all"
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
