
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus } from '../types';
import { CheckCircle, Clock, Utensils, Bell, MapPin, Truck, ShoppingBag, Banknote, QrCode, ChefHat, Flame, LogOut, Bike, Layers, History, Calendar, Volume2, VolumeX } from 'lucide-react';

export const KitchenView: React.FC = () => {
  const { orders, updateOrderStatus, adminLogout, t, language } = useStore();
  const [filterType, setFilterType] = useState<'active' | 'today' | 'yesterday'>('active');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  
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

  const prevOrderIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
      if (!orders || orders.length === 0) return;

      // Initialize on load to avoid chiming for older items currently loaded
      if (prevOrderIdsRef.current.size === 0) {
          prevOrderIdsRef.current = new Set(orders.map(o => o.id));
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
    <div className="p-6 bg-gray-800 min-h-screen pb-24 text-gray-100 animate-fade-in">
      
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

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-700 pb-4 gap-4">
        <div className="flex-1">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Utensils className="text-brand-500"/> {t('kitchenDisplay')}
            </h1>
            <p className="text-gray-400 text-sm mt-1">{t('realtimeTracking')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            
            {/* Filter Buttons */}
            <div className="flex gap-2 bg-gray-700 p-1 rounded-lg">
                <button onClick={() => setFilterType('active')} className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-1 ${filterType === 'active' ? 'bg-brand-600 text-white shadow' : 'text-gray-300 hover:text-white'}`}>
                    Active
                </button>
                <button onClick={() => setFilterType('today')} className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-1 ${filterType === 'today' ? 'bg-brand-600 text-white shadow' : 'text-gray-300 hover:text-white'}`}>
                    Today
                </button>
                <button onClick={() => setFilterType('yesterday')} className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-1 ${filterType === 'yesterday' ? 'bg-brand-600 text-white shadow' : 'text-gray-300 hover:text-white'}`}>
                    Yesterday
                </button>
            </div>

            {/* Sound Notification Toggle */}
            <button 
                onClick={toggleSound} 
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition border cursor-pointer ${soundEnabled ? 'bg-green-900/30 text-green-400 border-green-700/80 hover:bg-green-900/50' : 'bg-red-900/30 text-red-400 border-red-700/80 hover:bg-red-900/50'}`}
                title={soundEnabled ? "Mute alert sounds" : "Enable alert sounds"}
            >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                <span>{soundEnabled ? "Sound: ON" : "Sound: OFF"}</span>
            </button>

            <div className="bg-gray-700 px-4 py-2 rounded-lg shadow-sm border border-gray-600">
                <span className="text-gray-400 text-sm block">Orders</span>
                <span className="text-2xl font-bold text-brand-400">{displayOrders.length}</span>
            </div>
            <button 
                onClick={adminLogout} 
                className="bg-gray-700 hover:bg-red-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition border border-gray-600 hover:border-red-700"
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
                          {order.tableNumber ? `Table ${order.tableNumber}` : order.customerName}
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
                           <div className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded mt-1 font-bold">Pickup: {order.pickupTime}</div>
                      )}
                      <div className="flex items-center gap-1 mt-2 justify-end font-bold uppercase tracking-wide">
                          {getOrderTypeIcon(order.type)} {order.type}
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
                  <div className="bg-blue-50 p-3 border-b border-blue-100 flex items-start gap-2">
                      <MapPin size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                          <p className="text-xs font-bold text-blue-800 uppercase mb-0.5">{t('deliveryAddress')}:</p>
                          <p className="text-sm text-gray-800 leading-snug">{order.deliveryAddress}</p>
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
                                          <div className="mt-2 pl-3 border-l-4 border-brand-200 space-y-1">
                                              {item.subItems.map((sub, sIdx) => (
                                                  <div key={sIdx} className="text-gray-700 text-sm font-semibold flex items-start gap-1">
                                                      <span className="text-brand-500">•</span>
                                                      <div>
                                                          {language === 'th' && sub.nameTh ? sub.nameTh : sub.name}
                                                          {sub.toppings && sub.toppings.length > 0 && (
                                                              <div className="flex flex-wrap gap-1 mt-0.5">
                                                                  {sub.toppings.map(t => (
                                                                      <span key={t.id} className="text-xs text-brand-700 bg-brand-50 px-1 rounded border border-brand-100">
                                                                          + {language === 'th' && t.nameTh ? t.nameTh : t.name}
                                                                      </span>
                                                                  ))}
                                                              </div>
                                                          )}
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      )}

                                      {/* Standard Toppings */}
                                      {(item.selectedToppings || []).length > 0 && (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {(item.selectedToppings || []).map(t => (
                                                <span key={t.id} className="text-sm font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                                                    + {language === 'th' && t.nameTh ? t.nameTh : t.name}
                                                </span>
                                            ))}
                                        </div>
                                      )}
                                      
                                      {/* Special Instructions */}
                                      {item.specialInstructions && (
                                          <div className="mt-1 text-red-600 font-bold text-sm bg-red-50 p-1 rounded inline-block">
                                              ** {item.specialInstructions}
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </li>
                      )})}
                  </ul>
                  {order.note && (
                      <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 italic font-medium">
                          Note: "{order.note}"
                      </div>
                  )}
              </div>

              {/* Actions */}
              <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                {order.status === 'pending' && (
                    <>
                        <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded font-semibold text-sm">{t('reject')}</button>
                        <button onClick={() => updateOrderStatus(order.id, 'confirmed')} className="flex-1 bg-brand-600 text-white px-4 py-3 rounded-lg shadow hover:bg-brand-700 font-bold text-lg flex items-center justify-center gap-2 animate-bounce-short">
                            <Bell size={20} /> {t('confirm')}
                        </button>
                    </>
                )}
                {order.status === 'confirmed' && (
                    <button onClick={() => updateOrderStatus(order.id, 'acknowledged')} className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg shadow hover:bg-blue-700 font-bold text-lg flex items-center justify-center gap-2">
                        <ChefHat size={20} /> {t('acknowledged')}
                    </button>
                )}
                {order.status === 'acknowledged' && (
                    <button onClick={() => updateOrderStatus(order.id, 'cooking')} className="flex-1 bg-orange-500 text-white px-4 py-3 rounded-lg shadow hover:bg-orange-600 font-bold text-lg flex items-center justify-center gap-2">
                        <Flame size={20} /> {t('startCooking')}
                    </button>
                )}
                {order.status === 'cooking' && (
                    <button onClick={() => updateOrderStatus(order.id, 'ready')} className="flex-1 bg-green-500 text-white px-4 py-3 rounded-lg shadow hover:bg-green-600 font-bold text-lg flex items-center justify-center gap-2">
                        <CheckCircle size={20} /> {t('markReady')}
                    </button>
                )}
                {order.status === 'ready' && (
                    <div className="flex-1 bg-green-100 text-green-800 px-4 py-3 rounded-lg font-bold text-center border border-green-200">
                        {t('ready')} - Waiting for Server
                    </div>
                )}
                 {order.status === 'completed' && (
                    <span className="text-gray-400 text-sm font-medium w-full text-center py-2">{t('completed')}</span>
                )}
              </div>
           </div>
        ))}
      </div>
    </div>
  );
};
