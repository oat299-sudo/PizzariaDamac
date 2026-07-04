import React, { useEffect, useState, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Search, AlertTriangle, CheckCircle2, Info, RefreshCw, HelpCircle, Truck, Info as InfoIcon } from 'lucide-react';
import { calculateDistanceKm, reverseGeocode } from '../../utils/geo';
import { getLalamoveQuote, LalamoveQuote } from '../../services/lalamoveService';
import { RESTAURANT_LOCATION } from '../../constants';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY.length > 5 && API_KEY !== 'YOUR_API_KEY';

interface DeliveryMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number, distanceKm: number, addressName: string) => void;
  language: 'en' | 'th';
}

// Popular Bangkok/Nonthaburi landmarks for Mock Map selector
const MOCK_DESTINATIONS = [
  { name: 'Siam Paragon (สยามพารากอน)', lat: 13.7461, lng: 100.5341, distance: 20.3 },
  { name: 'Central Westgate (เซ็นทรัล เวสต์เกต)', lat: 13.8756, lng: 100.4109, distance: 13.2 },
  { name: 'Impact Arena Muang Thong Thani (อิมแพ็ค เมืองทองธานี)', lat: 13.9114, lng: 100.5501, distance: 3.5 },
  { name: 'Don Mueang Airport (สนามบินดอนเมือง)', lat: 13.9133, lng: 100.6042, distance: 9.1 },
  { name: 'Central Chaengwattana (เซ็นทรัล แจ้งวัฒนะ)', lat: 13.9038, lng: 100.5284, distance: 2.3 }
];

