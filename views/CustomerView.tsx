
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Pizza, CartItem, Topping, PaymentMethod, ProductCategory } from '../types';
import { INITIAL_TOPPINGS, DELIVERY_ZONES, CATEGORIES } from '../constants';
import { ShoppingCart, Plus, X, User, ChefHat, Sparkles, MapPin, Truck, Clock, Banknote, QrCode, ShoppingBag, Star, ExternalLink, Heart, History, Gift, ArrowRight, ArrowLeft } from 'lucide-react';
import { getPizzaRecommendation } from '../services/geminiService';

export const CustomerView: React.FC = () => {
  const { menu, addToCart, cart, cartTotal, customer, setCustomer, placeOrder, removeFromCart, navigateTo, addToFavorites, orders, reorderItem, claimReward, shopLogo } = useStore();
  const [selectedPizza, setSelectedPizza] = useState<Pizza | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showTracker, setShowTracker] = useState(false);
  
  // Category State
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('promotion');
  
  // Registration State
  const [regName, setRegName] = useState(customer?.name || '');
  const [regPhone, setRegPhone] = useState(customer?.phone || '');
  const [regFav, setRegFav] = useState(customer?.favoritePizza || '');
  const [regAddress, setRegAddress] = useState(customer?.address || '');
  const [regBirthday, setRegBirthday] = useState(customer?.birthday || '');

  // Delivery / Checkout State
  const [orderType, setOrderType] = useState<'online' | 'delivery'>('online');
  const [selectedZoneId, setSelectedZoneId] = useState<string>(DELIVERY_ZONES[0].id);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qr_transfer');
  const [pickupTime, setPickupTime] = useState('');

  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  
  // Custom Pizza Name State
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    if (customer?.address) {
      setDeliveryAddress(customer.address);
    }
  }, [customer]);

  const handleCustomize = (pizza: Pizza) => {
    if (!pizza.available) return;
    setSelectedPizza(pizza);
    setSelectedToppings([]);
    setCustomName('');
  };

  const toggleTopping = (topping: Topping) => {
    if (selectedToppings.find(t => t.id === topping.id)) {
      setSelectedToppings(prev => prev.filter(t => t.id !== topping.id));
    } else {
      setSelectedToppings(prev => [...prev, topping]);
    }
  };

  const handleAddToCart = () => {
    if (!selectedPizza) return;
    const toppingsPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
    
    // Ensure custom pizzas have a name
    let finalName = selectedPizza.name;
    if (selectedPizza.name === "Create Your Own Pizza") {
        finalName = customName ? `Custom: ${customName}` : "Custom Pizza";
    }

    const item: CartItem = {
      id: Date.now().toString() + Math.random().toString(),
      pizzaId: selectedPizza.id,
      name: finalName,
      basePrice: selectedPizza.basePrice,
      selectedToppings: selectedToppings,
      quantity: 1,
      totalPrice: selectedPizza.basePrice + toppingsPrice
    };
    addToCart(item);
    setSelectedPizza(null);
    setSelectedToppings([]);
  };

  const handleSaveFavorite = () => {
      if (!selectedPizza) return;
      
      if (!customer) {
          alert("Please register or login to save favorites!");
          setShowRegister(true);
          return;
      }

      let name = customName;
      if (!name) {
          if (selectedPizza.name === "Create Your Own Pizza") {
              name = "My Custom Pizza";
          } else {
              name = selectedPizza.name + (selectedToppings.length > 0 ? " (Custom)" : "");
          }
      }
      
      addToFavorites(name, selectedPizza.id, selectedToppings);
      alert("Saved to Favorites!");
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regName && regPhone) {
      setCustomer({ 
        name: regName, 
        phone: regPhone, 
        favoritePizza: regFav,
        address: regAddress,
        birthday: regBirthday,
        tier: 'Bronze', // Default tier
        loyaltyPoints: customer?.loyaltyPoints || 0,
        savedFavorites: customer?.savedFavorites || [],
        orderHistory: customer?.orderHistory || []
      });
      setShowRegister(false);
    }
  };

  const handlePlaceOrder = () => {
    const commonDetails = {
       paymentMethod,
       pickupTime: orderType === 'online' ? (pickupTime || 'ASAP') : undefined
    };

    let success = false;
    if (orderType === 'delivery') {
      const zone = DELIVERY_ZONES.find(z => z.id === selectedZoneId);
      if (!deliveryAddress) {
        alert("Please enter a delivery address");
        return;
      }
      success = placeOrder('delivery', {
        ...commonDetails,
        delivery: {
            address: deliveryAddress,
            zoneName: zone?.name || 'Standard',
            fee: zone?.fee || 0
        }
      });
    } else {
      success = placeOrder('online', commonDetails);
    }

    if (success) {
        setIsCartOpen(false);
        setShowReviewModal(true);
    }
  };

  const handleClaimReward = () => {
      if (claimReward()) {
          setIsCartOpen(true);
          // Trigger confetti logic ideally, but alert is fine for now
      }
  };

  const askAiChef = async () => {
    if (!aiPrompt.trim()) return;
    setIsThinking(true);
    setAiRecommendation('');
    const result = await getPizzaRecommendation(aiPrompt, menu);
    setAiRecommendation(result);
    setIsThinking(false);
  };

  // Filter Menu
  const filteredMenu = menu.filter(item => {
    const cat = item.category || 'pizza';
    return cat === activeCategory;
  });

  const deliveryFee = orderType === 'delivery' ? (DELIVERY_ZONES.find(z => z.id === selectedZoneId)?.fee || 0) : 0;
  const finalTotal = cartTotal + deliveryFee;

  // Active Orders for Tracker
  const activeOrders = orders.filter(o => 
      customer && o.customerPhone === customer.phone && 
      o.status !== 'completed' && o.status !== 'cancelled'
  );

  return (
    <div className="pb-24 max-w-4xl mx-auto bg-gray-50 min-h-screen shadow-2xl flex flex-col relative overflow-hidden">
      {/* Mobile Header */}
      <header className="bg-brand-600 text-white p-4 sticky top-0 z-20 shadow-md flex justify-between items-center h-16">
        <div onClick={() => setShowTracker(true)} className="cursor-pointer flex items-center gap-2">
           {shopLogo ? (
               <img src={shopLogo} alt="Pizza Damac" className="h-10 w-auto rounded-md bg-white p-0.5 object-contain" />
           ) : (
               <div>
                   <h1 className="text-xl font-bold font-serif tracking-wide">Pizza Damac</h1>
                   <p className="text-[10px] uppercase tracking-wider opacity-90">Nonthaburi • Authentic Italian</p>
               </div>
           )}
        </div>
        <div className="flex gap-3 items-center">
            {activeOrders.length > 0 && (
                <button onClick={() => setShowTracker(true)} className="p-2 bg-green-500 rounded-full animate-pulse shadow-lg text-white">
                    <Clock size={20} />
                </button>
            )}
             <button onClick={() => setShowAiModal(true)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition backdrop-blur-sm">
                <ChefHat size={20} />
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 bg-white/10 rounded-full hover:bg-white/20 transition backdrop-blur-sm">
              <ShoppingCart size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {cart.length}
                </span>
              )}
            </button>
        </div>
      </header>

      {/* Profile & Loyalty Bar */}
      <div className="p-4 bg-white border-b border-gray-100 cursor-pointer" onClick={() => customer ? setShowProfile(true) : setShowRegister(true)}>
        {customer ? (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-brand-100 p-2 rounded-full text-brand-600"><User size={20}/></div>
                <div>
                    <span className="text-gray-900 font-bold block leading-tight">{customer.name}</span>
                    <span className="text-xs text-brand-600 font-medium">
                        {customer.loyaltyPoints} Points • {(customer.loyaltyPoints / 10) * 100}% to Free Pizza
                    </span>
                </div>
            </div>
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500" style={{ width: `${Math.min((customer.loyaltyPoints / 10) * 100, 100)}%` }}></div>
            </div>
          </div>
        ) : (
          <div className="bg-brand-50 p-3 rounded-lg border border-brand-100 flex items-center justify-between">
             <span className="text-brand-800 font-medium text-sm">Tap to Login / Register</span>
             <User size={16} className="text-brand-600"/>
          </div>
        )}
      </div>

      {/* Category Navigation */}
      <div className="bg-white px-4 pt-2 pb-4 overflow-x-auto scrollbar-hide border-b border-gray-100 sticky top-16 z-10 shadow-sm">
         <div className="flex gap-2">
            {CATEGORIES.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
                        activeCategory === cat.id 
                        ? 'bg-gray-900 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {cat.id === 'promotion' && <Sparkles size={14} className="text-yellow-400" />}
                    {cat.label}
                </button>
            ))}
         </div>
      </div>

      {/* Promotion Banner */}
      {activeCategory === 'promotion' && (
          <div className="p-4 pb-0 animate-fade-in">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="relative z-10">
                      <h2 className="text-2xl font-bold mb-1">Combo of the Month</h2>
                      <p className="text-white/90 text-sm mb-4">Get the Family Set and save 20%!</p>
                      <button onClick={() => {}} className="bg-white text-brand-600 px-4 py-2 rounded-full font-bold text-sm shadow-md">
                          Order Now
                      </button>
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-white/10 -skew-x-12"></div>
                  <Sparkles className="absolute top-4 right-4 text-yellow-300 animate-pulse" />
              </div>
          </div>
      )}

      {/* Menu Grid */}
      <main className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
        {filteredMenu.length === 0 ? (
             <div className="text-center py-12 text-gray-400 col-span-full">
                 <p>No items in this category yet.</p>
             </div>
        ) : (
            filteredMenu.map(item => (
            <div 
                key={item.id} 
                onClick={() => handleCustomize(item)}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 flex overflow-hidden h-32 md:h-auto md:flex-col cursor-pointer active:scale-95 transition hover:shadow-md ${!item.available ? 'opacity-60 grayscale' : ''}`}
            >
                <div className="w-32 md:w-full md:h-48 h-full relative flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    {!item.available && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-xs font-bold bg-red-600 px-2 py-1 rounded">SOLD OUT</span>
                        </div>
                    )}
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-800 leading-tight">{item.name}</h3>
                        <span className="text-brand-600 font-bold text-sm">฿{item.basePrice}</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">{item.description}</p>
                </div>
                {item.available && <span className="text-xs font-bold text-brand-600 flex items-center gap-1 self-end bg-brand-50 px-2 py-1 rounded-full mt-2"><Plus size={12}/> ADD</span>}
                </div>
            </div>
            ))
        )}
      </main>

      {/* Staff Access Footer */}
      <footer className="p-6 text-center text-gray-400 text-xs mt-4 pb-20 border-t border-gray-100 bg-white">
        <p className="mb-2">© 2024 Pizza Damac Nonthaburi</p>
        <div className="flex justify-center gap-4 opacity-50 hover:opacity-100 transition duration-200">
            <button onClick={() => navigateTo('kitchen')} className="hover:text-brand-600 underline flex items-center gap-1">
                <ChefHat size={12} /> Kitchen
            </button>
            <span className="text-gray-300">|</span>
            <button onClick={() => navigateTo('pos')} className="hover:text-brand-600 underline flex items-center gap-1">
                <Banknote size={12} /> POS System
            </button>
        </div>
      </footer>

      {/* Profile Slide-over */}
      {showProfile && customer && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-start">
              <div className="bg-white w-full max-w-sm h-full shadow-2xl overflow-y-auto animate-slide-in-left p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">My Profile</h2>
                      <button onClick={() => setShowProfile(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
                  </div>
                  
                  {/* Loyalty Card */}
                  <div className="bg-brand-600 text-white p-6 rounded-2xl shadow-lg mb-8 relative overflow-hidden">
                      <div className="relative z-10">
                          <div className="flex justify-between items-start">
                              <p className="text-brand-100 text-sm font-medium mb-1">Pizza Damac Rewards</p>
                              <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase border border-white/30">{customer.tier || 'Bronze'} Member</span>
                          </div>
                          <h3 className="text-3xl font-bold mb-4">{customer.loyaltyPoints} <span className="text-lg font-normal">Points</span></h3>
                          <div className="w-full bg-black/20 rounded-full h-2 mb-2">
                              <div className="bg-yellow-400 h-2 rounded-full transition-all duration-1000" style={{width: `${Math.min((customer.loyaltyPoints / 10) * 100, 100)}%`}}></div>
                          </div>
                          <p className="text-xs text-brand-100 flex justify-between">
                              <span>{customer.loyaltyPoints} / 10 Pizzas</span>
                              <span>{Math.max(0, 10 - customer.loyaltyPoints)} to go</span>
                          </p>
                          
                          {customer.loyaltyPoints >= 10 && (
                             <button 
                                onClick={handleClaimReward}
                                className="mt-4 w-full bg-white text-brand-600 font-bold py-2 rounded-lg shadow flex items-center justify-center gap-2 animate-bounce-short"
                             >
                                <Gift size={16} /> Claim Free Pizza
                             </button>
                          )}
                      </div>
                      <Sparkles className="absolute -top-4 -right-4 text-white/10 w-32 h-32" />
                  </div>

                  {/* Favorites */}
                  <div className="mb-8">
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Heart size={18} className="text-red-500" /> Saved Favorites</h3>
                      {(!customer.savedFavorites || customer.savedFavorites.length === 0) ? (
                          <p className="text-gray-400 text-sm">No saved pizzas yet.</p>
                      ) : (
                          <div className="space-y-3">
                              {customer.savedFavorites.map(fav => (
                                  <div key={fav.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center">
                                      <div>
                                          <p className="font-bold text-sm">{fav.name}</p>
                                          <p className="text-xs text-gray-500">{fav.toppings.length} toppings</p>
                                      </div>
                                      <button 
                                        onClick={() => {
                                            // Reconstruct cart item from favorite
                                            const pizza = menu.find(p => p.id === fav.pizzaId);
                                            if(pizza) {
                                                const price = pizza.basePrice + fav.toppings.reduce((s,t) => s + t.price, 0);
                                                addToCart({
                                                    id: Date.now().toString(),
                                                    pizzaId: pizza.id,
                                                    name: fav.name,
                                                    basePrice: pizza.basePrice,
                                                    selectedToppings: fav.toppings,
                                                    quantity: 1,
                                                    totalPrice: price
                                                });
                                                alert("Added to cart!");
                                                setIsCartOpen(true);
                                                setShowProfile(false);
                                            }
                                        }}
                                        className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-full font-bold"
                                      >
                                          Order
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  {/* History */}
                  <div>
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><History size={18} className="text-blue-500" /> Recent Orders</h3>
                      {(!customer.orderHistory || customer.orderHistory.length === 0) ? (
                          <p className="text-gray-400 text-sm">No past orders.</p>
                      ) : (
                          <div className="space-y-3">
                              {customer.orderHistory.slice(0, 5).map(orderId => {
                                  const order = orders.find(o => o.id === orderId);
                                  if (!order) return null;
                                  return (
                                      <div key={orderId} className="bg-white border border-gray-100 shadow-sm p-3 rounded-lg">
                                          <div className="flex justify-between items-start mb-2">
                                              <div>
                                                  <span className="text-xs text-gray-400 block">{new Date(order.createdAt).toLocaleDateString()}</span>
                                                  <span className="font-bold text-gray-800 text-sm">฿{order.totalAmount}</span>
                                              </div>
                                              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 uppercase">{order.status}</span>
                                          </div>
                                          <button 
                                            onClick={() => { reorderItem(order.id); setIsCartOpen(true); setShowProfile(false); }}
                                            className="w-full text-center text-xs text-brand-600 font-bold border border-brand-100 py-1.5 rounded hover:bg-brand-50"
                                          >
                                              Reorder Again
                                          </button>
                                      </div>
                                  )
                              })}
                          </div>
                      )}
                  </div>
                  
                  <button onClick={() => { setCustomer({ ...customer, name: '', phone: '' } as any); window.location.reload(); }} className="mt-8 text-center w-full text-gray-400 text-xs underline">
                      Log Out
                  </button>
              </div>
          </div>
      )}

      {/* Order Tracker */}
      {showTracker && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col animate-fade-in">
              <div className="p-4 border-b flex items-center gap-4 bg-gray-900 text-white">
                  <button onClick={() => setShowTracker(false)}><ArrowLeft /></button>
                  <h2 className="font-bold text-lg">Order Tracker</h2>
              </div>
              <div className="flex-1 bg-gray-50 p-4 overflow-y-auto">
                  {activeOrders.length === 0 ? (
                      <div className="text-center mt-20 text-gray-500">
                          <Clock size={48} className="mx-auto mb-4 opacity-20"/>
                          <p>No active orders right now.</p>
                      </div>
                  ) : (
                      <div className="space-y-6">
                          {activeOrders.map(order => {
                              const steps = ['confirmed', 'acknowledged', 'cooking', 'ready'];
                              const currentStepIndex = steps.indexOf(order.status) === -1 ? 0 : steps.indexOf(order.status);
                              
                              return (
                                  <div key={order.id} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                                      <div className="flex justify-between items-start mb-6">
                                          <div>
                                              <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Order #{order.id.slice(-4)}</p>
                                              <p className="font-bold text-xl mt-1">{order.items.length} Items</p>
                                          </div>
                                          <div className="text-right">
                                              <p className="text-brand-600 font-bold text-lg">฿{order.totalAmount}</p>
                                          </div>
                                      </div>
                                      
                                      {/* Progress Bar */}
                                      <div className="relative mb-8">
                                          <div className="h-2 bg-gray-100 rounded-full w-full absolute top-1/2 -translate-y-1/2"></div>
                                          <div className="h-2 bg-green-500 rounded-full absolute top-1/2 -translate-y-1/2 transition-all duration-1000" style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}></div>
                                          
                                          <div className="relative flex justify-between">
                                              {steps.map((step, idx) => (
                                                  <div key={step} className={`flex flex-col items-center gap-2 ${idx <= currentStepIndex ? 'opacity-100' : 'opacity-30'}`}>
                                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${idx <= currentStepIndex ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-300'}`}>
                                                          {idx + 1}
                                                      </div>
                                                      <span className="text-[10px] font-bold uppercase">{step === 'acknowledged' ? 'Prep' : step}</span>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>

                                      <div className="bg-gray-50 p-4 rounded-xl">
                                          <h4 className="font-bold text-sm mb-2 text-gray-700">Order Details</h4>
                                          <ul className="space-y-1 text-sm text-gray-600">
                                              {order.items.map((item, i) => (
                                                  <li key={i} className="flex justify-between">
                                                      <span>{item.quantity}x {item.name}</span>
                                                  </li>
                                              ))}
                                          </ul>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative shadow-2xl text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={32} />
                </div>
                {customer?.loyaltyPoints && customer.loyaltyPoints >= 10 && (
                    <div className="mb-4 bg-yellow-100 text-yellow-800 p-2 rounded-lg text-xs font-bold animate-pulse">
                        🎉 You've unlocked a FREE Pizza Reward!
                    </div>
                )}
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Received! 🍕</h2>
                <p className="text-gray-600 mb-6 text-sm">
                    Thank you for your order. Tracking is now available in your profile.
                </p>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                    <p className="font-bold text-brand-600 mb-2 text-sm uppercase">Support Us</p>
                    <a 
                        href="https://maps.app.goo.gl/1DsGESUfrPLUKEyc6" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-blue-700 transition"
                    >
                        <Star size={16} fill="white" />
                        Review on Google Maps
                        <ExternalLink size={14} />
                    </a>
                </div>

                <button 
                    onClick={() => { setShowReviewModal(false); setShowTracker(true); }}
                    className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold text-sm"
                >
                    Track Order Status
                </button>
           </div>
        </div>
      )}

      {/* Customization Modal */}
      {selectedPizza && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center sm:items-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="h-48 relative">
                <img src={selectedPizza.image} className="w-full h-full object-cover rounded-t-2xl sm:rounded-t-2xl" />
                <button onClick={() => setSelectedPizza(null)} className="absolute top-4 right-4 bg-black/50 text-white p-1 rounded-full"><X size={20}/></button>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h3 className="font-bold text-2xl text-white">{selectedPizza.name}</h3>
                    <p className="text-white/80 text-sm">{selectedPizza.description}</p>
                </div>
            </div>
            
            <div className="p-5">
               {selectedPizza.name === "Create Your Own Pizza" && (
                   <div className="mb-4">
                       <label className="text-xs font-bold text-gray-500 uppercase">Name your creation</label>
                       <input 
                           type="text" 
                           placeholder="e.g. My Super Cheese" 
                           className="w-full border-b-2 border-brand-200 py-2 focus:border-brand-600 outline-none font-medium text-lg"
                           value={customName}
                           onChange={(e) => setCustomName(e.target.value)}
                       />
                   </div>
               )}

               {selectedPizza.category === 'pizza' && (
               <div className="mb-6">
                 <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Customize Toppings</h4>
                 <div className="grid grid-cols-2 gap-2">
                   {INITIAL_TOPPINGS.map(topping => {
                     const isSelected = !!selectedToppings.find(t => t.id === topping.id);
                     return (
                        <button 
                            key={topping.id} 
                            onClick={() => toggleTopping(topping)}
                            className={`flex items-center justify-between p-3 border rounded-lg text-sm transition ${isSelected ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium' : 'border-gray-200 text-gray-600'}`}
                        >
                            <span>{topping.name}</span>
                            <span className="text-xs opacity-70">+฿{topping.price}</span>
                        </button>
                     );
                   })}
                 </div>
               </div>
               )}
               
               <div className="flex gap-2">
                   <button onClick={handleSaveFavorite} className="p-3 bg-red-50 text-red-500 rounded-xl border border-red-100 hover:bg-red-100 transition" title="Save to Favorites">
                       <Heart size={24} fill={customer?.savedFavorites?.find(f => f.pizzaId === selectedPizza.id) ? "currentColor" : "none"} />
                   </button>
                   <button 
                    onClick={handleAddToCart}
                    className="flex-1 bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-700 transition flex justify-between px-6 items-center shadow-lg shadow-brand-200"
                   >
                     <span>Add to Order</span>
                     <span>฿{selectedPizza.basePrice + selectedToppings.reduce((s, t) => s + t.price, 0)}</span>
                   </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-xs p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-center">Join Pizza Damac</h2>
            <p className="text-xs text-center text-gray-500 mb-4">Register to earn points and save favorites!</p>
            <form onSubmit={handleRegister}>
              <div className="space-y-3">
                <input 
                    type="text" 
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full border-gray-200 border rounded-lg p-3 bg-gray-50 text-sm"
                    placeholder="Name / Nickname"
                />
                <input 
                    type="tel" 
                    required
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    className="w-full border-gray-200 border rounded-lg p-3 bg-gray-50 text-sm"
                    placeholder="Mobile Number"
                />
                 <textarea 
                    value={regAddress}
                    onChange={e => setRegAddress(e.target.value)}
                    className="w-full border-gray-200 border rounded-lg p-3 bg-gray-50 text-sm"
                    placeholder="Default Delivery Address (Optional)"
                    rows={2}
                />
                <div className="relative">
                    <label className="text-xs text-gray-500 absolute -top-2 left-2 bg-white px-1">Birthday (Optional)</label>
                    <input 
                        type="date" 
                        value={regBirthday}
                        onChange={e => setRegBirthday(e.target.value)}
                        className="w-full border-gray-200 border rounded-lg p-3 bg-gray-50 text-sm"
                    />
                </div>
              </div>
              <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold mt-4">
                Start Earning Points
              </button>
              <button onClick={() => setShowRegister(false)} type="button" className="w-full text-gray-400 py-2 text-sm">Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* AI Chef Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative">
             <button onClick={() => setShowAiModal(false)} className="absolute top-3 right-3 text-gray-400"><X size={20}/></button>
             <div className="text-center mb-4">
                <div className="bg-brand-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-brand-600">
                    <ChefHat size={24} />
                </div>
                <h2 className="font-bold text-lg">Chef's Recommendation</h2>
             </div>
             
             <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="What are you in the mood for? (e.g. spicy, creamy, vegetarian)"
                className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none resize-none h-24 bg-gray-50 text-sm mb-4"
             />
             
             <button 
                onClick={askAiChef}
                disabled={isThinking || !aiPrompt}
                className="w-full py-3 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 transition disabled:opacity-50"
             >
                {isThinking ? 'Thinking...' : 'Ask Chef'}
             </button>

             {aiRecommendation && (
                 <div className="mt-4 p-4 bg-brand-50 rounded-xl border border-brand-100 text-sm text-brand-900 italic">
                     "{aiRecommendation}"
                 </div>
             )}
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 flex justify-end backdrop-blur-sm">
           <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-in">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                  <h2 className="font-bold text-lg">Your Order</h2>
                  <button onClick={() => setIsCartOpen(false)}><X /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {cart.length === 0 ? (
                      <div className="text-center text-gray-500 mt-20">Cart is empty</div>
                  ) : (
                      <>
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between border-b border-dashed pb-4">
                                    <div>
                                        <h4 className="font-bold text-gray-800">{item.name}</h4>
                                        <p className="text-xs text-gray-500">
                                            {item.basePrice === 0 ? 'Reward' : ''}
                                            {item.selectedToppings.length > 0 
                                                ? `+ ${item.selectedToppings.map(t => t.name).join(', ')}` 
                                                : ''}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="font-medium">฿{item.totalPrice}</span>
                                        <button onClick={() => removeFromCart(item.id)} className="text-red-500 text-[10px] font-bold uppercase">Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                      </>
                  )}
              </div>
              
              {cart.length > 0 && (
                  <div className="p-5 bg-gray-50 border-t shadow-inner">
                      {/* Order Type Toggle */}
                      <div className="flex bg-gray-200 p-1 rounded-lg mb-4">
                          <button 
                            onClick={() => setOrderType('online')} 
                            className={`flex-1 py-2 rounded-md font-bold text-xs uppercase transition ${orderType === 'online' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}
                          >
                              Self Pickup
                          </button>
                          <button 
                            onClick={() => setOrderType('delivery')}
                            className={`flex-1 py-2 rounded-md font-bold text-xs uppercase transition ${orderType === 'delivery' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}
                          >
                              Delivery
                          </button>
                      </div>

                      {/* Pickup Specifics */}
                      {orderType === 'online' && (
                          <div className="mb-4 bg-white p-3 rounded-lg border border-gray-200">
                             <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Pickup Time</label>
                             <select 
                                value={pickupTime}
                                onChange={(e) => setPickupTime(e.target.value)}
                                className="w-full p-2 bg-gray-50 border rounded text-sm"
                             >
                                 <option value="">ASAP (approx 20 mins)</option>
                                 <option value="30 mins">In 30 mins</option>
                                 <option value="1 hour">In 1 hour</option>
                                 <option value="Later">Later today</option>
                             </select>
                          </div>
                      )}

                      {/* Delivery Specifics */}
                      {orderType === 'delivery' && (
                          <div className="mb-4 space-y-3 bg-white p-3 rounded-lg border border-gray-200">
                              <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Zone</label>
                                <select 
                                    className="w-full p-2 border rounded text-sm bg-gray-50 mt-1"
                                    value={selectedZoneId}
                                    onChange={(e) => setSelectedZoneId(e.target.value)}
                                >
                                    {DELIVERY_ZONES.map(z => (
                                        <option key={z.id} value={z.id}>{z.name} (+฿{z.fee})</option>
                                    ))}
                                </select>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
                                  <textarea 
                                    className="w-full p-2 border rounded text-sm bg-gray-50 mt-1"
                                    placeholder="Enter full delivery address..."
                                    rows={2}
                                    value={deliveryAddress}
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                  />
                              </div>
                          </div>
                      )}

                       {/* Payment Method */}
                       <div className="mb-4 bg-white p-3 rounded-lg border border-gray-200">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Payment Method</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => setPaymentMethod('qr_transfer')}
                                    className={`flex flex-col items-center justify-center p-2 border rounded-lg ${paymentMethod === 'qr_transfer' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200'}`}
                                >
                                    <QrCode size={20} className="mb-1"/>
                                    <span className="text-xs font-bold">QR / Transfer</span>
                                </button>
                                <button 
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`flex flex-col items-center justify-center p-2 border rounded-lg ${paymentMethod === 'cash' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200'}`}
                                >
                                    <Banknote size={20} className="mb-1"/>
                                    <span className="text-xs font-bold">Cash</span>
                                </button>
                            </div>
                       </div>

                      {/* Summary */}
                      <div className="space-y-2 mb-4">
                         <div className="flex justify-between items-center text-sm text-gray-600">
                              <span>Subtotal</span>
                              <span>฿{cartTotal}</span>
                         </div>
                         {orderType === 'delivery' && (
                             <div className="flex justify-between items-center text-sm text-gray-600">
                                  <span>Delivery Fee</span>
                                  <span>+฿{deliveryFee}</span>
                             </div>
                         )}
                         <div className="flex justify-between items-center text-xl font-bold text-gray-900 pt-2 border-t">
                              <span>Total</span>
                              <span>฿{finalTotal}</span>
                         </div>
                      </div>

                      <button 
                        onClick={handlePlaceOrder}
                        className="w-full py-3 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 transition flex items-center justify-center gap-2 shadow-lg shadow-brand-200"
                      >
                         {orderType === 'delivery' ? <Truck size={20} /> : <ShoppingBag size={20} />}
                         {orderType === 'delivery' ? `Confirm Delivery` : `Place Order`}
                      </button>
                  </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
