import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Check, ChevronRight, AlertTriangle, Play, CheckCircle2, User, Phone, Search, Loader2 } from 'lucide-react';
import { Order, parseGPSCoordinates } from '../../types';
import { getLalamoveQuote, getRandomMockRider, LalamoveQuote } from '../../services/lalamoveService';
import { RESTAURANT_LOCATION } from '../../constants';
import { calculateDistanceKm } from '../../utils/geo';

interface LalamoveDispatchPanelProps {
  order: Order;
  updateOrderFields: (orderId: string, fields: Partial<any>) => Promise<any>;
  language: 'en' | 'th';
}

export default function LalamoveDispatchPanel({ order, updateOrderFields, language }: LalamoveDispatchPanelProps) {
  const [distance, setDistance] = useState<number>(0);
  const [quotes, setQuotes] = useState<LalamoveQuote[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<'motorcycle' | 'car' | 'pickup'>('motorcycle');
  const [isBooking, setIsBooking] = useState(false);

  // Extract coordinates and compute distance
  useEffect(() => {
    let lat = order.deliveryLat;
    let lng = order.deliveryLng;

    if (!lat || !lng) {
      const parsed = parseGPSCoordinates(order.deliveryAddress || '');
      if (parsed) {
        lat = parsed.lat;
        lng = parsed.lng;
      }
    }

    if (lat && lng) {
      const d = calculateDistanceKm(RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng, lat, lng);
      setDistance(d);
      setQuotes(getLalamoveQuote(d));
    } else {
      // Fallback distance calculation if no coordinates, assume 5km standard
      setDistance(5.0);
      setQuotes(getLalamoveQuote(5.0));
    }
  }, [order.deliveryAddress, order.deliveryLat, order.deliveryLng]);

  // Simulation effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const status = order.lalamoveStatus;

    if (status && status !== 'none' && status !== 'completed' && status !== 'cancelled') {
      // Simulate transit states automatically
      timer = setTimeout(() => {
        let nextStatus: Order['lalamoveStatus'] = 'none';
        
        if (status === 'assigned') {
          nextStatus = 'picking_up';
        } else if (status === 'picking_up') {
          nextStatus = 'in_transit';
        } else if (status === 'in_transit') {
          nextStatus = 'completed';
        }

        if (nextStatus && nextStatus !== 'none') {
          updateOrderFields(order.id, { lalamoveStatus: nextStatus });
        }
      }, 12000); // Step every 12 seconds
    }

    return () => clearTimeout(timer);
  }, [order.lalamoveStatus, order.id, updateOrderFields]);

  const handleDispatch = async () => {
    setIsBooking(true);
    const selectedQuote = quotes.find(q => q.vehicleType === selectedVehicle) || quotes[0];
    const rider = getRandomMockRider();
    const trackingId = `LALA-${Math.floor(100000000 + Math.random() * 900000000)}`;

    try {
      await updateOrderFields(order.id, {
        lalamoveStatus: 'assigned',
        lalamoveTrackingId: trackingId,
        lalamoveRiderName: rider.name,
        lalamoveRiderPhone: rider.phone,
        lalamoveVehicleType: selectedQuote.vehicleNameTh,
        deliveryFee: selectedQuote.totalFare // Update order delivery fee to match vehicle selection
      });
    } catch (e) {
      console.error("Lalamove dispatch failed:", e);
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelBooking = async () => {
    if (confirm(language === 'th' ? "ต้องการยกเลิกการเรียกไรเดอร์ Lalamove ใช่หรือไม่?" : "Are you sure you want to cancel the Lalamove booking?")) {
      await updateOrderFields(order.id, {
        lalamoveStatus: 'none',
        lalamoveTrackingId: undefined,
        lalamoveRiderName: undefined,
        lalamoveRiderPhone: undefined,
        lalamoveVehicleType: undefined
      });
    }
  };

  const status = order.lalamoveStatus || 'none';

  return (
    <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-3 mt-3 shadow-xs space-y-3 animate-fade-in text-xs">
      <div className="flex justify-between items-center border-b border-orange-200/50 pb-2">
        <span className="font-extrabold text-orange-700 flex items-center gap-1">
          <Truck size={14} className="animate-pulse" />
          {language === 'th' ? 'Lalamove Delivery Dispatch' : 'Lalamove Dispatch Hub'}
        </span>
        <span className="text-[10px] bg-white border border-orange-200 text-orange-600 px-2 py-0.5 rounded font-bold">
          {distance.toFixed(2)} km
        </span>
      </div>

      {status === 'none' ? (
        // QUOTE AND BOOKING VIEW
        <div className="space-y-2.5">
          <p className="font-bold text-gray-500 uppercase text-[10px]">
            {language === 'th' ? 'เลือกประเภทรถเพื่อคำนวณราคาและเรียกไรเดอร์' : 'Select vehicle to book:'}
          </p>

          <div className="grid grid-cols-1 gap-1.5">
            {quotes.map((q) => (
              <button
                key={q.vehicleType}
                type="button"
                onClick={() => setSelectedVehicle(q.vehicleType)}
                className={`p-2 rounded-lg border text-left flex justify-between items-center transition ${selectedVehicle === q.vehicleType ? 'bg-orange-100 border-orange-300 ring-2 ring-orange-400/20' : 'bg-white border-gray-200'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">
                    {q.vehicleType === 'motorcycle' ? '🛵' : q.vehicleType === 'car' ? '🚗' : '🚚'}
                  </span>
                  <div>
                    <div className="font-bold text-gray-800 text-[11px]">
                      {language === 'th' ? q.vehicleNameTh : q.vehicleName}
                    </div>
                    <div className="text-[9px] text-gray-400 font-semibold">
                      {language === 'th' ? `ระยะเวลาประมาณ ${q.etaMinutes} นาที` : `ETA: ~${q.etaMinutes} mins`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-orange-600 text-xs">฿{q.totalFare}</div>
                  <div className="text-[8px] text-gray-400 font-semibold">Lalamove rate</div>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleDispatch}
            disabled={isBooking}
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white py-2.5 rounded-lg font-bold shadow-sm transition flex items-center justify-center gap-1.5"
          >
            {isBooking ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Play size={12} />
            )}
            {language === 'th' ? 'เรียกไรเดอร์ Lalamove ทันที' : 'Book Lalamove Dispatch'}
          </button>
        </div>
      ) : (
        // ACTIVE DISPATCH SIMULATOR & TRACKING VIEW
        <div className="space-y-3">
          {/* Status Stepper */}
          <div className="bg-white rounded-lg p-2.5 border border-orange-200/50 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-[10px] text-gray-400 uppercase">
                {language === 'th' ? 'สถานะจัดส่ง' : 'Dispatch Status'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                status === 'assigned' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                status === 'picking_up' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                status === 'in_transit' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {status === 'assigned' && (language === 'th' ? 'จับคู่ไรเดอร์แล้ว' : 'Rider Assigned')}
                {status === 'picking_up' && (language === 'th' ? 'กำลังมารับสินค้า' : 'Rider Picking Up')}
                {status === 'in_transit' && (language === 'th' ? 'กำลังนำส่งสินค้า' : 'In Transit')}
                {status === 'completed' && (language === 'th' ? 'ส่งสำเร็จแล้ว' : 'Delivered')}
              </span>
            </div>

            {/* Stepper Progress Bar */}
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${status !== 'none' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                  <span className="text-[9px] font-bold mt-1 text-gray-500">{language === 'th' ? 'จับคู่' : 'Match'}</span>
                </div>
                <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-1"></div>
                <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${['picking_up', 'in_transit', 'completed'].includes(status) ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                  <span className="text-[9px] font-bold mt-1 text-gray-500">{language === 'th' ? 'รับอาหาร' : 'Pickup'}</span>
                </div>
                <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-1"></div>
                <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${['in_transit', 'completed'].includes(status) ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
                  <span className="text-[9px] font-bold mt-1 text-gray-500">{language === 'th' ? 'นำส่ง' : 'Transit'}</span>
                </div>
                <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-1"></div>
                <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>4</div>
                  <span className="text-[9px] font-bold mt-1 text-gray-500">{language === 'th' ? 'ส่งแล้ว' : 'Arrived'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rider Info Card */}
          <div className="bg-white rounded-lg p-3 border border-orange-200/50 space-y-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase">{language === 'th' ? 'ข้อมูลไรเดอร์' : 'Rider Details'}</span>
              <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                ID: {order.lalamoveTrackingId}
              </span>
            </div>

            <div className="space-y-1.5 font-bold">
              <div className="flex justify-between">
                <span className="text-gray-400">ไรเดอร์:</span>
                <span className="text-gray-700 flex items-center gap-1">
                  <User size={12} className="text-gray-400" />
                  {order.lalamoveRiderName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">เบอร์โทร:</span>
                <a href={`tel:${order.lalamoveRiderPhone}`} className="text-blue-600 underline flex items-center gap-1">
                  <Phone size={12} className="text-blue-400" />
                  {order.lalamoveRiderPhone}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ประเภทยานพาหนะ:</span>
                <span className="text-gray-700">{order.lalamoveVehicleType}</span>
              </div>
            </div>
          </div>

          {/* Dispatch Simulation Notice / Cancel */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancelBooking}
              className="flex-1 py-1.5 rounded bg-white text-red-600 border border-red-200 hover:bg-red-50 text-[11px] font-bold shadow-sm transition active:scale-95"
            >
              {language === 'th' ? 'ยกเลิกการเรียก' : 'Cancel Lalamove'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
