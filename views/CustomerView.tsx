
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Pizza, CartItem, Topping, PaymentMethod, ProductCategory, SubItem, OrderStatus } from '../types';
import { INITIAL_TOPPINGS, CATEGORIES, RESTAURANT_LOCATION, DEFAULT_STORE_SETTINGS } from '../constants';
import { ShoppingCart, Plus, X, User, ChefHat, Sparkles, MapPin, Truck, Clock, Banknote, QrCode, ShoppingBag, Star, ExternalLink, Heart, History, Gift, ArrowRight, ArrowLeft, Dices, Navigation, Globe, AlertTriangle, CalendarDays, PlayCircle, Info, ChevronRight, Check, Lock, CheckCircle2, Droplets, Utensils, Carrot, Youtube, Newspaper, Activity, Facebook, Phone, MessageCircle, RotateCw, Layers } from 'lucide-react';

// --- EMBED HELPER ---
const VideoCard: React.FC<{ url: string; key?: string }> = ({ url }) => {
    if (!url) return null;
    
    let embedSrc = '';
    let isIframe = false;
    let label = 'Watch Video';
    let icon = <PlayCircle size={48} className="mb-2 group-hover:scale-110 transition"/>;
    let bgColor = 'bg-gray-900';
    let textColor = 'text-white';
    
    // YouTube Detection
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('v=')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        } else if (url.includes('youtu.be')) {
            videoId = url.split('/').pop()?.split('?')[0] || '';
        } else if (url.includes('/shorts/')) {
            videoId = url.split('/shorts/')[1]?.split('?')[0] || '';
        }
        if (videoId) {
            // Add autoplay=1, mute=1 (required for autoplay), loop=1
            embedSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
            isIframe = true;
        }
    } 
    // Facebook Detection
    else if (url.includes('facebook.com')) {
        // FB Embed Plugin
        embedSrc = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560`;
        isIframe = true;
        label = "Watch on Facebook";
    }
    // TikTok Detection
    else if (url.includes('tiktok.com')) {
            // TikTok requires complex oEmbed or specific SDK. Fallback to external link card.
            label = "Watch on TikTok";
            bgColor = "bg-black";
            // Simulate TikTok vibe
            icon = (
                <div className="mb-2 group-hover:scale-110 transition flex gap-1">
                    <div className="w-8 h-8 rounded-full bg-[#00f2ea] mix-blend-screen animate-pulse"></div>
                    <div className="w-8 h-8 rounded-full bg-[#ff0050] mix-blend-screen -ml-4 animate-pulse"></div>
                </div>
            );
    }
    // Lemon8 Detection
    else if (url.includes('lemon8-app.com')) {
        label = "View on Lemon8";
        bgColor = "bg-yellow-400";
        textColor = "text-gray-900";
        icon = <div className="text-2xl font-bold mb-2 group-hover:scale-110 transition">L8</div>;
    }
    else {
            // Generic Link
            label = "View Link";
    }

    if (isIframe) {
        return (
            <div className="rounded-xl overflow-hidden shadow-lg bg-black aspect-video relative group w-72 md:w-96 flex-shrink-0 snap-start">
                <iframe 
                    src={embedSrc} 
                    className="w-full h-full" 
                    title="Video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                ></iframe>
            </div>
        );
    }

    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className={`rounded-xl overflow-hidden shadow-lg ${bgColor} aspect-video relative group w-72 md:w-96 flex-shrink-0 snap-start flex items-center justify-center`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 group-hover:opacity-70 transition"></div>
            <div className={`relative z-10 flex flex-col items-center ${textColor}`}>
                {icon}
                <span className="font-bold">{label}</span>
                <div className="flex items-center gap-1 text-xs mt-1 opacity-80"><ExternalLink size={12}/> Opens in new tab</div>
            </div>
        </a>
    );
};

export const CustomerView: React.FC = () => {
  const { 
    menu, addToCart, cart, cartTotal, customer, setCustomer, registerCustomer, customerLogin, placeOrder, removeFromCart, navigateTo, 
    addToFavorites, orders, reorderItem, claimReward, shopLogo, generateLuckyPizza,
    language, toggleLanguage, t, getLocalizedItem,
    isStoreOpen, closedMessage, generateTimeSlots, storeSettings, canOrderForToday,
    toppings, fetchOrders, tableSession
  } = useStore();
  const [selectedPizza, setSelectedPizza] = useState<Pizza | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showProfile, setShowProfile] = useState(false);
  const [showTracker, setShowTracker] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // Category State
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('promotion');
  
  // Registration State
  const [regName, setRegName] = useState(customer?.name || '');
  const [regPhone, setRegPhone] = useState(customer?.phone || '');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState(customer?.address || '');
  const [regBirthday, setRegBirthday] = useState(customer?.birthday || '');
  const [regPdpa, setRegPdpa] = useState(customer?.pdpaAccepted || false);

  // Login State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Delivery / Checkout State
  const [orderType, setOrderType] = useState<'online' | 'delivery' | 'dine-in'>('online');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qr_transfer');
  const [pickupTime, setPickupTime] = useState('');
  
  // Logic: Initialize order date based on store status and time
  const [orderDate, setOrderDate] = useState<'today' | 'tomorrow'>(() => {
      // If store is open OR if it's closed but morning (can order for lunch)
      if (isStoreOpen || canOrderForToday()) return 'today';
      return 'tomorrow';
  });

  // Location / Distance
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Pizza Name State
  const [customName, setCustomName] = useState('');
  
  // Combo Builder State
  const [isComboBuilderOpen, setIsComboBuilderOpen] = useState(false);
  const [comboSelections, setComboSelections] = useState<SubItem[]>([]);
  const [currentComboSlot, setCurrentComboSlot] = useState<number | null>(null); // Which slot are we filling?

  const timeSlots = generateTimeSlots(orderDate === 'today' ? 0 : 1);

  // Active Order Tracking (Enhanced for Guests using Local Storage ID)
  const [localOrderId, setLocalOrderId] = useState(() => {
      if (typeof window !== 'undefined') return localStorage.getItem('damac_last_order');
      return null;
  });

  const activeOrder = useMemo(() => {
    return orders.find(o => 
        (customer && o.customerPhone === customer.phone && o.status !== 'completed' && o.status !== 'cancelled') ||
        (o.id === localOrderId && o.status !== 'completed' && o.status !== 'cancelled')
    );
  }, [orders, customer, localOrderId]);

  // Quick Access / Buy Again Logic
  const recentItems = useMemo(() => {
    if (!customer || !orders) return [];
    const myOrders = orders.filter(o => o.customerPhone === customer.phone);
    const uniqueItems = new Map<string, Pizza>();
    
    // Sort orders descending
    myOrders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    for (const order of myOrders) {
        for (const item of order.items) {
            // Use pizzaId as key to avoid duplicates of same item
            if (!uniqueItems.has(item.pizzaId)) {
                // Find original menu item to ensure we have current price/image
                const original = menu.find(m => m.id === item.pizzaId);
                if (original) {
                   uniqueItems.set(item.pizzaId, original);
                }
            }
            if (uniqueItems.size >= 5) break;
        }
        if (uniqueItems.size >= 5) break;
    }
    return Array.from(uniqueItems.values());
  }, [orders, customer, menu]);

  useEffect(() => {
    if (customer?.address) {
      setDeliveryAddress(customer.address);
    }
  }, [customer]);
  
  // Effect: Force Dine-in mode if Table Session (QR) is active
  useEffect(() => {
      if (tableSession) {
          setOrderType('dine-in');
      }
  }, [tableSession]);
  
  // Reset date if store opens
  useEffect(() => {
      if (isStoreOpen && orderDate === 'tomorrow' && !pickupTime) {
          setOrderDate('today');
      } else if (!isStoreOpen && !canOrderForToday()) {
          // Only force tomorrow if we strictly can't order for today (night time)
          setOrderDate('tomorrow');
      }
  }, [isStoreOpen]);

  const handleCustomize = (pizza: Pizza) => {
    if (!pizza.available) return;
    setSelectedPizza(pizza);
    setSelectedToppings([]);
    setCustomName('');
    setSpecialInstructions('');
    
    // Check if it's a combo
    if (pizza.category === 'promotion' && (pizza.comboCount || 0) > 0) {
        setIsComboBuilderOpen(true);
        // Initialize empty slots
        setComboSelections(new Array(pizza.comboCount).fill(null));
    }
  };

  const toggleTopping = (topping: Topping) => {
    // If it's a sauce, ensure single selection for custom pizza
    if (selectedPizza?.id === 'custom_base' && topping.category === 'sauce') {
        setSelectedToppings(prev => {
            const others = prev.filter(t => t.category !== 'sauce');
            return [...others, topping];
        });
        return;
    }

    if (selectedToppings.find(t => t.id === topping.id)) {
      setSelectedToppings(prev => prev.filter(t => t.id !== topping.id));
    } else {
      setSelectedToppings(prev => [...prev, topping]);
    }
  };

  const handleAddToCart = () => {
    if (!selectedPizza) return;
    
    // Validation for Custom Pizza: Must have a sauce
    if (selectedPizza.id === 'custom_base') {
        const hasSauce = selectedToppings.some(t => t.category === 'sauce');
        if (!hasSauce) {
            alert(language === 'th' ? 'กรุณาเลือกซอสอย่างน้อย 1 อย่าง' : 'Please select a base sauce.');
            return;
        }
    }

    const toppingsPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
    
    // Ensure custom pizzas have a name
    const localizedPizza = getLocalizedItem(selectedPizza);
    let finalName = localizedPizza.name;
    if (selectedPizza.name === "Create Your Own Pizza") {
        finalName = customName ? `${t('nameCreation')}: ${customName}` : localizedPizza.name;
    }

    const item: CartItem = {
      id: Date.now().toString() + Math.random().toString(),
      pizzaId: selectedPizza.id,
      name: finalName,
      nameTh: language === 'th' ? finalName : undefined, // Keep current lang as name
      basePrice: selectedPizza.basePrice,
      selectedToppings: selectedToppings,
      quantity: 1,
      totalPrice: selectedPizza.basePrice + toppingsPrice,
      specialInstructions: specialInstructions
    };
    addToCart(item);
    setSelectedPizza(null);
    setSelectedToppings([]);
    setSpecialInstructions('');
  };

  // Combo Handlers
  const handleOpenComboSlot = (index: number) => {
      setCurrentComboSlot(index);
  };

  const handleSelectComboPizza = (pizza: Pizza) => {
      if (currentComboSlot === null) return;
      
      const newSelections = [...comboSelections];
      newSelections[currentComboSlot] = {
          pizzaId: pizza.id,
          name: pizza.name,
          nameTh: pizza.nameTh,
          toppings: [] // Start with no toppings
      };
      setComboSelections(newSelections);
      setCurrentComboSlot(null); // Go back to builder
  };

  const handleAddComboToCart = () => {
      if (!selectedPizza) return;
      // Calculate total price: Base Combo Price + Sum of all extra toppings on sub-items
      const extraToppingsPrice = comboSelections.reduce((sum, item) => {
          return sum + (item?.toppings.reduce((tSum, t) => tSum + t.price, 0) || 0);
      }, 0);
      
      const localized = getLocalizedItem(selectedPizza);

      const item: CartItem = {
          id: Date.now().toString() + Math.random(),
          pizzaId: selectedPizza.id,
          name: localized.name,
          nameTh: selectedPizza.nameTh,
          basePrice: selectedPizza.basePrice,
          selectedToppings: [], // Combo itself has no toppings, the sub-items do
          subItems: comboSelections, // Store the choices
          quantity: 1,
          totalPrice: selectedPizza.basePrice + extraToppingsPrice,
          specialInstructions: specialInstructions
      };
      addToCart(item);
      setIsComboBuilderOpen(false);
      setSelectedPizza(null);
      setComboSelections([]);
      setSpecialInstructions('');
  };

  const handleSaveFavorite = async () => {
      if (!selectedPizza) return;
      
      if (!customer) {
          alert(t('mustRegister'));
          setShowAuthModal(true);
          return;
      }
      
      await addToFavorites(
          selectedPizza.name === "Create Your Own Pizza" && customName ? `${t('nameCreation')}: ${customName}` : selectedPizza.name,
          selectedPizza.id,
          selectedToppings
      );
      alert(t('saveFavorite') + " Success!");
  };

  const handlePlaceOrderClick = async () => {
     // Guest ordering allowed for Table Session
     if (!customer && !tableSession) {
        setShowAuthModal(true);
        return;
     }
     if (orderType === 'delivery' && !deliveryAddress) {
        alert(t('addressMissing'));
        return;
     }
     setIsSubmitting(true);
     const success = await placeOrder(orderType, {
        note: '',
        delivery: orderType === 'delivery' ? {
            address: deliveryAddress,
            zoneName: 'TBD',
            fee: 0 // Will be calculated by staff
        } : undefined,
        paymentMethod: paymentMethod,
        pickupTime: orderType === 'online' && pickupTime ? `${orderDate === 'today' ? 'Today' : 'Tomorrow'} ${pickupTime}` : 'ASAP',
        tableNumber: tableSession || undefined, // PASS TABLE NUMBER
        source: 'store'
     });
     setIsSubmitting(false);
     if (success) {
        setIsCartOpen(false);
        // Refresh local order ID from storage to ensure tracker picks it up
        setLocalOrderId(localStorage.getItem('damac_last_order'));
        setShowTracker(true);
     }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regPdpa) {
        alert(t('pdpaRequired'));
        return;
    }
    if (!regPassword) {
        alert("Password is required");
        return;
    }
    
    // Call new smart register function
    const result = await registerCustomer({
        name: regName,
        phone: regPhone,
        password: regPassword,
        address: regAddress,
        birthday: regBirthday,
        pdpaAccepted: regPdpa,
        loyaltyPoints: 0,
        savedFavorites: [],
        orderHistory: []
    });

    if (result === 'updated') {
        alert("Account exists! Password has been reset and details updated. Welcome back!");
    } else {
        alert("Account created successfully! Welcome to Pizza Damac!");
    }
    
    setShowAuthModal(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      const success = await customerLogin(loginPhone, loginPassword);
      if (success) {
          setShowAuthModal(false);
      } else {
          alert("Invalid phone or password");
      }
  };
  
  const handleManualRefresh = async () => {
      setIsRefreshing(true);
      await fetchOrders();
      setTimeout(() => setIsRefreshing(false), 500);
  };
  
  const getStatusColor = (status: OrderStatus) => {
      switch(status) {
          case 'pending': return 'bg-yellow-100 text-yellow-800';
          case 'confirmed': return 'bg-blue-100 text-blue-800';
          case 'acknowledged': return 'bg-indigo-100 text-indigo-800';
          case 'cooking': return 'bg-orange-100 text-orange-800';
          case 'ready': return 'bg-green-100 text-green-700';
          case 'completed': return 'bg-green-100 text-green-700';
          case 'cancelled': return 'bg-red-100 text-red-700';
          default: return 'bg-gray-100 text-gray-700';
      }
  };

  // Helper for Hero Video
  const renderHeroMedia = () => {
      if (!storeSettings.promoBannerUrl) return null;
      
      // Check if YouTube
      if (storeSettings.promoBannerUrl.includes('youtube.com') || storeSettings.promoBannerUrl.includes('youtu.be')) {
          let videoId = '';
          if (storeSettings.promoBannerUrl.includes('v=')) {
              videoId = storeSettings.promoBannerUrl.split('v=')[1]?.split('&')[0];
          } else if (storeSettings.promoBannerUrl.includes('youtu.be')) {
              videoId = storeSettings.promoBannerUrl.split('/').pop() || '';
          }
          if (videoId) {
              return (
                  <iframe 
                      className="absolute inset-0 w-full h-full object-cover"
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0`}
                      allow="autoplay; encrypted-media"
                      frameBorder="0"
                  />
              );
          }
      }
      
      // Video File
      if (storeSettings.promoContentType === 'video') {
          return (
             <video className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline>
                 <source src={storeSettings.promoBannerUrl} type="video/mp4" />
             </video>
          );
      }
      
      // Image
      return <img src={storeSettings.promoBannerUrl} className="absolute inset-0 w-full h-full object-cover" />;
  };
  
  // Group toppings by category helper
  const groupedToppings = {
      sauce: toppings.filter(t => t.category === 'sauce'),
      cheese: toppings.filter(t => t.category === 'cheese'),
      seasoning: toppings.filter(t => t.category === 'seasoning'),
      meat: toppings.filter(t => t.category === 'meat'),
      vegetable: toppings.filter(t => t.category === 'vegetable'),
      other: toppings.filter(t => !t.category || t.category === 'other'),
  };

  // Resolve Catering Images - Add safe fallback
  const cateringImages = (storeSettings.eventGalleryUrls && storeSettings.eventGalleryUrls.length > 0)
        ? storeSettings.eventGalleryUrls
        : (DEFAULT_STORE_SETTINGS.eventGalleryUrls || []);

  return (
    <div className="min-h-screen bg-orange-50 pb-24 md:pb-0 font-sans text-gray-900 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-orange-100">
           <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 {shopLogo ? <img src={shopLogo} className="w-10 h-10 rounded-full object-cover border-2 border-brand-500"/> : <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-white"><ChefHat/></div>}
                 <h1 className="font-bold text-xl tracking-tight hidden md:block text-gray-900">Pizza Damac</h1>
              </div>

              <div className="flex items-center gap-3">
                 <button onClick={toggleLanguage} className="w-9 h-9 rounded-full bg-orange-100 font-bold text-xs text-brand-700 hover:bg-orange-200 transition">{language.toUpperCase()}</button>
                 {/* TABLE QR BANNER */}
                 {tableSession ? (
                    <div className="bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-bold animate-pulse flex items-center gap-1">
                        <Utensils size={12}/> Table {tableSession}
                    </div>
                 ) : customer ? (
                     <button onClick={() => setShowProfile(true)} className="flex items-center gap-2 bg-orange-100 rounded-full py-1.5 px-3 hover:bg-orange-200 transition">
                         <User size={16} className="text-brand-700"/>
                         <span className="text-sm font-bold hidden md:inline text-brand-900">{customer.name}</span>
                         <div className="bg-brand-500 text-white text-[10px] px-1.5 rounded-full">{customer.loyaltyPoints}pts</div>
                     </button>
                 ) : (
                     <button onClick={() => setShowAuthModal(true)} className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:bg-black transition">{t('login')}</button>
                 )}
                 <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-gray-700 hover:bg-orange-100 rounded-full transition">
                     <ShoppingBag size={24}/>
                     {cart.length > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce-short">{cart.reduce((s,i)=>s+i.quantity,0)}</span>}
                 </button>
              </div>
           </div>
        </header>
        
        {/* TABLE MODE BANNER */}
        {tableSession && (
             <div className="bg-green-600 text-white p-3 text-center sticky top-16 z-20 shadow-md">
                 <div className="font-bold text-lg flex items-center justify-center gap-2">
                     <Utensils size={20}/> You are ordering for Table {tableSession}
                 </div>
                 <p className="text-xs opacity-90">Please place your order, and we will bring it to your table.</p>
             </div>
        )}

        {/* Categories */}
        <div className={`bg-white border-b sticky z-30 shadow-sm ${tableSession ? 'top-28' : 'top-16'}`}>
            <div className="max-w-7xl mx-auto px-4 overflow-x-auto no-scrollbar py-3 flex gap-3">
                {CATEGORIES.map(cat => (
                    <button 
                        key={cat.id} 
                        onClick={() => setActiveCategory(cat.id)}
                        className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all transform ${activeCategory === cat.id ? 'bg-brand-600 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        {language === 'th' ? cat.labelTh : cat.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Hero Section (Banner) */}
        {activeCategory === 'promotion' && (
            <div className="relative w-full h-64 md:h-96 overflow-hidden bg-gray-900">
                {renderHeroMedia()}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col items-center justify-end pb-8">
                     {shopLogo && <img src={shopLogo} className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-xl mb-4 object-cover animate-fade-in"/>}
                     <h2 className="text-white font-bold text-3xl md:text-5xl text-center shadow-black drop-shadow-lg">Pizza Damac</h2>
                     <p className="text-gray-200 text-sm md:text-lg mt-2 font-medium">Authentic Italian Taste in Nonthaburi</p>
                </div>
            </div>
        )}

        {/* Guest Banner */}
        {!customer && activeCategory === 'promotion' && !tableSession && (
            <div className="bg-brand-600 text-white py-3 text-center cursor-pointer hover:bg-brand-700 transition" onClick={() => setShowAuthModal(true)}>
                <span className="font-bold flex items-center justify-center gap-2">
                    <User size={18}/> Please Login or Register to start ordering and earning points!
                </span>
            </div>
        )}

        {/* --- QUICK ACCESS / BUY AGAIN (Logged In Users) --- */}
        {customer && recentItems.length > 0 && activeCategory === 'promotion' && (
            <section className="max-w-7xl mx-auto px-4 py-6 border-b bg-orange-50/50">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-brand-800">
                     <History size={20} className="text-brand-600"/> {t('buyAgain')}
                </h2>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    {recentItems.map(item => {
                         const localized = getLocalizedItem(item);
                         return (
                            <div key={'recent-'+item.id} onClick={() => handleCustomize(item)} className="min-w-[140px] w-[140px] bg-white rounded-xl shadow-sm p-2 border border-orange-100 cursor-pointer hover:shadow-md transition group">
                                <div className="aspect-square rounded-lg overflow-hidden mb-2 relative">
                                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition"/>
                                    {!item.available && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[10px] font-bold">{t('soldOut')}</div>}
                                </div>
                                <h3 className="font-bold text-sm text-gray-800 truncate">{localized.name}</h3>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-brand-600 font-bold text-xs">฿{item.basePrice}</span>
                                    <div className="w-5 h-5 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center"><Plus size={12}/></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        )}

        {/* REORDER: PROMOTIONS GRID */}
        {activeCategory === 'promotion' && (
            <main className="max-w-7xl mx-auto px-4 py-8 border-b">
                 <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-brand-800">
                    <Star className="text-yellow-500" fill="currentColor"/> Special Offers
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {menu.filter(p => p.category === 'promotion').map(item => {
                        const localized = getLocalizedItem(item);
                        return (
                            <div key={item.id} onClick={() => handleCustomize(item)} className={`bg-white rounded-2xl p-3 shadow-sm hover:shadow-lg transition cursor-pointer border border-transparent hover:border-brand-200 group ${!item.available ? 'opacity-60 grayscale' : ''}`}>
                                <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
                                    <img src={item.image} alt={localized.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500"/>
                                    {!item.available && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">{t('soldOut')}</div>}
                                    {item.isBestSeller && <div className="absolute top-2 right-2 bg-yellow-400 text-white px-2 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1"><Star size={10} fill="currentColor"/> Hit</div>}
                                </div>
                                <div className="px-1">
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{localized.name}</h3>
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-3 h-10">{localized.description}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-brand-600">฿{item.basePrice}</span>
                                        <button className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center hover:bg-brand-600 hover:text-white transition"><Plus size={18}/></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        )}

        {/* --- REVIEW VIDEO SECTION --- */}
        {activeCategory === 'promotion' && storeSettings.reviewLinks && storeSettings.reviewLinks.filter(l => l).length > 0 && (
            <section className="bg-white py-8 border-b">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                        <PlayCircle className="text-red-500" fill="currentColor" /> {t('customerReviews')}
                    </h2>
                    <div className="flex overflow-x-auto pb-4 gap-4 snap-x no-scrollbar">
                        {storeSettings.reviewLinks.filter((l): l is string => !!l).map((link, idx) => (
                            <VideoCard key={`review-${idx}`} url={link} />
                        ))}
                    </div>
                </div>
            </section>
        )}

        {/* NEWS & EVENTS SECTION */}
        {activeCategory === 'promotion' && storeSettings.newsItems && storeSettings.newsItems.length > 0 && (
            <section className="bg-orange-100/50 py-6 border-b">
                 <div className="max-w-7xl mx-auto px-4">
                     <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-brand-800">
                        <Newspaper className="text-brand-600" /> {t('newsEvents')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {storeSettings.newsItems.map(news => (
                             <div key={news.id} className="bg-white rounded-xl p-4 shadow-sm border border-orange-200 flex flex-col md:flex-row gap-4 items-center">
                                <div className="w-full md:w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                    <img src={news.imageUrl} className="w-full h-full object-cover"/>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800">{news.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{news.summary}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-gray-400">{new Date(news.date).toLocaleDateString()}</span>
                                        {news.linkUrl && (
                                            <a href={news.linkUrl} target="_blank" className="text-brand-600 text-xs font-bold flex items-center gap-1 hover:underline">
                                                Read More <ArrowRight size={12}/>
                                            </a>
                                        )}
                                    </div>
                                </div>
                             </div>
                        ))}
                    </div>
                 </div>
            </section>
        )}

        {/* Regular Menu Grid */}
        {activeCategory !== 'promotion' && (
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {menu.filter(p => p.category === activeCategory).map(item => {
                        const localized = getLocalizedItem(item);
                        return (
                            <div key={item.id} onClick={() => handleCustomize(item)} className={`bg-white rounded-2xl p-3 shadow-sm hover:shadow-lg transition cursor-pointer border border-transparent hover:border-brand-200 group ${!item.available ? 'opacity-60 grayscale' : ''}`}>
                                <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
                                    <img src={item.image} alt={localized.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500"/>
                                    {!item.available && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">{t('soldOut')}</div>}
                                    {item.isBestSeller && <div className="absolute top-2 right-2 bg-yellow-400 text-white px-2 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1"><Star size={10} fill="currentColor"/> Hit</div>}
                                </div>
                                <div className="px-1">
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{localized.name}</h3>
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-3 h-10">{localized.description}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-brand-600">฿{item.basePrice}</span>
                                        <button className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center hover:bg-brand-600 hover:text-white transition"><Plus size={18}/></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        )}
        
        {/* --- EVENTS & CATERING SECTION (DYNAMIC) --- */}
        <section className="bg-gray-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
                        <Sparkles className="text-yellow-400" /> {t('hireForEvents')}
                    </h2>
                    <p className="text-gray-300 max-w-2xl mx-auto">
                        {t('eventDesc')}
                    </p>
                    <div className="mt-6 flex justify-center gap-4">
                        <a href={storeSettings.lineUrl} target="_blank" className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transition transform hover:scale-105">
                            <MessageCircle size={20} /> {t('contactLine')}
                        </a>
                        <a href={`tel:${storeSettings.contactPhone}`} className="bg-white hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-full font-bold flex items-center gap-2 transition transform hover:scale-105">
                            <Phone size={20} /> {t('callUs')}
                        </a>
                    </div>
                </div>

                {/* Event Gallery Dynamic */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {cateringImages.map((img, i) => (
                        <div key={i} className="rounded-xl overflow-hidden shadow-lg h-64 relative group">
                            <img src={img} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition"></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
        
        {/* --- FOOTER --- */}
        <footer className="bg-gray-900 text-white py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                <div>
                     <h3 className="font-bold text-xl mb-4 text-brand-500 flex items-center justify-center md:justify-start gap-2"><ChefHat/> Pizza Damac</h3>
                     <p className="text-gray-400 text-sm">Authentic Italian Pizza in Nonthaburi.<br/>Fresh ingredients, delicious taste.</p>
                </div>
                <div className="flex flex-col items-center md:items-start">
                    <h3 className="font-bold text-lg mb-4">{t('findUs')}</h3>
                    <div className="flex gap-4">
                        <a href={storeSettings.mapUrl} target="_blank" className="bg-gray-800 p-2 rounded-full hover:bg-brand-600 transition"><MapPin size={20}/></a>
                        <a href={storeSettings.facebookUrl} target="_blank" className="bg-gray-800 p-2 rounded-full hover:bg-brand-600 transition"><Facebook size={20}/></a>
                        <a href={storeSettings.lineUrl} target="_blank" className="bg-gray-800 p-2 rounded-full hover:bg-brand-600 transition"><MessageCircle size={20}/></a>
                        <a href={`tel:${storeSettings.contactPhone}`} className="bg-gray-800 p-2 rounded-full hover:bg-brand-600 transition"><Phone size={20}/></a>
                    </div>
                </div>
                <div className="flex flex-col items-center md:items-start">
                    <h3 className="font-bold text-lg mb-4">Opening Hours</h3>
                    <p className="text-gray-400 text-sm">Everyday: 11:00 - 20:30</p>
                </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-xs">
                <div className="flex justify-center gap-4 mb-4">
                    <button onClick={() => navigateTo('kitchen')} className="hover:text-white transition flex items-center gap-1"><Lock size={10}/> Kitchen Display</button>
                    <button onClick={() => navigateTo('pos')} className="hover:text-white transition flex items-center gap-1"><Lock size={10}/> POS System</button>
                </div>
                <p>&copy; 2024 Pizza Damac. All rights reserved.</p>
            </div>
        </footer>

        {/* --- LIVE ORDER TRACKER --- */}
        {activeOrder && !showTracker && !isCartOpen && (
             <div className="fixed bottom-4 right-4 z-40 animate-bounce-short">
                 <button onClick={() => setShowTracker(true)} className="bg-brand-600 text-white p-3 rounded-full shadow-lg border-2 border-white flex items-center gap-2">
                     <Activity className="animate-pulse"/>
                     <span className="font-bold text-sm hidden md:inline">{t('trackOrder')}</span>
                 </button>
             </div>
        )}

        {showTracker && activeOrder && (
             <div className="fixed bottom-4 right-4 z-40 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in">
                 <div className="bg-brand-600 p-3 text-white flex justify-between items-center">
                     <h3 className="font-bold flex items-center gap-2"><Activity size={18}/> Status: {t(activeOrder.status as any)}</h3>
                     <div className="flex gap-2">
                         <button onClick={handleManualRefresh} className={`p-1 hover:bg-white/20 rounded ${isRefreshing ? 'animate-spin' : ''}`}><RotateCw size={16}/></button>
                         <button onClick={() => setShowTracker(false)}><X size={18}/></button>
                     </div>
                 </div>
                 <div className="p-4">
                     <div className="flex justify-between items-center mb-2">
                         <span className="text-xs text-gray-500">Order #{activeOrder.id.slice(-4)}</span>
                         <span className="text-xs font-bold text-brand-600">{activeOrder.status === 'cooking' ? 'Cooking...' : 'Updating...'}</span>
                     </div>
                     <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-3">
                         <div className={`h-full transition-all duration-1000 ${
                             activeOrder.status === 'pending' ? 'w-1/6 bg-yellow-400' :
                             activeOrder.status === 'confirmed' ? 'w-2/6 bg-blue-500' :
                             activeOrder.status === 'acknowledged' ? 'w-3/6 bg-indigo-500' :
                             activeOrder.status === 'cooking' ? 'w-4/6 bg-orange-500 animate-pulse' :
                             activeOrder.status === 'ready' ? 'w-5/6 bg-green-500' :
                             'w-full bg-green-600'
                         }`}></div>
                     </div>
                     <p className="text-xs text-center text-gray-500 mb-3">
                         {activeOrder.status === 'cooking' ? 'Your delicious pizza is in the oven!' : 'We are preparing your order.'}
                     </p>
                     
                     {/* Rate Us Button (Shown here) */}
                     <a href={storeSettings.reviewUrl} target="_blank" className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition">
                         <Star size={12} fill="orange" className="text-orange-400"/> {t('reviewGoogle')}
                     </a>
                 </div>
             </div>
        )}

        {/* --- CUSTOMIZATION MODAL --- */}
        {selectedPizza && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                {isComboBuilderOpen ? (
                     <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                         <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                             <h2 className="text-xl font-bold flex items-center gap-2"><Layers className="text-brand-600"/> Build Your {selectedPizza.name}</h2>
                             <button onClick={() => {setIsComboBuilderOpen(false); setSelectedPizza(null)}} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                         </div>
                         <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
                             {/* Combo Slots */}
                             {!currentComboSlot && currentComboSlot !== 0 ? (
                                 <div className="space-y-4">
                                     <p className="text-center text-gray-500 mb-4">Select {selectedPizza.comboCount} pizzas for your bundle.</p>
                                     <div className="grid grid-cols-1 gap-4">
                                         {Array.from({length: selectedPizza.comboCount || 2}).map((_, idx) => (
                                             <button 
                                                 key={idx}
                                                 onClick={() => handleOpenComboSlot(idx)}
                                                 className={`w-full p-4 rounded-xl border-2 border-dashed flex items-center justify-between transition ${comboSelections[idx] ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-300 bg-white'}`}
                                             >
                                                 <div className="flex items-center gap-3">
                                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${comboSelections[idx] ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                         {idx + 1}
                                                     </div>
                                                     <span className={`font-bold ${comboSelections[idx] ? 'text-gray-900' : 'text-gray-400'}`}>
                                                         {comboSelections[idx] ? comboSelections[idx].name : 'Select Pizza...'}
                                                     </span>
                                                 </div>
                                                 <ChevronRight size={20} className="text-gray-400"/>
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                             ) : (
                                 // Pizza Selector for Slot
                                 <div>
                                     <button onClick={() => setCurrentComboSlot(null)} className="mb-4 text-sm font-bold text-gray-500 flex items-center gap-1 hover:text-gray-800"><ArrowLeft size={16}/> Back to Bundle</button>
                                     <h3 className="font-bold text-lg mb-4">Choose Pizza #{currentComboSlot + 1}</h3>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                         {/* Updated Filter: Exclude Promotions & respect allowedPromotions */}
                                         {menu.filter(p => {
                                             if (p.category === 'promotion') return false;
                                             if ((p.comboCount || 0) > 0) return false;
                                             // Check eligibility
                                             if (p.allowedPromotions && p.allowedPromotions.length > 0) {
                                                 return p.allowedPromotions.includes(selectedPizza.id);
                                             }
                                             return true; // Allowed in all if empty
                                         }).map(pizza => (
                                             <button 
                                                 key={pizza.id} 
                                                 onClick={() => handleSelectComboPizza(pizza)}
                                                 className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border hover:border-brand-500 text-left transition"
                                             >
                                                 <img src={pizza.image} className="w-12 h-12 rounded-lg object-cover"/>
                                                 <div>
                                                     <div className="font-bold text-sm text-gray-800">{getLocalizedItem(pizza).name}</div>
                                                 </div>
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                             )}
                         </div>
                         <div className="p-4 border-t bg-white flex justify-between items-center">
                             <div className="font-bold text-xl text-gray-900">฿{selectedPizza.basePrice}</div>
                             {!currentComboSlot && currentComboSlot !== 0 && (
                                 <button 
                                     disabled={comboSelections.filter(Boolean).length < (selectedPizza.comboCount || 0)}
                                     onClick={handleAddComboToCart}
                                     className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                 >
                                     Add Bundle
                                 </button>
                             )}
                         </div>
                     </div>
                ) : (
                    // Standard Customization
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="relative h-48 md:h-56">
                            <img src={selectedPizza.image} className="w-full h-full object-cover"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <button onClick={() => setSelectedPizza(null)} className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition"><X size={20}/></button>
                            <div className="absolute bottom-4 left-4 text-white">
                                <h2 className="text-2xl md:text-3xl font-bold">{getLocalizedItem(selectedPizza).name}</h2>
                                <p className="text-white/80 text-sm mt-1">{getLocalizedItem(selectedPizza).description}</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
                            {/* Make Your Own Logic */}
                            {selectedPizza.id === 'custom_base' && (
                                <div className="mb-6">
                                     <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">{t('nameCreation')}</label>
                                     <input 
                                         type="text" 
                                         className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-brand-500 outline-none transition" 
                                         placeholder="e.g. My Super Pizza"
                                         value={customName}
                                         onChange={e => setCustomName(e.target.value)}
                                     />
                                </div>
                            )}
                            
                            {/* Special Instructions */}
                            <div className="mb-6">
                                 <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><MessageCircle size={14}/> Special Instructions</label>
                                 <textarea 
                                     className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-brand-500 outline-none transition text-sm" 
                                     placeholder="e.g. No spicy, Less salt, No olive..."
                                     rows={2}
                                     value={specialInstructions}
                                     onChange={e => setSpecialInstructions(e.target.value)}
                                 />
                            </div>

                            {/* Toppings Section */}
                            {selectedPizza.category === 'pizza' && (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><ChefHat size={18}/> {t('customizeToppings')}</h3>
                                        <button onClick={() => {
                                            const lucky = generateLuckyPizza();
                                            if (lucky) {
                                                setSelectedPizza(lucky.pizza);
                                                setSelectedToppings(lucky.toppings);
                                            }
                                        }} className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-purple-200 transition">
                                            <Dices size={12}/> {t('fateDecide')}
                                        </button>
                                    </div>
                                    
                                    {/* Categorized Toppings */}
                                    {Object.entries(groupedToppings).map(([key, group]) => {
                                        // Only show available toppings
                                        const availableGroup = group.filter(t => t.available !== false);
                                        if (availableGroup.length === 0) return null;
                                        
                                        // Only show Sauce section for Custom Pizza
                                        if (key === 'sauce' && selectedPizza.id !== 'custom_base') return null;

                                        return (
                                            <div key={key} className="mb-6">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{key}</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {availableGroup.map(topping => {
                                                        const isSelected = selectedToppings.some(t => t.id === topping.id);
                                                        return (
                                                            <button
                                                                key={topping.id}
                                                                onClick={() => toggleTopping(topping)}
                                                                className={`p-2 rounded-xl border text-left transition relative flex items-center gap-3 overflow-hidden ${isSelected ? 'border-brand-500 bg-brand-50 text-brand-900' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                                                            >
                                                                <div className="w-10 h-10 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                                                                    {topping.image ? (
                                                                        <img src={topping.image} className="w-full h-full object-cover"/>
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-gray-300"><ChefHat size={16}/></div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="flex justify-between items-center relative z-10">
                                                                        <span className="font-bold text-sm">{language === 'th' ? topping.nameTh : topping.name}</span>
                                                                    </div>
                                                                    <div className="text-xs opacity-70 mt-0.5 relative z-10">{topping.price > 0 ? `+฿${topping.price}` : 'Free'}</div>
                                                                </div>
                                                                {isSelected && <CheckCircle2 size={18} className="absolute top-2 right-2 text-brand-600"/>}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 md:p-6 bg-white border-t border-gray-100 flex justify-between items-center shrink-0">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400 uppercase font-bold">Total Price</span>
                                <span className="text-2xl font-bold text-gray-900">฿{selectedPizza.basePrice + selectedToppings.reduce((s,t) => s + t.price, 0)}</span>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={handleSaveFavorite} className="p-3 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition">
                                    <Heart size={24}/>
                                </button>
                                <button onClick={handleAddToCart} className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-200 transition flex items-center gap-2">
                                    <Plus size={20}/> {t('addToOrder')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* --- CHECKOUT / CART MODAL --- */}
        {isCartOpen && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm animate-fade-in">
                <div className="bg-white w-full md:w-[450px] h-full shadow-2xl flex flex-col animate-slide-in">
                    <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                        <h2 className="font-bold text-xl flex items-center gap-2"><ShoppingBag className="text-brand-600"/> {t('yourOrder')}</h2>
                        <button onClick={() => setIsCartOpen(false)} className="bg-gray-200 p-2 rounded-full hover:bg-gray-300"><X size={20}/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                                <ShoppingBag size={64} className="text-gray-200"/>
                                <p className="font-medium">{t('cartEmpty')}</p>
                                <button onClick={() => setIsCartOpen(false)} className="text-brand-600 font-bold hover:underline">Browse Menu</button>
                            </div>
                        ) : (
                            <>
                                {/* Order Type Selector */}
                                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex mb-6">
                                    {tableSession ? (
                                        <button className="flex-1 py-2 text-sm font-bold rounded-lg bg-green-100 text-green-700">
                                            Table {tableSession}
                                        </button>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => setOrderType('online')} 
                                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${orderType === 'online' ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                            >
                                                Pickup
                                            </button>
                                            <button 
                                                disabled
                                                className="flex-1 py-2 text-sm font-bold rounded-lg text-gray-400 cursor-not-allowed flex items-center justify-center gap-1"
                                            >
                                                Delivery <span className="text-[9px] bg-gray-200 px-1 rounded">OFF</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                                
                                {/* Items List */}
                                <div className="space-y-4 mb-6">
                                    {cart.map(item => (
                                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{item.name}</h4>
                                                    {item.specialInstructions && <div className="text-xs text-red-500 italic mt-0.5">"{item.specialInstructions}"</div>}
                                                    <p className="text-xs text-gray-500">
                                                        {item.selectedToppings.map(t => language === 'th' ? t.nameTh : t.name).join(', ')}
                                                        {item.subItems?.map(s => `+ ${s.name}`).join(', ')}
                                                    </p>
                                                </div>
                                                <div className="font-bold text-gray-900">฿{item.totalPrice}</div>
                                            </div>
                                            <button onClick={() => removeFromCart(item.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><X size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Order Options */}
                                <div className="space-y-4">
                                     {/* Address for Delivery */}
                                     {orderType === 'delivery' && (
                                         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                             <div className="flex justify-between items-center mb-2">
                                                 <label className="text-xs font-bold text-gray-500 uppercase">{t('deliveryAddress')}</label>
                                                 {customer?.savedAddresses && customer.savedAddresses.length > 0 && (
                                                     <select 
                                                         onChange={(e) => setDeliveryAddress(e.target.value)} 
                                                         className="text-xs border rounded p-1 max-w-[150px]"
                                                     >
                                                         <option value="">Saved...</option>
                                                         {customer.savedAddresses.map((addr, i) => <option key={i} value={addr}>{addr.substring(0,15)}...</option>)}
                                                     </select>
                                                 )}
                                             </div>
                                             <textarea 
                                                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                                                rows={2} 
                                                placeholder="Enter full address..."
                                                value={deliveryAddress}
                                                onChange={e => setDeliveryAddress(e.target.value)}
                                             />
                                             <p className="text-xs text-orange-600 mt-2 bg-orange-50 p-2 rounded flex gap-2">
                                                 <Info size={14} className="shrink-0"/>
                                                 {t('deliveryNoticeDesc')}
                                             </p>
                                         </div>
                                     )}

                                     {/* Payment Method */}
                                     <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                         <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">{t('paymentMethod')}</label>
                                         <div className="grid grid-cols-2 gap-3">
                                             <button 
                                                 onClick={() => setPaymentMethod('qr_transfer')}
                                                 className={`p-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition ${paymentMethod === 'qr_transfer' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'}`}
                                             >
                                                 <QrCode size={16}/> {t('qrTransfer')}
                                             </button>
                                             <button 
                                                 onClick={() => setPaymentMethod('cash')}
                                                 className={`p-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition ${paymentMethod === 'cash' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'}`}
                                             >
                                                 <Banknote size={16}/> {t('cash')}
                                             </button>
                                         </div>
                                     </div>

                                     {/* Pickup Time (Only for Online/Pickup) */}
                                     {orderType === 'online' && !tableSession && (
                                         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                             <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">{t('pickupTime')}</label>
                                             <select 
                                                className="w-full p-3 bg-gray-50 border rounded-lg text-sm font-bold text-gray-700 outline-none"
                                                value={pickupTime}
                                                onChange={e => setPickupTime(e.target.value)}
                                             >
                                                 <option value="">{t('asap')}</option>
                                                 {timeSlots.map(slot => (
                                                     <option key={slot} value={slot}>{orderDate === 'tomorrow' ? 'Tomorrow ' : 'Today '} {slot}</option>
                                                 ))}
                                             </select>
                                         </div>
                                     )}
                                </div>
                            </>
                        )}
                    </div>
                    
                    {/* Footer */}
                    <div className="p-6 bg-white border-t shrink-0 pb-safe">
                        <div className="flex justify-between items-center mb-4 text-xl font-bold text-gray-900">
                            <span>Total</span>
                            <span>฿{cartTotal}</span>
                        </div>
                        <button 
                            onClick={handlePlaceOrderClick}
                            disabled={cart.length === 0 || isSubmitting}
                            className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                        >
                            {isSubmitting ? 'Processing...' : t('placeOrder')}
                            {!isSubmitting && <ArrowRight size={20}/>}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- AUTH MODAL --- */}
        {showAuthModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                     <div className="relative h-32 bg-brand-600 flex items-center justify-center shrink-0">
                         <div className="absolute inset-0 bg-black/20"></div>
                         <h2 className="relative text-white font-bold text-3xl">{authMode === 'login' ? 'Welcome Back' : 'Join Us'}</h2>
                         <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-white/80 hover:text-white"><X size={24}/></button>
                     </div>
                     
                     <div className="p-6 flex-1 overflow-y-auto">
                         {authMode === 'login' ? (
                             <form onSubmit={handleLogin} className="space-y-4">
                                 <div>
                                     <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Phone Number</label>
                                     <div className="relative">
                                         <Phone className="absolute left-3 top-3 text-gray-400" size={18}/>
                                         <input type="tel" required className="w-full pl-10 p-3 border rounded-xl bg-gray-50 focus:bg-white transition" placeholder="0812345678" value={loginPhone} onChange={e => setLoginPhone(e.target.value)}/>
                                     </div>
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Password</label>
                                     <div className="relative">
                                         <Lock className="absolute left-3 top-3 text-gray-400" size={18}/>
                                         <input type="password" required className="w-full pl-10 p-3 border rounded-xl bg-gray-50 focus:bg-white transition" placeholder="••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}/>
                                     </div>
                                 </div>
                                 <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black shadow-lg mt-2">Login</button>
                                 <p className="text-center text-sm text-gray-500 mt-4">
                                     New here? <button type="button" onClick={() => setAuthMode('register')} className="text-brand-600 font-bold hover:underline">Create Account</button>
                                 </p>
                             </form>
                         ) : (
                             <form onSubmit={handleRegister} className="space-y-4">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Name</label>
                                        <input type="text" required className="w-full p-3 border rounded-xl bg-gray-50" placeholder="John Doe" value={regName} onChange={e => setRegName(e.target.value)}/>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Phone</label>
                                        <input type="tel" required className="w-full p-3 border rounded-xl bg-gray-50" placeholder="081..." value={regPhone} onChange={e => setRegPhone(e.target.value)}/>
                                    </div>
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Create Password</label>
                                     <input type="password" required className="w-full p-3 border rounded-xl bg-gray-50" placeholder="••••••" value={regPassword} onChange={e => setRegPassword(e.target.value)}/>
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Birthday (Optional)</label>
                                     <input type="date" className="w-full p-3 border rounded-xl bg-gray-50" value={regBirthday} onChange={e => setRegBirthday(e.target.value)}/>
                                 </div>
                                 <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                     <input type="checkbox" required id="pdpa" className="mt-1" checked={regPdpa} onChange={e => setRegPdpa(e.target.checked)}/>
                                     <label htmlFor="pdpa" className="text-xs text-gray-600 cursor-pointer">{t('pdpaLabel')}</label>
                                 </div>
                                 <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 shadow-lg mt-2">Register & Reset Password</button>
                                 <p className="text-center text-sm text-gray-500 mt-4">
                                     Already have an account? <button type="button" onClick={() => setAuthMode('login')} className="text-brand-600 font-bold hover:underline">Login</button>
                                 </p>
                             </form>
                         )}
                     </div>
                </div>
            </div>
        )}
        
        {/* PROFILE MODAL */}
        {showProfile && customer && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                 <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
                     <div className="bg-gray-900 p-6 text-white text-center relative shrink-0">
                         <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 text-white/60 hover:text-white"><X size={24}/></button>
                         <div className="w-20 h-20 bg-brand-500 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3 shadow-lg border-4 border-gray-800">
                             {customer.name.charAt(0)}
                         </div>
                         <h2 className="text-2xl font-bold">{customer.name}</h2>
                         <p className="text-brand-300 font-medium">{customer.loyaltyPoints} Points</p>
                     </div>
                     
                     <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
                         {/* Points Progress */}
                         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                             <div className="flex justify-between items-center mb-2">
                                 <span className="font-bold text-gray-700 text-sm">Reward Progress</span>
                                 <span className="text-xs font-bold text-brand-600">{customer.loyaltyPoints} / 10</span>
                             </div>
                             <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-3">
                                 <div className="bg-brand-500 h-full transition-all" style={{ width: `${Math.min(100, (customer.loyaltyPoints / 10) * 100)}%` }}></div>
                             </div>
                             {customer.loyaltyPoints >= 10 ? (
                                 <button onClick={() => { claimReward(); setShowProfile(false); setIsCartOpen(true); }} className="w-full py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-lg shadow-md animate-pulse">
                                     {t('claimReward')}
                                 </button>
                             ) : (
                                 <p className="text-xs text-center text-gray-500">{10 - customer.loyaltyPoints} more points {t('toFreePizza')}</p>
                             )}
                         </div>

                         {/* ACTIVE ORDER CARD */}
                         {activeOrder && (
                             <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-brand-500 mb-6 relative overflow-hidden group cursor-pointer" onClick={() => { setShowProfile(false); setShowTracker(true); }}>
                                 <div className="flex justify-between items-start mb-3 relative z-10">
                                     <div>
                                         <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                             <Activity size={18} className="text-brand-600 animate-pulse"/> 
                                             Active Order
                                         </h3>
                                         <span className="text-xs text-gray-500">#{activeOrder.id.slice(-4)} • {activeOrder.items.length} items</span>
                                     </div>
                                     <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(activeOrder.status)}`}>
                                         {t(activeOrder.status as any)}
                                     </span>
                                 </div>
                                 
                                 <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-3 relative z-10">
                                     <div className={`h-full transition-all duration-1000 ${
                                         activeOrder.status === 'pending' ? 'w-1/6 bg-yellow-400' :
                                         activeOrder.status === 'confirmed' ? 'w-2/6 bg-blue-500' :
                                         activeOrder.status === 'acknowledged' ? 'w-3/6 bg-indigo-500' :
                                         activeOrder.status === 'cooking' ? 'w-4/6 bg-orange-500' :
                                         activeOrder.status === 'ready' ? 'w-5/6 bg-green-500' :
                                         'w-full bg-green-600'
                                     }`}></div>
                                 </div>
                                 
                                 <div className="text-center text-xs font-bold text-brand-600 flex items-center justify-center gap-1">
                                     Tap to Track <ArrowRight size={12}/>
                                 </div>
                             </div>
                         )}
                         
                         {/* Favorites */}
                         <div className="mb-6">
                             <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Heart size={16} className="text-red-500"/> {t('savedFavorites')}</h3>
                             <div className="space-y-3">
                                 {customer.savedFavorites && customer.savedFavorites.length > 0 ? (
                                     customer.savedFavorites.map(fav => (
                                         <div key={fav.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                                             <div>
                                                 <div className="font-bold text-sm">{fav.name}</div>
                                                 <div className="text-xs text-gray-500 line-clamp-1">{fav.toppings.map(t => t.name).join(', ')}</div>
                                             </div>
                                             <button className="bg-brand-100 text-brand-600 p-2 rounded-full hover:bg-brand-200"><Plus size={16}/></button>
                                         </div>
                                     ))
                                 ) : <p className="text-xs text-gray-400 text-center py-4 bg-white rounded-xl border border-dashed">No favorites yet</p>}
                             </div>
                         </div>
                         
                         {/* Order History */}
                         <div>
                             <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><History size={16}/> {t('recentOrders')}</h3>
                             <div className="space-y-3">
                                 {orders.filter(o => o.customerPhone === customer.phone).slice(0, 5).map(order => (
                                     <div key={order.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                                         <div className="flex justify-between items-center mb-2">
                                              <span className="text-xs font-bold text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getStatusColor(order.status)}`}>{order.status}</span>
                                         </div>
                                         <div className="flex justify-between items-center">
                                              <div>
                                                  {order.items.map((item, idx) => (
                                                      <div key={idx} className="text-sm font-bold text-gray-800">{item.name} <span className="text-gray-400 font-normal">x{item.quantity}</span></div>
                                                  ))}
                                              </div>
                                              <div className="text-right">
                                                  <div className="font-bold text-gray-900">฿{order.totalAmount}</div>
                                                  <button onClick={() => { reorderItem(order.id); setShowProfile(false); setIsCartOpen(true); }} className="text-xs text-brand-600 font-bold hover:underline mt-1">{t('reorder')}</button>
                                              </div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     </div>
                     
                     <div className="p-4 bg-white border-t">
                         <button onClick={() => { setCustomer(null as any); localStorage.removeItem('damac_customer'); setShowProfile(false); }} className="w-full py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50">Log Out</button>
                     </div>
                 </div>
             </div>
        )}

    </div>
  );
};
