
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus, parseGPSCoordinates, parseDeliveryPhone } from '../types';
import { CheckCircle, Clock, Utensils, Bell, MapPin, Truck, ShoppingBag, Banknote, QrCode, ChefHat, Flame, LogOut, Bike, Layers, History, Calendar, Volume2, VolumeX, Printer, Phone, Globe } from 'lucide-react';

export const KitchenView: React.FC = () => {
  const { orders, updateOrderStatus, adminLogout, t, language, toggleLanguage, paperSize, setPaperSize } = useStore();
  const [filterType, setFilterType] = useState<'active' | 'today' | 'yesterday'>('active');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  const handlePrintOrder = (order: Order) => {
    setPrintOrder(order);
    setTimeout(() => {
        window.print();
    }, 250);
  };
  
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
      try {
          const saved = localStorage.getItem('damac_kds_sound');
          return saved !== null ? JSON.parse(saved) : true;
      } catch (e) {
          return true;
      }
  });
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Function to initialize & unlock the AudioContext
  const initAudio = () => {
      try {
          if (!audioCtxRef.current) {
              audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          if (audioCtxRef.current.state === 'suspended') {
              audioCtxRef.current.resume();
          }
          setAudioUnlocked(true);
          // Play a test chime to let the user know it works
          playBellChime(true);
      } catch (e) {
          console.warn("Failed to initialize or resume AudioContext", e);
      }
  };

  // Add click listener to document to automatically auto-unlock audio context on first interaction
  useEffect(() => {
      const handleUserGesture = () => {
          if (!audioUnlocked) {
              initAudio();
          }
          // Remove listener once unlocked
          window.removeEventListener('click', handleUserGesture);
          window.removeEventListener('touchstart', handleUserGesture);
      };

      window.addEventListener('click', handleUserGesture);
      window.addEventListener('touchstart', handleUserGesture);

      return () => {
          window.removeEventListener('click', handleUserGesture);
          window.removeEventListener('touchstart', handleUserGesture);
      };
  }, [audioUnlocked]);

  const toggleSound = () => {
      setSoundEnabled(prev => {
          const next = !prev;
          localStorage.setItem('damac_kds_sound', JSON.stringify(next));
          return next;
      });
      // Try initializing on toggle sound click too
      initAudio();
      setTimeout(() => {
          playSuccessFeedback();
      }, 50);
  };

  const playClickSound = () => {
      if (!soundEnabled) return;
      try {
          const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
          if (!audioCtxRef.current) audioCtxRef.current = ctx;
          if (ctx.state === 'suspended') ctx.resume();
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(580, ctx.currentTime);
          
          gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
          
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.08);
      } catch (e) {
          console.warn("Failed to play click sound", e);
      }
  };

  const playSuccessFeedback = () => {
      if (!soundEnabled) return;
      try {
          const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
          if (!audioCtxRef.current) audioCtxRef.current = ctx;
          if (ctx.state === 'suspended') ctx.resume();
          
          const beep = (freq: number, delay: number, duration: number) => {
              if (!ctx) return;
              const osc = ctx.createOscillator();
              const gainNode = ctx.createGain();
              osc.connect(gainNode);
              gainNode.connect(ctx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
              gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
              gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + delay + 0.02);
              gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
              osc.start(ctx.currentTime + delay);
              osc.stop(ctx.currentTime + delay + duration + 0.05);
          };
          beep(659.25, 0, 0.08); // E5
          beep(880.00, 0.07, 0.2);  // A5
      } catch (e) {
          console.warn("Failed to play success sound", e);
      }
  };

  const playAlertSound = () => {
      if (!soundEnabled) return;
      try {
          const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
          if (!audioCtxRef.current) audioCtxRef.current = ctx;
          if (ctx.state === 'suspended') ctx.resume();
          
          const buzz = (freq: number, delay: number, duration: number) => {
              if (!ctx) return;
              const osc = ctx.createOscillator();
              const gainNode = ctx.createGain();
              osc.connect(gainNode);
              gainNode.connect(ctx.destination);
              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
              gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
              gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + delay + 0.03);
              gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
              osc.start(ctx.currentTime + delay);
              osc.stop(ctx.currentTime + delay + duration + 0.05);
          };
          buzz(160, 0, 0.12);
          buzz(120, 0.08, 0.2);
      } catch (e) {
          console.warn("Failed to play alert sound", e);
      }
  };

  const playBellChime = (isTest = false) => {
      if (!soundEnabled && !isTest) return;
      try {
          let ctx = audioCtxRef.current;
          if (!ctx) {
              ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              audioCtxRef.current = ctx;
          }
          if (ctx.state === 'suspended') {
              ctx.resume();
          }
          
          const chime = (freq: number, delay: number, duration: number) => {
              if (!ctx) return;
              const osc = ctx.createOscillator();
              const gainNode = ctx.createGain();
              
              osc.connect(gainNode);
              gainNode.connect(ctx.destination);
              
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
              
              gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
              gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + delay + 0.05);
              gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
              
              osc.start(ctx.currentTime + delay);
              osc.stop(ctx.currentTime + delay + duration + 0.1);
          };
          
          // Satisfying triple ring
          chime(523.25, 0, 0.4);      // C5
          chime(659.25, 0.12, 0.4);    // E5
          chime(783.99, 0.24, 0.8);    // G5
      } catch (e) {
          console.warn("Audio Context failed to play sound", e);
      }
  };

  const isFirstLoadRef = useRef<boolean>(true);
  const prevOrderIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
      if (!orders) return;

      // Real-time Order Monitoring Logic
      if (isFirstLoadRef.current) {
          prevOrderIdsRef.current = new Set(orders.map(o => o.id));
          isFirstLoadRef.current = false;
          return;
      }

      let hasNewOrder = false;
      for (const order of orders) {
          if (!prevOrderIdsRef.current.has(order.id)) {
              prevOrderIdsRef.current.add(order.id);
              if (order.status === 'pending' || order.status === 'confirmed') {
                  hasNewOrder = true;
              }
          }
      }

      if (hasNewOrder && soundEnabled) {
          playBellChime();
      }
  }, [orders, soundEnabled]);

  const toggleItemCheck = (orderId: string, itemIdx: number) => {
      playClickSound();
      const key = `${orderId}-${itemIdx}`;
      setCheckedItems(prev => ({...prev, [key]: !prev[key]}));
  };

  const getStatusColor = (status: OrderStatus) => {
      switch(status) {
          case 'pending': return 'bg-red-100 text-red-800 border-red-200 animate-pulse'; // Flashing for new orders
          case 'confirmed': return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Accepted
          case 'acknowledged': return 'bg-blue-100 text-blue-800 border-blue-200'; // Prep
          case 'cooking': return 'bg-orange-100 text-orange-800 border-orange-200'; // Baking
          case 'ready': return 'bg-green-100 text-green-800 border-green-200'; // Done
          case 'completed': return 'bg-gray-100 text-gray-600 border-gray-200';
          default: return 'bg-gray-50';
      }
  };

  const getOrderTypeIcon = (type: Order['type']) => {
      if (type === 'delivery') return <Truck size={16} className="text-brand-600" />;
      if (type === 'online') return <ShoppingBag size={16} className="text-purple-600" />;
      return <Utensils size={16} className="text-blue-600" />;
  };

  const getOrderTypeLabel = (type: string) => {
      if (language === 'th') {
          if (type === 'dinein') return 'ทานที่ร้าน';
          if (type === 'takeaway') return 'กลับบ้าน / Takeaway';
          if (type === 'delivery') return 'จัดส่งเดลิเวอรี่';
          return type;
      }
      if (type === 'dinein') return 'Dine In';
      if (type === 'takeaway') return 'Take Away';
      if (type === 'delivery') return 'Delivery';
      return type;
  };

  const displayOrders = orders.filter(o => o.status !== 'cancelled').filter(o => {
      if (filterType === 'active') return o.status !== 'completed';
      
      const d = new Date(o.createdAt);
      const now = new Date();
      if (filterType === 'today') {
           return d.toDateString() === now.toDateString();
      }
      if (filterType === 'yesterday') {
           const yesterday = new Date(now);
           yesterday.setDate(yesterday.getDate() - 1);
           return d.toDateString() === yesterday.toDateString();
      }
      return true;
  }).sort((a,b) => {
       const priority = { pending: 0, confirmed: 1, acknowledged: 2, cooking: 3, ready: 4, completed: 5, cancelled: 6 };
       if (priority[a.status] !== priority[b.status]) return priority[a.status] - priority[b.status];
       return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="p-6 bg-gray-800 min-h-screen pb-24 text-gray-100 animate-fade-in print:bg-white print:p-0 print:m-0 print:min-h-0 print:pb-0">
      <div className="print:hidden">
      
      {/* Interactive Sound Activation / Browser Autoplay restriction banner */}
      {soundEnabled && !audioUnlocked && (
        <div 
          onClick={initAudio}
          className="mb-6 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-white p-4 rounded-xl flex items-center justify-between shadow-lg cursor-pointer hover:brightness-110 active:scale-[0.99] transition-all border border-amber-400 group animate-pulse"
        >
          <div className="flex items-center gap-3">
            <span className="bg-white/20 p-2 rounded-lg animate-bounce">
              <Bell size={24} className="text-white" />
            </span>
            <div>
              <p className="font-bold text-base md:text-lg">📢 กดที่นี่เพื่อเปิดใช้งานเสียงแจ้งเตือนออเดอร์ใหม่</p>
              <p className="text-xs text-amber-50 font-medium">Click here to enable sound notifications for new orders (Required by browsers)</p>
            </div>
          </div>
          <button className="bg-white text-amber-700 hover:bg-amber-50 px-4 py-2 rounded-lg font-bold text-xs select-none shadow">
            เปิดเสียง (Enable)
          </button>
        </div>
      )}

      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 border-b border-gray-700 pb-4 gap-4">
        <div className="flex-1">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Utensils className="text-brand-500"/> {t('kitchenDisplay')}
            </h1>
            <p className="text-gray-400 text-sm mt-1">{t('realtimeTracking')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
            
            {/* Filter Buttons */}
            <div className="flex gap-2 bg-gray-700 p-1 rounded-lg">
                <button onClick={() => { playClickSound(); setFilterType('active'); }} className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-1 ${filterType === 'active' ? 'bg-brand-600 text-white shadow' : 'text-gray-300 hover:text-white'}`}>
                    {language === 'th' ? 'ออเดอร์ปัจจุบัน' : 'Active'}
                </button>
                <button onClick={() => { playClickSound(); setFilterType('today'); }} className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-1 ${filterType === 'today' ? 'bg-brand-600 text-white shadow' : 'text-gray-300 hover:text-white'}`}>
                    {language === 'th' ? 'วันนี้' : 'Today'}
                </button>
                <button onClick={() => { playClickSound(); setFilterType('yesterday'); }} className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-1 ${filterType === 'yesterday' ? 'bg-brand-600 text-white shadow' : 'text-gray-300 hover:text-white'}`}>
                    {language === 'th' ? 'เมื่อวาน' : 'Yesterday'}
                </button>
            </div>

            {/* Sound Notification Toggle */}
            <button 
                onClick={toggleSound} 
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition border cursor-pointer ${soundEnabled ? 'bg-green-900/30 text-green-400 border-green-700/80 hover:bg-green-900/50' : 'bg-red-900/30 text-red-400 border-red-700/80 hover:bg-red-900/50'}`}
                title={soundEnabled ? (language === 'th' ? "ปิดเสียงแจ้งเตือน" : "Mute alert sounds") : (language === 'th' ? "เปิดเสียงแจ้งเตือน" : "Enable alert sounds")}
            >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                <span>{soundEnabled ? (language === 'th' ? 'เสียงแจ้งเตือน: เปิด' : 'Sound: ON') : (language === 'th' ? 'เสียงแจ้งเตือน: ปิด' : 'Sound: OFF')}</span>
            </button>

            <div className="bg-gray-700 px-4 py-2 rounded-lg shadow-sm border border-gray-600">
                <span className="text-gray-400 text-sm block">{language === 'th' ? 'จำนวนออเดอร์' : 'Orders'}</span>
                <span className="text-2xl font-bold text-brand-400">{displayOrders.length}</span>
            </div>

            {/* Language Switcher */}
            <button 
                onClick={toggleLanguage} 
                className="bg-gray-700 hover:bg-gray-650 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-black transition border border-gray-600 shadow-sm hover:border-gray-500 cursor-pointer active:scale-95"
                title={language === 'th' ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
            >
                <span>🌐 {language === 'en' ? 'EN' : 'ไทย'}</span>
            </button>

            <button 
                onClick={adminLogout} 
                className="bg-gray-700 hover:bg-red-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition border border-gray-600 hover:border-red-700 active:scale-95 cursor-pointer"
            >
                <LogOut size={16} /> {t('logout')}
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayOrders.map(order => (
           <div key={order.id} className={`bg-white rounded-xl shadow-lg border-l-8 flex flex-col overflow-hidden text-gray-900 ${order.status === 'completed' ? 'border-gray-400 opacity-60' : 'border-brand-500'}`}>
              {/* Header */}
              <div className={`p-4 border-b flex justify-between items-start ${order.status === 'pending' ? 'bg-red-50' : 'bg-white'}`}>
                  <div>
                      <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg text-gray-900">#{order.id.slice(-4)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                            {t(order.status as any)}
                          </span>
                      </div>
                      <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                          {order.tableNumber ? (language === 'th' ? `โต๊ะ ${order.tableNumber}` : `Table ${order.tableNumber}`) : order.customerName}
                      </h3>
                      {order.source !== 'store' && (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded font-bold uppercase mt-1">
                              <Bike size={12} /> {order.source}
                          </span>
                      )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                      <div className="flex items-center gap-1 justify-end font-bold text-gray-700"><Clock size={14}/> {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      {order.pickupTime && (
                           <div className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded mt-1 font-bold">
                               {language === 'th' ? 'เวลารับสินค้า' : 'Pickup'}: {order.pickupTime}
                           </div>
                      )}
                      <div className="flex items-center gap-1 mt-2 justify-end font-bold uppercase tracking-wide">
                          {getOrderTypeIcon(order.type)} {getOrderTypeLabel(order.type)}
                      </div>
                      {order.paymentMethod && (
                          <div className="flex items-center gap-1 justify-end text-xs mt-1 text-gray-400">
                              {order.paymentMethod === 'cash' ? <Banknote size={12}/> : <QrCode size={12}/>}
                              {order.paymentMethod === 'cash' ? t('cash') : t('qrTransfer')}
                          </div>
                      )}
                  </div>
              </div>

              {/* Delivery Info Block */}
              {order.type === 'delivery' && (
                  <div className="bg-blue-50 p-3 border-b border-blue-100 space-y-2">
                      <div className="flex items-start gap-2">
                          <MapPin size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                              <p className="text-xs font-bold text-blue-800 uppercase mb-0.5">{t('deliveryAddress')}:</p>
                              <p className="text-sm text-gray-850 leading-snug">
                                  {(order.deliveryAddress || '')
                                      .replace(/\[Phone: .*?\]/g, '')
                                      .replace(/\[GPS Pin: .*?\]/g, '')
                                      .replace(/\[Google Maps Link: .*?\]/g, '')
                                      .trim()
                                  }
                              </p>
                          </div>
                      </div>
                      
                      {/* Interactive metadata annotations decoded for the kitchen */}
                      <div className="pl-6 text-xs space-y-1.5 pt-1.5 border-t border-dashed border-blue-200/60">
                          {parseDeliveryPhone(order.deliveryAddress) && (
                              <div className="flex items-center gap-1.5 font-bold text-gray-700">
                                  <Phone size={13} className="text-blue-600 shrink-0"/>
                                  <span>เบอร์ติดต่อ: {parseDeliveryPhone(order.deliveryAddress)}</span>
                              </div>
                          )}
                          {parseGPSCoordinates(order.deliveryAddress) && (
                              <div className="flex items-center justify-between gap-1.5 font-bold pt-1">
                                  <span className="text-red-700 flex items-center gap-1">📍 ปักหมุดพิกัด GPS เรียบร้อย</span>
                                  <a 
                                      href={parseGPSCoordinates(order.deliveryAddress)?.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-[10px] bg-red-650 hover:bg-red-700 text-white px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1 shadow-sm transition"
                                  >
                                      <Globe size={10}/> เปิดแผนที่นำทาง
                                  </a>
                              </div>
                          )}
                      </div>
                  </div>
              )}

              {/* Items */}
              <div className="p-4 bg-white flex-1 min-h-[150px]">
                  <ul className="space-y-4">
                      {(order.items || []).map((item, idx) => {
                          const name = language === 'th' && item.nameTh ? item.nameTh : item.name;
                          const isChecked = checkedItems[`${order.id}-${idx}`] || false;
                          return (
                          <li key={idx} className={`flex flex-col border-b border-dashed border-gray-100 pb-3 last:border-0 last:pb-0 transition-all ${isChecked ? 'opacity-50 grayscale' : ''}`}>
                              <div className="flex items-start gap-3">
                                  <button onClick={() => toggleItemCheck(order.id, idx)} className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border-2 transition-colors ${isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-transparent hover:border-green-400'}`}>
                                      <CheckCircle size={20} />
                                  </button>
                                  <span className="bg-gray-900 text-white w-8 h-8 flex items-center justify-center rounded-lg text-lg font-bold flex-shrink-0">{item.quantity}</span> 
                                  <div className="flex-1 overflow-hidden" onClick={() => toggleItemCheck(order.id, idx)}>
                                      <span className={`font-bold text-gray-800 text-lg leading-tight block ${isChecked ? 'line-through text-gray-500' : ''}`}>{name}</span>
                                      
                                      {/* Sub Items (Combo Choices) */}
                                      {item.subItems && item.subItems.length > 0 && (
                                          <div className="mt-2.5 pl-3 border-l-4 border-purple-500 bg-purple-50/70 p-2.5 rounded-r-xl space-y-2">
                                              <div className="text-[11px] font-black text-purple-900 uppercase tracking-wider flex items-center gap-1">
                                                  <span>🍱 รายการในเซ็ต / COMBO ITEMS (x{item.subItems.length})</span>
                                              </div>
                                              {item.subItems.map((sub, sIdx) => {
                                                  const subName = sub.nameTh && sub.nameTh !== sub.name ? `${sub.name} / ${sub.nameTh}` : sub.name;
                                                  return (
                                                      <div key={sIdx} className="text-gray-900 text-sm font-bold pl-1.5 border-b border-purple-100/50 pb-1.5 last:border-0 last:pb-0">
                                                          <div className="flex items-start gap-1 font-extrabold text-purple-950">
                                                              <span className="text-purple-600 font-black">↳</span>
                                                              <span>{subName}</span>
                                                          </div>
                                                          {sub.toppings && sub.toppings.length > 0 && (
                                                              <div className="flex flex-wrap gap-1 mt-1.5 pl-3.5">
                                                                  {sub.toppings.map(t => {
                                                                      const isCheeseOrSauce = t.category === 'cheese' || t.category === 'sauce' || t.name.toLowerCase().includes('cheese') || t.nameTh?.includes('ชีส') || t.name.toLowerCase().includes('sauce') || t.nameTh?.includes('ซอส');
                                                                      const icon = t.category === 'cheese' ? '🧀' : t.category === 'sauce' ? '🍅' : t.category === 'meat' ? '🍖' : t.category === 'vegetable' ? '🥦' : '✨';
                                                                      const toppingText = t.nameTh && t.nameTh !== t.name ? `${t.name} / ${t.nameTh}` : t.name;
                                                                      return (
                                                                          <span key={t.id} className={`text-xs font-black px-2 py-1 rounded-md shadow-sm border flex items-center gap-1 ${isCheeseOrSauce ? 'bg-orange-100 text-orange-950 border-orange-300 ring-2 ring-orange-200' : 'bg-amber-50 text-amber-950 border-amber-200'}`}>
                                                                              {icon} {toppingText}
                                                                          </span>
                                                                      );
                                                                  })}
                                                              </div>
                                                          )}
                                                      </div>
                                                  );
                                              })}
                                          </div>
                                      )}

                                      {/* Standard Toppings */}
                                      {(item.selectedToppings || []).length > 0 && (
                                        <div className="mt-2.5 pl-3 border-l-4 border-amber-500 bg-amber-50/70 p-2.5 rounded-r-xl space-y-1.5">
                                            <div className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                                                <span>➕ เพิ่มท็อปปิ้งพิเศษ / EXTRA ADD-ONS (x{item.selectedToppings.length})</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(item.selectedToppings || []).map(t => {
                                                    const isCheeseOrSauce = t.category === 'cheese' || t.category === 'sauce' || t.name.toLowerCase().includes('cheese') || t.nameTh?.includes('ชีส') || t.name.toLowerCase().includes('sauce') || t.nameTh?.includes('ซอส');
                                                    const icon = t.category === 'cheese' ? '🧀' : t.category === 'sauce' ? '🍅' : t.category === 'meat' ? '🍖' : t.category === 'vegetable' ? '🥦' : '✨';
                                                    const toppingText = t.nameTh && t.nameTh !== t.name ? `${t.name} / ${t.nameTh}` : t.name;
                                                    return (
                                                        <span key={t.id} className={`text-sm font-black px-2.5 py-1.5 rounded-lg shadow-sm border flex items-center gap-1.5 ${isCheeseOrSauce ? 'bg-orange-100 text-orange-950 border-orange-300 ring-2 ring-orange-200 animate-pulse' : 'bg-amber-100 text-amber-950 border-amber-300'}`}>
                                                            {icon} {toppingText}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                      )}
                                      
                                      {/* Special Instructions */}
                                      {item.specialInstructions && (
                                          <div className="mt-2.5 text-red-900 bg-gradient-to-r from-red-50 to-red-100/80 border-2 border-red-500 rounded-xl px-3 py-2.5 text-sm md:text-base font-extrabold flex items-center gap-2.5 animate-pulse w-full shadow-md">
                                              <span className="px-2 py-1 bg-red-600 text-white rounded-md text-xs shrink-0 font-black uppercase tracking-wider shadow">🚨 พิเศษ / SPECIAL REQUEST</span>
                                              <span className="break-words font-black text-red-950 text-left">"{item.specialInstructions}"</span>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </li>
                      )})}
                  </ul>
                  {order.note && (
                      <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 italic font-medium">
                          {language === 'th' ? 'หมายเหตุ' : 'Note'}: "{order.note}"
                      </div>
                  )}
              </div>

              {/* Actions */}
              <div className="p-4 border-t bg-gray-50 flex items-center justify-between gap-2">
                <button 
                    onClick={() => { playSuccessFeedback(); handlePrintOrder(order); }} 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-750 px-3 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs print:hidden"
                    title={language === 'th' ? 'พิมพ์ใบครัว' : 'Print Receipt'}
                >
                    <Printer size={14} />
                    <span>{language === 'th' ? 'พิมพ์ใบครัว' : 'Print'}</span>
                </button>

                <div className="flex gap-2 flex-1 justify-end items-center">
                    {order.status === 'pending' && (
                        <>
                            <button onClick={() => { playAlertSound(); updateOrderStatus(order.id, 'cancelled'); }} className="px-2 py-2 text-red-650 hover:bg-red-50 rounded font-semibold text-xs transition">{t('reject')}</button>
                            <button onClick={() => { playSuccessFeedback(); updateOrderStatus(order.id, 'confirmed'); }} className="bg-brand-600 text-white px-3 py-2 rounded-lg shadow hover:bg-brand-700 font-bold text-xs flex items-center justify-center gap-1 transition">
                                <Bell size={14} /> {t('confirm')}
                            </button>
                        </>
                    )}
                    {order.status === 'confirmed' && (
                        <button onClick={() => { playSuccessFeedback(); updateOrderStatus(order.id, 'acknowledged'); }} className="w-full max-w-[140px] bg-blue-600 text-white px-3 py-2 rounded-lg shadow hover:bg-blue-700 font-bold text-xs flex items-center justify-center gap-1 transition">
                            <ChefHat size={14} /> {t('acknowledged')}
                        </button>
                    )}
                    {order.status === 'acknowledged' && (
                        <button onClick={() => { playSuccessFeedback(); updateOrderStatus(order.id, 'cooking'); }} className="w-full max-w-[140px] bg-orange-500 text-white px-3 py-2 rounded-lg shadow hover:bg-orange-600 font-bold text-xs flex items-center justify-center gap-1 transition">
                            <Flame size={14} /> {t('startCooking')}
                        </button>
                    )}
                    {order.status === 'cooking' && (
                        <button onClick={() => { playSuccessFeedback(); updateOrderStatus(order.id, 'ready'); }} className="w-full max-w-[140px] bg-green-500 text-white px-3 py-2 rounded-lg shadow hover:bg-green-600 font-bold text-xs flex items-center justify-center gap-1 transition">
                            <CheckCircle size={14} /> {t('markReady')}
                        </button>
                    )}
                    {order.status === 'ready' && (
                        <div className="w-full max-w-[160px] bg-green-100 text-green-800 px-2 py-1.5 rounded-lg font-bold text-center border border-green-200 text-[10px]">
                            {t('ready')} - {language === 'th' ? 'รอเสิร์ฟ / จัดส่ง' : 'Waiting for Server'}
                        </div>
                    )}
                    {order.status === 'completed' && (
                        <span className="text-gray-400 text-xs font-semibold py-1">{t('completed')}</span>
                    )}
                </div>
              </div>
           </div>
        ))}
      </div>
    </div>

    {/* --- PRINTABLE KITCHEN CHIT --- */}
    <style dangerouslySetInnerHTML={{ __html: `
        @media print {
            @page {
                size: ${paperSize === '58mm' ? '58mm' : '80mm'} auto !important;
                margin: 0mm !important;
            }
            html, body {
                width: ${paperSize === '58mm' ? '58mm' : '80mm'} !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .printable-area {
                width: ${paperSize === '58mm' ? '58mm' : '80mm'} !important;
                padding: ${paperSize === '58mm' ? '1mm' : '2mm'} !important;
            }
        }
    ` }} />

    <div className={`hidden print:block printable-area ${paperSize === '58mm' ? 'print:w-[58mm]' : 'print:w-[80mm]'} print:font-mono p-0 m-0 bg-white text-black leading-snug`}>
        {printOrder && (
            <div className={`${paperSize === '58mm' ? 'w-[58mm] text-[10.5px]' : 'w-[80mm] text-[12px]'} overflow-hidden`}>
                <div className="text-center font-bold">
                    <div>{paperSize === '58mm' ? '=============================' : '========================================'}</div>
                    <div className={`${paperSize === '58mm' ? 'text-[11px]' : 'text-[12px]'} font-black uppercase my-1`}>KITCHEN TICKET</div>
                    <div>ใบสั่งอาหาร / ครัว</div>
                    <div>{paperSize === '58mm' ? '=============================' : '========================================'}</div>
                    <div className={`${paperSize === '58mm' ? 'text-[13px]' : 'text-[15px]'} font-black my-1`}>
                        {printOrder.tableNumber ? (language === 'th' ? `โต๊ะ ${printOrder.tableNumber}` : `Table ${printOrder.tableNumber}`) : (printOrder.type === 'delivery' ? `DELIVERY` : `TAKE AWAY`)}
                    </div>
                    {printOrder.customerName && !printOrder.tableNumber && (
                        <div className="text-[11px] font-extrabold my-0.5">ลูกค้า: {printOrder.customerName}</div>
                    )}
                    <div>{paperSize === '58mm' ? '-----------------------------' : '----------------------------------------'}</div>
                </div>

                <div className="mt-1 mb-1 px-1 font-bold">
                    <div className="flex justify-between">
                        <span>บิล: #{printOrder.id.slice(-4)}</span>
                        <span>วันที่: {new Date(printOrder.createdAt).toLocaleDateString('th-TH')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>ช่องทาง: {printOrder.source.toUpperCase()}</span>
                        <span>เวลา: {new Date(printOrder.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    {printOrder.pickupTime && (
                        <div className="font-bold">
                            เวลารับ: {printOrder.pickupTime}
                        </div>
                    )}
                    {printOrder.deliveryPlatformRef && (
                        <div className="font-bold mt-1 text-[11px] bg-gray-150 p-1">
                            Ref: {printOrder.deliveryPlatformRef}
                        </div>
                    )}
                </div>

                <div className="text-center font-bold">{paperSize === '58mm' ? '-----------------------------' : '----------------------------------------'}</div>
                <div className="px-1 font-bold">
                    {(printOrder.items || []).map((item, i) => {
                        const name = language === 'th' && item.nameTh ? item.nameTh : item.name;
                        return (
                            <div key={i} className="mb-2 pb-1 border-b border-dashed border-gray-300 last:border-0 last:mb-0">
                                <div className="flex justify-between items-start font-black text-black">
                                    <span className={`${paperSize === '58mm' ? 'text-[11px]' : 'text-[12px]'}`}>[{item.quantity}x] {name}</span>
                                </div>
                                
                                {/* Combo choices */}
                                {item.subItems && item.subItems.length > 0 && (
                                    <div className="pl-2 mt-1 text-[9px] space-y-0.5">
                                        {item.subItems.map((sub, sIdx) => {
                                            const subName = sub.nameTh && sub.nameTh !== sub.name ? `${sub.name} (${sub.nameTh})` : sub.name;
                                            return (
                                                <div key={sIdx} className="font-black">
                                                    ↳ [เซ็ต] {subName}
                                                    {sub.toppings && sub.toppings.length > 0 && (
                                                        <div className="pl-3 text-[8px] font-bold italic text-gray-700">
                                                            {sub.toppings.map(t => t.nameTh && t.nameTh !== t.name ? `${t.name} (${t.nameTh})` : t.name).join(', ')}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Toppings */}
                                {item.selectedToppings && item.selectedToppings.length > 0 && (
                                    <div className="pl-2 mt-1 text-[9px] space-y-0.5">
                                        {item.selectedToppings.map((t, tIdx) => {
                                            const toppingName = t.nameTh && t.nameTh !== t.name ? `${t.name} (${t.nameTh})` : t.name;
                                            return (
                                                <div key={tIdx} className="font-bold">
                                                    * [บวกเพิ่ม] {toppingName}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Special Instructions */}
                                {item.specialInstructions && (
                                    <div className="mt-1 pl-1 border-l border-black text-[9px] font-black bg-gray-100 p-0.5 leading-normal">
                                        ⚠️ พิเศษ: "{item.specialInstructions}"
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {printOrder.note && (
                    <div className="my-2 p-1 border border-black text-black leading-normal">
                        <div className="text-[9px] font-black">📝 หมายเหตุ:</div>
                        <div className="text-[9.5px] font-black mt-0.5">"{printOrder.note}"</div>
                    </div>
                )}

                <div className="text-center font-bold">{paperSize === '58mm' ? '=============================' : '========================================'}</div>
                <div className="text-center text-[9px] mt-1 mb-2 font-bold font-mono">
                    Damac Pizza Kitchen
                </div>
            </div>
        )}
    </div>
    </div>
  );
};
