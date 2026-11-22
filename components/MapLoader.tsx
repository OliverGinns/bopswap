"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import type { MapViewProps } from "./MapView";

function Placeholder({ text }: { text: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-ink bg-sage/50 p-6 text-center">
      <span className="text-4xl">🗺️</span>
      <p className="text-sm text-stone">{text}</p>
    </div>
  );
}

// Leaflet touches `window`, so it only ever loads in the browser.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <Placeholder text="Loading map…" />,
});

/** If the map ever throws, show a soft fallback instead of taking the page down. */
class MapBoundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean; key: string }> {
  state = { failed: false, key: this.props.resetKey };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  // A changed pin set (e.g. an offer got accepted or retracted) gets one more try instead of staying broken until reload.
  static getDerivedStateFromProps(props: { resetKey: string }, state: { failed: boolean; key: string }) {
    return props.resetKey !== state.key ? { failed: false, key: props.resetKey } : null;
  }
  componentDidCatch(error: unknown) {
    console.error("[BopSwap] map failed to render:", error);
  }
  render() {
    return this.state.failed ? <Placeholder text="Map unavailable right now. Everything else still works." /> : this.props.children;
  }
}

export default function MapLoader(props: MapViewProps) {
  return (
    <MapBoundary resetKey={`${props.listings.map((l) => l?.id).join(",")}|${JSON.stringify(props.statusById ?? {})}`}>
      <MapView {...props} />
    </MapBoundary>
  );
}
