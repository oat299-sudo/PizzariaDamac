
import React from 'react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus } from '../types';
import { CheckCircle, Clock, Utensils, Bell, MapPin, Truck, ShoppingBag, Banknote, QrCode, ChefHat, Flame, LogOut, Bike } from 'lucide-react';

export const KitchenView: React.FC = () => {
  const { orders, updateOrderStatus, adminLogout, t, language } = useStore();

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

  // Filter out completed for the main board to keep it clean, or keep them at bottom
  const activeOrders = orders.filter(o => o.status !== 'cancelled').sort((a,b) => {
       // Sort by status priority then time
       const priority = { pending: 0, confirmed: 1, acknowledged: 2, cooking: 3, ready: 4, completed: 5, cancelled: 6 };
       if (priority[a.status] !== priority[b.status]) return priority[a.status] - priority[b.status];
       return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="p-6 bg-gray-800 min-h-screen pb-24 text-gray-100">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-700 pb-4 gap-4">
        <div className="flex-1">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Utensils className="text-brand-500"/> {t('kitchenDisplay')}
            </h1>
            <p className="text-gray-400 text-sm mt-1">{t('realtimeTracking')}</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="bg-gray-700 px-4 py-2 rounded-lg shadow-sm border border-gray-600">
                <span className="text-gray-400 text-sm block">{t('active')}</span>
                <span className="text-2xl font-bold text-brand-400">{activeOrders.filter(o => o.status !== 'completed').length}</span>
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
        {activeOrders.map(order => (
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
                      {order.items.map((item, idx) => {
                          const name = language === 'th' && item.nameTh ? item.nameTh : item.name;
                          return (
                          <li key={idx} className="flex flex-col border-b border-dashed border-gray-100 pb-3 last:border-0 last:pb-0">
                              <div className="flex items-start gap-3">
                                  <span className="bg-gray-900 text-white w-8 h-8 flex items-center justify-center rounded-lg text-lg font-bold flex-shrink-0">{item.quantity}</span> 
                                  <div>
                                      <span className="font-bold text-gray-800 text-lg leading-tight block">{name}</span>
                                      {item.selectedToppings.length > 0 && (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {item.selectedToppings.map(t => (
                                                <span key={t.id} className="text-sm font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                                                    + {language === 'th' && t.nameTh ? t.nameTh : t.name}
                                                </span>
                                            ))}
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
