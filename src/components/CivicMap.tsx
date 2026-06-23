import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Report, INDIAN_CITIES } from '../types';

interface CivicMapProps {
  reports: Report[];
  selectedCity: string;
  onSelectReport: (report: Report) => void;
}

export default function CivicMap({ reports, selectedCity, onSelectReport }: CivicMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Find center coordinates based on selectedCity name
  const cityConfig = INDIAN_CITIES.find(c => c.name.toLowerCase() === selectedCity.toLowerCase()) || INDIAN_CITIES[1]; // default Bengaluru

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize Leaflet map if not already done
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: cityConfig.center,
        zoom: 12,
        zoomControl: true,
        attributionControl: false
      });

      // Add elegant grayscale and warm styled open map tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Pan map to current city if selected city changes
    map.setView(cityConfig.center, 12);

    // Clear previous markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Filter reports that have coordinates
    const locateReports = reports.filter(r => r.location && typeof r.location.lat === 'number' && typeof r.location.lng === 'number');

    locateReports.forEach(report => {
      // Determine pin color based on severity
      let colorClass = 'bg-emerald-500 ring-emerald-200';
      let borderHex = '#10B981';
      if (report.severity === 'Critical') {
        colorClass = 'bg-rose-600 ring-rose-200 animate-pulse';
        borderHex = '#E11D48';
      } else if (report.severity === 'Severe') {
        colorClass = 'bg-amber-500 ring-amber-200';
        borderHex = '#F59E0B';
      } else if (report.severity === 'Moderate') {
        colorClass = 'bg-blue-500 ring-blue-200';
        borderHex = '#3B82F6';
      }

      // Create high-fidelity circular element pin marker using DivIcon
      const icon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10">
            <span class="absolute inline-flex w-full h-full rounded-full ${colorClass} opacity-60 scale-125"></span>
            <div class="relative flex items-center justify-center w-5 h-5 rounded-full ${colorClass} text-white font-semibold text-[10px] shadow-lg border border-white">
              ${report.category.charAt(0)}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([report.location.lat, report.location.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div class="p-3 max-w-[240px] font-sans">
            <div class="flex items-center gap-1.5 justify-between mb-1">
              <span class="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                report.severity === 'Critical' ? 'bg-rose-100 text-rose-800' :
                report.severity === 'Severe' ? 'bg-amber-100 text-amber-800' :
                report.severity === 'Moderate' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
              }">${report.severity}</span>
              <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">${report.status}</span>
            </div>
            <h4 class="font-bold text-sm text-slate-900 leading-snug font-display">${report.title}</h4>
            <p class="text-xs text-slate-600 my-1 line-clamp-2">${report.description}</p>
            <div class="text-[10px] text-slate-400 font-medium mb-2 flex items-center gap-0.5">
              <span>📍 ${report.location.city} • ${report.upvotesCount} Agrees</span>
            </div>
            <button id="btn-popup-${report.id}" class="w-full text-center py-1.5 text-xs font-semibold bg-navy text-white rounded hover:bg-navy-hover transition-colors shadow-sm">
              Review Full Complaint
            </button>
          </div>
        `, {
          closeButton: false,
          minWidth: 200
        });

      // Event listener when popup opens to bind dynamic action to review button
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-popup-${report.id}`);
        if (btn) {
          btn.addEventListener('click', () => {
            onSelectReport(report);
            map.closePopup();
          });
        }
      });

      markersRef.current.push(marker);
    });

    // Cleanup on destroy
    return () => {
      // Keep map reference if possible, clean markers on next re-render
    };
  }, [reports, selectedCity]);

  // Handle map resizing correctly to prevent grey dead zones inside iframe resizing
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });

    if (mapRef.current) {
      resizeObserver.observe(mapRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[460px] md:min-h-full rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: "460px", height: "100%" }} />
      
      {/* Small subtle map overlay index indicator */}
      <div className="absolute bottom-4 left-4 z-[999] bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200/80 shadow-md max-w-xs font-sans">
        <h5 className="text-[10px] uppercase tracking-wider font-extrabold text-navy mb-1.5">Map Hazards Legend</h5>
        <div className="space-y-1.5 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block animate-pulse"></span>
            <span className="font-semibold text-slate-900">Critical Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span className="text-slate-600">Severe Grievances</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            <span className="text-slate-600">Moderate Concerns</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-600">Low Scale Issues</span>
          </div>
        </div>
      </div>
    </div>
  );
}