export default function DeliveryMap({ lat, lng, onChange, language }: DeliveryMapProps) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [localQuotes, setLocalQuotes] = useState<LalamoveQuote[]>([]);
  const [estimatedDistance, setEstimatedDistance] = useState<number>(0);
  const [resolvedAddress, setResolvedAddress] = useState<string>('');
  const [showKeyHelp, setShowKeyHelp] = useState(false);

  // Sync internal quotes whenever lat/lng changes
  useEffect(() => {
    const dist = calculateDistanceKm(RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng, lat, lng);
    setEstimatedDistance(dist);
    const quotes = getLalamoveQuote(dist);
    setLocalQuotes(quotes);

    // Fetch address text
    reverseGeocode(lat, lng).then(addr => {
      if (addr) {
        setResolvedAddress(addr);
      }
    });
  }, [lat, lng]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(language === 'th' ? 'เบราว์เซอร์ของคุณไม่รองรับ GPS' : 'Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        const dist = calculateDistanceKm(RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng, userLat, userLng);
        
        reverseGeocode(userLat, userLng).then(addr => {
          const addrName = addr || `GPS Pin: ${userLat.toFixed(5)}, ${userLng.toFixed(5)}`;
          onChange(userLat, userLng, dist, addrName);
          setGpsLoading(false);
        });
      },
      (err) => {
        console.error(err);
        alert(language === 'th' ? 'ไม่สามารถระบุตำแหน่ง GPS ของคุณได้ กรุณาใส่ที่อยู่ทางแผนที่' : 'Failed to retrieve your GPS location.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSelectMockDestination = (dest: typeof MOCK_DESTINATIONS[0]) => {
    setSearchTerm(dest.name);
    onChange(dest.lat, dest.lng, dest.distance, dest.name);
  };

  return (
    <div className="space-y-4 border border-brand-100 rounded-xl bg-white p-4 shadow-sm" id="delivery-map-container">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
          <MapPin size={16} className="text-brand-600 animate-bounce" />
          {language === 'th' ? 'เลือกตำแหน่งพิกัดจัดส่ง' : 'Pin Delivery Destination'}
        </h4>
        <button
          type="button"
          onClick={() => setShowKeyHelp(!showKeyHelp)}
          className="hidden text-xs text-brand-600 hover:text-brand-800 flex items-center gap-1 font-semibold"
        >
          <HelpCircle size={14} />
          {language === 'th' ? 'คู่มือแผนที่กูเกิล' : 'Google Map Setup'}
        </button>
      </div>

      {/* Google Map Key Setup Help Box */}
      {false && (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg text-xs leading-relaxed text-amber-800 animate-fade-in space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <AlertTriangle size={15} className="text-amber-600" />
            <span>{language === 'th' ? 'ระบบต้องการ Google Maps API Key สำหรับฟังก์ชันค้นหาเสมือนจริง' : 'Google Maps API Key Required for Live Map Pinning'}</span>
          </div>
          <p className="text-[11px] text-amber-700">
            {language === 'th' 
              ? 'คุณยังไม่ได้เปิดใช้ Google Maps API Key หรือยังไม่ได้กำหนดในระบบ Secrets เพื่อให้แผนที่ Google Maps จริงทำงาน กรุณาเพิ่มคีย์ตามขั้นตอนดังนี้:'
              : 'The real-time Google Maps widget and Place Autocomplete require a valid Google Maps Platform Key to load. Follow these steps:'}
          </p>
          <ol className="list-decimal pl-4 space-y-1 text-[11px] text-amber-800 font-medium">
            <li>
              <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener" className="underline text-blue-600 font-bold">
                {language === 'th' ? 'คลิกที่นี่เพื่อรับ API Key ฟรี' : 'Get a Google Maps API Key'}
              </a>
            </li>
            <li>
              {language === 'th' 
                ? 'เปิดปุ่มตั้งค่า (⚙️ ฟันเฟืองขวาบน) -> Secrets' 
                : 'Open Settings (⚙️ gear icon, top-right) -> Secrets'}
            </li>
            <li>
              {language === 'th' 
                ? 'เพิ่มตัวแปรชื่อ GOOGLE_MAPS_PLATFORM_KEY แล้ววางคีย์ที่ได้ลงไป แล้วกด Enter' 
                : 'Create a secret named GOOGLE_MAPS_PLATFORM_KEY and paste your key.'}
            </li>
          </ol>
          <p className="text-[10px] text-amber-600 font-semibold bg-white/60 p-1.5 rounded border border-amber-200/50">
            {language === 'th'
              ? '💡 ตอนนี้ระบบเปิดใช้งาน โหมดสาธิตแบบจำลองแผนที่ (Mock Map Sandbox) ให้คุณทดสอบการส่งพิกัดและคำนวณค่าส่ง Lalamove ได้ทันที!'
              : '💡 Sandbox Mode is active! You can pick simulation landmarks or drop mock pins to calculate estimated Lalamove rates now.'}
          </p>
        </div>
      )}

      {/* MAP AND ROUTE BLOCK */}
      <div className="relative">
        {hasValidKey ? (
          // REAL GOOGLE MAP
          <div className="w-full h-[240px] rounded-xl overflow-hidden border border-gray-200 relative bg-gray-50">
            <APIProvider apiKey={API_KEY} version="weekly">
              <MapInstance 
                lat={lat} 
                lng={lng} 
                onChange={onChange} 
                language={language} 
                estimatedDistance={estimatedDistance}
                resolvedAddress={resolvedAddress}
              />
            </APIProvider>
          </div>
        ) : (
          // MOCK Sandbox Map
          <div className="w-full rounded-xl border border-gray-200 overflow-hidden bg-sky-50 relative p-4 flex flex-col justify-between h-[240px] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
            {/* Simulation Shop Center Indicator */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-4 h-4 bg-red-600 animate-ping rounded-full absolute"></div>
              <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-white border-2 border-white shadow-md z-10 font-bold text-[10px]">🍕</div>
              <span className="text-[10px] bg-brand-900 text-white font-extrabold px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap">Pizza Damac (Shop)</span>
            </div>

            {/* Simulation Destination Marker */}
            <div 
              className="absolute flex flex-col items-center transition-all duration-300"
              style={{
                top: '25%',
                right: '20%',
              }}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white border-2 border-white shadow-md z-10 font-bold text-xs">📍</div>
              <span className="text-[10px] bg-emerald-900 text-white font-extrabold px-1.5 py-0.5 rounded shadow mt-1 max-w-[120px] truncate">
                {language === 'th' ? 'จุดส่งสินค้า' : 'Dropoff'}
              </span>
            </div>

            {/* Dotted path representing route */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <svg className="w-full h-full opacity-60">
                <line x1="50%" y1="50%" x2="80%" y2="25%" stroke="#059669" strokeWidth="3" strokeDasharray="6,6" />
              </svg>
            </div>

            <div className="z-10 bg-white/95 backdrop-blur-sm border border-gray-200/50 p-2 rounded-lg max-w-full shadow-sm">
              <p className="text-[10px] font-extrabold text-gray-500 uppercase">{language === 'th' ? 'จำลองค้นหาพิกัด / เลือกสถานที่จัดส่งหลัก' : 'Mock Search / Select Location'}</p>
              <div className="grid grid-cols-2 gap-1.5 mt-1.5 max-h-[100px] overflow-y-auto pr-1">
                {MOCK_DESTINATIONS.map((dest) => (
                  <button
                    key={dest.name}
                    type="button"
                    onClick={() => handleSelectMockDestination(dest)}
                    className="p-1 px-1.5 rounded bg-gray-50 border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 text-left text-[10px] font-semibold text-gray-700 truncate"
                  >
                    🚀 {dest.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="z-10 flex justify-between items-end">
              <div className="bg-emerald-900 text-white rounded px-2 py-1 text-[10px] font-extrabold shadow flex items-center gap-1">
                <span>⚡ {estimatedDistance.toFixed(2)} km</span>
              </div>
              <div className="bg-white px-2 py-1 rounded text-[10px] text-gray-500 border border-gray-200 max-w-[150px] truncate shadow-sm">
                📌 {resolvedAddress || 'Bangkok, Thailand'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Geolocation Button */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={gpsLoading}
          className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5"
        >
          {gpsLoading ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Navigation size={14} />
          )}
          {language === 'th' ? 'ดึงพิกัดปัจจุบัน (Use GPS)' : 'Fetch My GPS Location'}
        </button>
      </div>

      {/* LALAMOVE RATE ESTIMATIONS TABLE */}
      {estimatedDistance > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2.5 animate-fade-in">
          <div className="flex justify-between items-center border-b border-gray-200/80 pb-1.5">
            <span className="text-[11px] font-extrabold text-orange-600 flex items-center gap-1 uppercase">
              <Truck size={14} />
              {language === 'th' ? 'ประมาณการค่าส่งลาร่ามูฟ (Lalamove Estimations)' : 'Lalamove Delivery Quotes'}
            </span>
            <span className="text-[10px] text-gray-400 font-bold bg-white border border-gray-200 px-1.5 py-0.5 rounded">
              {estimatedDistance.toFixed(2)} km
            </span>
          </div>

          <div className="space-y-1.5">
            {localQuotes.map((quote) => (
              <div 
                key={quote.vehicleType} 
                className="flex items-center justify-between p-2 rounded-md bg-white border border-gray-200/60 hover:border-orange-200 transition shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {quote.vehicleType === 'motorcycle' ? '🛵' : quote.vehicleType === 'car' ? '🚗' : '🚚'}
                  </span>
                  <div>
                    <div className="text-[11px] font-extrabold text-gray-800">
                      {language === 'th' ? quote.vehicleNameTh : quote.vehicleName}
                    </div>
                    <div className="text-[9px] text-gray-400 font-semibold">
                      {language === 'th' ? `ระยะเวลาประมาณ ${quote.etaMinutes} นาที` : `ETA: ~${quote.etaMinutes} mins`}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-extrabold text-orange-600">
                    ฿{quote.totalFare}
                  </div>
                  <div className="text-[8px] text-gray-400 font-semibold">
                    {language === 'th' ? `เริ่มต้น ฿${quote.baseFare}` : `Base ฿${quote.baseFare}`}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[9px] text-gray-400 leading-normal bg-orange-50/50 p-2 rounded border border-orange-100/30 flex items-start gap-1">
            <InfoIcon size={10} className="shrink-0 mt-0.5 text-orange-400" />
            <span>
              {language === 'th'
                ? '*นี่คือค่าส่งประเมินทางกูเกิลแมพ และประเมินอัตราลาร่ามูฟ มอเตอร์ไซค์, รถยนต์ และ กระบะตามระยะทางจริงในกรุงเทพและปริมณฑล ทางร้านจะเรียกและยืนยันค่าบริการใน POS อีกครั้ง'
                : '*Estimated delivery fees modeled exactly on Lalamove official Bangkok tariff. Actual quotes verified and booked by staff in POS dispatch center.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Separate component to handle internal Vis.gl Google Map logic to prevent load-time dependency errors
function MapInstance({ lat, lng, onChange, language, estimatedDistance, resolvedAddress }: DeliveryMapProps & { estimatedDistance: number, resolvedAddress: string }) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  // Draw Route Polyline from Store to Customer Pin
  useEffect(() => {
    if (!routesLib || !map) return;

    // Clear previous polylines
    polylinesRef.current.forEach(p => p.setMap(null));

    const origin = { lat: RESTAURANT_LOCATION.lat, lng: RESTAURANT_LOCATION.lng };
    const destination = { lat, lng };

    routesLib.Route.computeRoutes({
      origin,
      destination,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    })
    .then(({ routes }) => {
      if (routes?.[0]) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach(p => p.setMap(map));
        polylinesRef.current = newPolylines;

        // Auto pan viewport to frame both store and user delivery pin
        if (routes[0].viewport) {
          map.fitBounds(routes[0].viewport);
        }
      }
    })
    .catch((err) => {
      console.error("Route computing failed:", err);
    });

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [routesLib, map, lat, lng]);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const clickLat = e.latLng.lat();
      const clickLng = e.latLng.lng();
      const dist = calculateDistanceKm(RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng, clickLat, clickLng);
      
      reverseGeocode(clickLat, clickLng).then(addr => {
        onChange(clickLat, clickLng, dist, addr || `Coordinate Pin: ${clickLat.toFixed(5)}, ${clickLng.toFixed(5)}`);
      });
    }
  };

  return (
    <Map
      defaultCenter={{ lat, lng }}
      defaultZoom={13}
      mapId="DEMO_MAP_ID"
      onClick={handleMapClick}
      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Pizza Store Location Marker */}
      <AdvancedMarker position={{ lat: RESTAURANT_LOCATION.lat, lng: RESTAURANT_LOCATION.lng }} title="Pizza Damac (Store)">
        <Pin background="#ea580c" glyphColor="#fff" borderColor="#c2410c" scale={1.2}>
          🍕
        </Pin>
      </AdvancedMarker>

      {/* Customer Delivery Pin */}
      <AdvancedMarker 
        position={{ lat, lng }} 
        gmpDraggable={true} 
        onDragEnd={(e) => {
          if (e.latLng) {
            const dragLat = e.latLng.lat();
            const dragLng = e.latLng.lng();
            const dist = calculateDistanceKm(RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng, dragLat, dragLng);
            reverseGeocode(dragLat, dragLng).then(addr => {
              onChange(dragLat, dragLng, dist, addr || `Dragged Pin: ${dragLat.toFixed(5)}, ${dragLng.toFixed(5)}`);
            });
          }
        }}
        title="Delivery Destination"
      >
        <Pin background="#059669" glyphColor="#fff" borderColor="#047857" scale={1.2}>
          📍
        </Pin>
      </AdvancedMarker>
    </Map>
  );
}
