"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { DEFAULT_USER, Listing, PIN_COLOUR, distanceInfo, formatPrice } from "@/lib/seed";
import HandoverModal from "./HandoverModal";
import RatingBadge from "./RatingBadge";
import { softFill } from "@/lib/theme";
import { planRoute } from "@/lib/route";

export interface MapViewProps {
  listings: Listing[];
  /** Pin selected (popup + dashed walking line). */
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Pin highlighted from outside the map (e.g. hovering a chat card). */
  hoverId?: string | null;
  /** Shown over the map when there are no pins yet. */
  emptyHint?: string;
  /**
   * Basket mode: set to colour pins by offer status, draw the walking route You -> each stop,
   * and drop the "request handover" button from popups.
   */
  statusById?: Record<string, "pending" | "accepted">;
}

const STATUS_COLOUR = { pending: "#E9B949", accepted: "#5B9A5B" } as const;
const ROUTE_COLOUR = { pending: "#B8841A", accepted: "#2F5D3A" } as const;

const YOU_COLOUR = "#E9B949";
const YOU_POS: [number, number] = [DEFAULT_USER.lat, DEFAULT_USER.lng];

/** Teardrop pin with an emoji. Cached so markers don't churn icons on every render. */
const iconCache = new Map<string, L.DivIcon>();
function pinIcon(emoji: string, colour: string, active: boolean): L.DivIcon {
  const key = `${emoji}|${colour}|${active}`;
  let icon = iconCache.get(key);
  if (!icon) {
    icon = L.divIcon({
      className: "bop-pin-wrap",
      html: `<div class="bop-pin${active ? " bop-pin-active" : ""}" style="--pin:${colour}"><span>${emoji}</span></div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 40],
      popupAnchor: [0, -38],
    });
    iconCache.set(key, icon);
  }
  return icon;
}

/** Deterministic ~25 m nudge so listings from the same college don't sit exactly on top of each other. */
function spread(id: string, lat: number, lng: number): [number, number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const a = ((h % 1000) / 1000) * Math.PI * 2;
  const r = 0.00012 + (((h >> 10) % 100) / 100) * 0.00012;
  return [lat + Math.sin(a) * r, lng + (Math.cos(a) * r) / 0.62];
}

/** Fits the map to You + all pins; refits when the pin set changes or the map becomes visible. */
function FitBounds({ points, fitKey }: { points: [number, number][]; fitKey: string }) {
  const map = useMap();
  const pointsRef = useRef(points);
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  useEffect(() => {
    const fit = () => {
      const size = map.getSize();
      if (!size.x || !size.y) return; // hidden (e.g. inactive mobile tab): refit once visible
      try {
        map.fitBounds(L.latLngBounds(pointsRef.current), { padding: [48, 48], maxZoom: 16, animate: false });
      } catch {
        map.setView(YOU_POS, 14);
      }
    };
    fit();

    const el = map.getContainer();
    let wasHidden = !el.clientWidth;
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
      if (wasHidden && el.clientWidth) fit();
      wasHidden = !el.clientWidth;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [map, fitKey]);

  return null;
}

export default function MapView({ listings, selectedId, onSelect, hoverId, emptyHint, statusById }: MapViewProps) {
  const [requesting, setRequesting] = useState<Listing | null>(null);

  const pins = useMemo(
    () =>
      listings
        // Only listings with real, finite coordinates get a pin (online / bad data are skipped, never thrown on).
        .filter((l) => !!l && !l.external && Number.isFinite(l.lat) && Number.isFinite(l.lng))
        .map((l) => ({ l, pos: spread(l.id, l.lat!, l.lng!) })),
    [listings]
  );
  const fitKey = pins.map((p) => p.l.id).join(",");
  const points = useMemo<[number, number][]>(() => [YOU_POS, ...pins.map((p) => p.pos)], [pins]);

  const selectedRef = useRef(selectedId);
  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);
  const selected = pins.find((p) => p.l.id === selectedId);
  const walk = selected && !statusById ? distanceInfo(selected.l) : null;

  // Basket mode: walking legs between consecutive stops, drawn on the (slightly spread) pin positions.
  const legs = useMemo(() => {
    if (!statusById) return [];
    try {
      const posById = new Map(pins.map((p) => [p.l.id, p.pos]));
      let from = YOU_POS;
      return planRoute(pins.map((p) => p.l)).legs.flatMap((leg) => {
        const to = posById.get(leg.to.id);
        if (!to) return [];
        const out = { id: leg.to.id, from, to, mins: leg.mins };
        from = to;
        return [out];
      });
    } catch {
      return []; // no route line is better than no map
    }
  }, [pins, statusById]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border-2 border-ink bg-cream shadow-pop">
      <MapContainer center={YOU_POS} zoom={14} scrollWheelZoom className="h-full w-full" style={{ background: "#F4EFE6" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          className="bop-tiles"
        />
        <FitBounds points={points} fitKey={fitKey} />

        {selected && walk && (
          <Polyline positions={[YOU_POS, selected.pos]} pathOptions={{ color: "#2F5D3A", weight: 3, dashArray: "6 8", opacity: 0.95 }}>
            <Tooltip permanent direction="center" className="bop-walk">
              🚶 {walk.walkMins} min walk
            </Tooltip>
          </Polyline>
        )}

        {legs.map((leg) => (
          <Polyline
            key={leg.id}
            positions={[leg.from, leg.to]}
            pathOptions={{ color: ROUTE_COLOUR[statusById?.[leg.id] ?? "accepted"] ?? ROUTE_COLOUR.accepted, weight: 3, dashArray: "6 8", opacity: 0.95 }}
          >
            {leg.mins > 0 && (
              <Tooltip permanent direction="center" className="bop-walk">
                🚶 {leg.mins} min
              </Tooltip>
            )}
          </Polyline>
        ))}

        <Marker position={YOU_POS} icon={pinIcon("🧍", YOU_COLOUR, false)} zIndexOffset={500} keyboard={false}>
          <Tooltip direction="top" offset={[0, -36]}>
            You · {DEFAULT_USER.college}
          </Tooltip>
        </Marker>

        {pins.map(({ l, pos }) => {
          const active = l.id === selectedId || l.id === hoverId;
          return (
            <Marker
              key={l.id}
              position={pos}
              icon={pinIcon(
                l.imageEmoji || "👚",
                (statusById?.[l.id] && STATUS_COLOUR[statusById[l.id]]) || PIN_COLOUR[l.sellerType] || PIN_COLOUR.student,
                active
              )}
              zIndexOffset={active ? 1000 : 0}
              title={l.title}
              eventHandlers={{ click: () => onSelect(l.id) }}
            />
          );
        })}

        {selected && (
          <Popup
            key={selected.l.id}
            position={selected.pos}
            offset={[0, -34]}
            className="bop-popup"
            autoPanPadding={[40, 40]}
            eventHandlers={{
              // Only a real close deselects: a popup swapped out for another pin must not clear the new selection.
              remove: () => {
                if (selectedRef.current === selected.l.id) onSelect(null);
              },
            }}
          >
            <PopupCard l={selected.l} status={statusById?.[selected.l.id]} onRequest={() => setRequesting(selected.l)} />
          </Popup>
        )}
      </MapContainer>

      {pins.length === 0 && emptyHint && (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[500] rounded-2xl bg-cream/95 px-4 py-3 text-center text-sm text-ink/75 backdrop-blur">
          {emptyHint}
        </div>
      )}

      {requesting && <HandoverModal listing={requesting} onClose={() => setRequesting(null)} />}
    </div>
  );
}

function PopupCard({ l, onRequest, status }: { l: Listing; onRequest: () => void; status?: "pending" | "accepted" }) {
  const d = distanceInfo(l);
  const charity = l.sellerType === "charity";
  return (
    <div className="w-52">
      <div
        className="relative flex h-24 items-center justify-center overflow-hidden rounded-xl text-5xl"
        style={{ background: softFill(l.id) }}
      >
        {l.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.imageUrl} alt={l.title} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          l.imageEmoji
        )}
      </div>
      <p className="mt-2 text-sm font-bold leading-snug">{l.title}</p>
      <p className="mt-0.5 text-xs text-ink/75">
        {charity ? `💚 ${l.sellerName}` : `📍 ${l.college}`} · {formatPrice(l.swapOrPrice)}
      </p>
      <RatingBadge listing={l} className="mt-1" />
      {d && (
        <p className="text-xs text-ink/75">
          {d.label} away · 🚶 {d.walkMins} min
        </p>
      )}
      {status ? (
        <p className="mt-2 rounded-full border-2 border-ink bg-sage py-1.5 text-center text-xs font-extrabold text-forest">
          {status === "accepted" ? "✅ Accepted" : "⏳ Waiting for a reply"}
        </p>
      ) : charity ? (
        <Link
          href={`/listing/${l.id}`}
          className="mt-2 block rounded-full bg-leaf py-2 text-center text-xs font-extrabold text-ink"
        >
          Pick up in store today
        </Link>
      ) : (
        <button onClick={onRequest} className="mt-2 w-full rounded-full border-2 border-ink bg-forest text-cream shadow-pop-sm pop py-2 text-xs font-extrabold  ">
          🤝 Request handover
        </button>
      )}
    </div>
  );
}
