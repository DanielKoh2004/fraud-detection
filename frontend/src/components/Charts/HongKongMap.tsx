import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapMarker {
  lat: number;
  lng: number;
  type: 'critical' | 'warning' | 'safe';
  label?: string;
}

interface HongKongMapProps {
  markers?: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
}

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Hong Kong center coordinates
const HK_CENTER: [number, number] = [22.3193, 114.1694];
const HK_ZOOM = 11;

// Sample fraud hotspot locations in Hong Kong
const DEFAULT_MARKERS: MapMarker[] = [
  { lat: 22.3080, lng: 114.1772, type: 'critical', label: 'Tsim Sha Tsui - Active Attack' },
  { lat: 22.2783, lng: 114.1747, type: 'warning', label: 'Central - Flagged Activity' },
  { lat: 22.3361, lng: 114.1469, type: 'safe', label: 'Mong Kok - Monitoring' },
  { lat: 22.2855, lng: 114.1577, type: 'critical', label: 'Wan Chai - High Risk' },
  { lat: 22.3707, lng: 114.1124, type: 'warning', label: 'Sha Tin - Under Review' },
  { lat: 22.2460, lng: 114.1723, type: 'safe', label: 'Aberdeen - Clear' },
];

const getMarkerColor = (type: MapMarker['type']) => {
  switch (type) {
    case 'critical': return '#FF2E2E';
    case 'warning': return '#FFC107';
    case 'safe': return '#00F0FF';
    default: return '#94A3B8';
  }
};

export default function HongKongMap({ markers = DEFAULT_MARKERS, onMarkerClick }: HongKongMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map with dark theme
    const map = L.map(mapContainerRef.current, {
      center: HK_CENTER,
      zoom: HK_ZOOM,
      zoomControl: true,
      attributionControl: false,
    });

    // Dark tile layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Add markers
    markers.forEach((marker) => {
      const color = getMarkerColor(marker.type);
      
      // Create custom pulsing marker
      const pulseIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 20px;
            height: 20px;
            background: ${color};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 10px ${color}, 0 0 20px ${color}40;
            ${marker.type === 'critical' ? 'animation: pulse 1.5s ease-in-out infinite;' : ''}
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const leafletMarker = L.marker([marker.lat, marker.lng], { icon: pulseIcon })
        .addTo(map);

      if (marker.label) {
        leafletMarker.bindTooltip(marker.label, {
          permanent: false,
          direction: 'top',
          className: 'custom-tooltip',
          offset: [0, -10],
        });
      }

      if (onMarkerClick) {
        leafletMarker.on('click', () => onMarkerClick(marker));
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [markers, onMarkerClick]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      {/* Live indicator */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-full">
        <div className="w-2 h-2 rounded-full bg-critical animate-pulse" />
        <span className="text-white text-xs font-medium">LIVE FEED: HONG KONG</span>
      </div>
      
      {/* Map container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full"
        style={{ background: '#0F172A' }}
      />

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .custom-tooltip {
          background: rgba(15, 23, 42, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          border-radius: 6px !important;
          padding: 6px 10px !important;
          font-size: 12px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }
        .custom-tooltip::before {
          border-top-color: rgba(15, 23, 42, 0.9) !important;
        }
        .leaflet-control-zoom a {
          background: rgba(30, 41, 59, 0.9) !important;
          color: white !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(51, 65, 85, 0.9) !important;
        }
      `}</style>
    </div>
  );
}
