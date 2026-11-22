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
class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Placeholder text="Map unavailable right now. Everything else still works." /> : this.props.children;
  }
}

export default function MapLoader(props: MapViewProps) {
  return (
    <MapBoundary>
      <MapView {...props} />
    </MapBoundary>
  );
}
