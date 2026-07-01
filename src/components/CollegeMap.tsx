"use client";

import { useEffect, useRef } from "react";

// ── Tamil Nadu district centroids ─────────────────────────────────────────────
const DISTRICT_COORDS: Record<string, [number, number]> = {
  "Chennai":         [13.0827, 80.2707],
  "Coimbatore":      [11.0168, 76.9558],
  "Salem":           [11.6643, 78.1460],
  "Madurai":         [9.9252,  78.1198],
  "Trichy":          [10.7905, 78.7047],
  "Tirunelveli":     [8.7139,  77.7567],
  "Vellore":         [12.9165, 79.1325],
  "Kanchipuram":     [12.8185, 79.6947],
  "Thanjavur":       [10.7870, 79.1378],
  "Erode":           [11.3410, 77.7172],
  "Tirupur":         [11.1085, 77.3411],
  "Namakkal":        [11.2189, 78.1670],
  "Dharmapuri":      [12.1279, 78.1581],
  "Krishnagiri":     [12.5204, 78.2137],
  "Puducherry":      [11.9416, 79.8083],
  "Chengalpattu":    [12.6921, 80.0084],
  "Villupuram":      [11.9401, 79.4861],
  "Kanyakumari":     [8.0883,  77.5385],
  "Tiruvannamalai":  [12.2253, 79.0747],
  "Thiruvannamalai": [12.2253, 79.0747],
  "Cuddalore":       [11.7480, 79.7714],
  "Nagapattinam":    [10.7672, 79.8449],
  "Pudukkottai":     [10.3797, 78.8194],
  "Ramanathapuram":  [9.3639,  78.8397],
  "Thiruvallur":     [13.1231, 79.9078],
  "Sivagangai":      [9.8477,  78.4838],
  "Sivaganagi":      [9.8477,  78.4838],
  "Sivaganga":       [9.8477,  78.4838],
  "Thoothukudi":     [8.7642,  78.1348],
  "Dindigul":        [10.3624, 77.9695],
  "Theni":           [10.0104, 77.4770],
  "Ariyalur":        [11.1400, 79.0762],
  "Virudhunagar":    [9.5851,  77.9558],
  "Perambalur":      [11.2318, 78.8804],
  "Karur":           [10.9601, 78.0767],
  "Tamil Nadu":      [10.7905, 78.7047], // fallback — Trichy centroid
};

function coordsFor(city: string): [number, number] | null {
  if (DISTRICT_COORDS[city]) return DISTRICT_COORDS[city];
  // Partial match
  for (const [key, coords] of Object.entries(DISTRICT_COORDS)) {
    if (city.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(city.toLowerCase())) {
      return coords;
    }
  }
  return null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MapCollegeEntry = {
  city: string;
  count: number;
  colleges: { code: string; name: string }[];
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function CollegeMap({
  entries,
  onClose,
  totalColleges,
  quota,
  score,
}: {
  entries: MapCollegeEntry[];
  onClose: () => void;
  totalColleges: number;
  quota: string;
  score: number;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    // Dynamically load Leaflet (avoids SSR issues)
    import("leaflet").then((L) => {
      // Leaflet CSS
      if (!document.querySelector("#leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const map = L.map(mapRef.current!, {
        center: [10.9, 78.4],
        zoom: 7,
        minZoom: 6,
        maxZoom: 14,
        zoomControl: true,
      });

      leafletMap.current = map;

      // OpenStreetMap free tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const maxCount = Math.max(...entries.map((e) => e.count), 1);
      const placed: [number, number][] = [];

      entries.forEach((entry) => {
        const raw = coordsFor(entry.city);
        if (!raw) return;

        // Nudge overlapping markers slightly
        let [lat, lng] = raw;
        const too_close = placed.some(
          ([plat, plng]) => Math.abs(plat - lat) < 0.05 && Math.abs(plng - lng) < 0.05
        );
        if (too_close) { lat += 0.08; lng += 0.08; }
        placed.push([lat, lng]);

        const radius = 10 + Math.round((entry.count / maxCount) * 26);
        const isChennai = entry.city === "Chennai";

        const marker = L.circleMarker([lat, lng], {
          radius,
          fillColor: isChennai ? "#e91e8c" : "#00b4d8",
          color: "#0a0a0a",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        }).addTo(map);

        // College list HTML for popup
        const collegeListHtml = entry.colleges
          .slice(0, 20)
          .map(
            (c) =>
              `<div style="padding:4px 0;border-bottom:1px solid #eee;font-size:12px;line-height:1.4">
                <span style="display:inline-block;padding:1px 6px;border-radius:99px;background:#0a0a0a;color:#ede717;font-size:10px;font-weight:700;margin-right:5px">${c.code}</span>
                ${c.name}
              </div>`
          )
          .join("");

        const extra =
          entry.colleges.length > 20
            ? `<div style="padding:6px 0;font-size:11px;color:#aaa">+${entry.colleges.length - 20} more colleges</div>`
            : "";

        marker.bindPopup(
          `<div style="min-width:220px;max-width:300px;font-family:sans-serif">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <strong style="font-size:14px">${entry.city}</strong>
              <span style="background:${isChennai ? "#e91e8c" : "#00b4d8"};color:#fff;border-radius:99px;padding:2px 10px;font-size:11px;font-weight:700">${entry.count} colleges</span>
            </div>
            ${collegeListHtml}
            ${extra}
          </div>`,
          { maxHeight: 300 }
        );

        // Label
        const icon = L.divIcon({
          html: `<span style="background:transparent;color:#fff;font-weight:700;font-size:11px;white-space:nowrap;text-shadow:0 0 3px #0a0a0a,0 0 3px #0a0a0a">${entry.count}</span>`,
          className: "",
          iconAnchor: [10, 6],
        });
        L.marker([lat, lng], { icon, interactive: false }).addTo(map);
      });

      // Fit TN bounds
      map.fitBounds([[8.0, 76.8], [13.5, 80.6]], { padding: [20, 20] });
    });

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, [entries]);

  return (
    /* Overlay */
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(10,10,10,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{
        width: "100%", maxWidth: 860,
        border: "2px solid var(--color-ink)",
        borderRadius: 20,
        boxShadow: "6px 6px 0 var(--color-teal)",
        overflow: "hidden",
        background: "#ffffff",
        display: "flex", flexDirection: "column",
        maxHeight: "90vh",
      }}>
        {/* Modal header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "2px solid var(--color-ink)",
          background: "var(--color-ink)",
        }}>
          <div>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-yellow)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Your Colleges on the Map
            </p>
            <p style={{ margin: "3px 0 0", fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#aaa" }}>
              {totalColleges} colleges eligible · {quota} quota · score {score} · tap a circle for details
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "7px 16px", borderRadius: 9999, flexShrink: 0,
              border: "2px solid var(--color-yellow)", background: "transparent",
              color: "var(--color-yellow)", cursor: "pointer",
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "0.72rem", textTransform: "uppercase",
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Legend */}
        <div style={{
          display: "flex", gap: 16, padding: "10px 20px",
          borderBottom: "1.5px solid #eee", background: "#fafaf8", flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#e91e8c", border: "2px solid #0a0a0a" }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "#555" }}>Chennai</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#00b4d8", border: "2px solid #0a0a0a" }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "#555" }}>Other districts</span>
          </div>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "#aaa", marginLeft: "auto" }}>
            Circle size = number of eligible colleges · click any circle for names
          </span>
        </div>

        {/* Map */}
        <div ref={mapRef} style={{ flex: 1, minHeight: 460 }} />
      </div>
    </div>
  );
}
