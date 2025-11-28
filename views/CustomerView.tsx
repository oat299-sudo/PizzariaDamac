
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Pizza, CartItem, Topping, PaymentMethod, ProductCategory, SubItem, OrderStatus } from '../types';
import { INITIAL_TOPPINGS, CATEGORIES, RESTAURANT_LOCATION } from '../constants';
import { ShoppingCart, Plus, X, User, ChefHat, Sparkles, MapPin, Truck, Clock, Banknote, QrCode, ShoppingBag, Star, ExternalLink, Heart, History, Gift, ArrowRight, ArrowLeft, Dices, Navigation, Globe, AlertTriangle, CalendarDays, PlayCircle, Info, ChevronRight, Check, Lock, CheckCircle2, Droplets, Utensils, Carrot, Youtube, Newspaper, Activity, Facebook, Phone, MessageCircle } from 'lucide-react';

export const CustomerView: React.FC = () => {
  const { 
    menu, addToCart, cart, cartTotal, customer, setCustomer, customerLogin, placeOrder, removeFromCart, navigateTo, 
    addToFavorites, orders, reorderItem, claimReward, shopLogo, generateLuckyPizza,
    language, toggleLanguage, t, getLocalizedItem,
    isStoreOpen, closedMessage, generateTimeSlots, storeSettings, canOrderForToday,
    toppings
  } = useStore();
  const [selectedPizza, setSelectedPizza] = useState<Pizza | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showProfile, setShowProfile] = useState(false);
  const [showTracker, setShowTracker] = useState(false);
  
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
  const [orderType, setOrderType] = useState<'online' | 'delivery'>('online');
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
  const [distance, setDistance] = useState<string | null>(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Pizza Name State
  const [customName, setCustomName] = useState('');
  
  // Combo Builder State
  const [isComboBuilderOpen, setIsComboBuilderOpen] = useState(false);
  const [comboSelections, setComboSelections] = useState<SubItem[]>([]);
  const [currentComboSlot, setCurrentComboSlot] = useState<number | null>(null); // Which slot are we filling?

  const timeSlots = generateTimeSlots(orderDate === 'today' ? 0 : 1);

  // Active Order Tracking
  const activeOrder = orders.find(o => o.customerPhone === customer?.phone && o.status !== 'completed' && o.status !== 'cancelled');

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
      totalPrice: selectedPizza.basePrice + toppingsPrice
    };
    addToCart(item);
    setSelectedPizza(null);
    setSelectedToppings([]);
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
          totalPrice: selectedPizza.basePrice + extraToppingsPrice
      };
      addToCart(item);
      setIsComboBuilderOpen(false);
      setSelectedPizza(null);
      setComboSelections([]);
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
     if (!customer) {
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
        pickupTime: pickupTime ? `${orderDate === 'today' ? 'Today' : 'Tomorrow'} ${pickupTime}` : 'ASAP'
     });
     setIsSubmitting(false);
     if (success) {
        setIsCartOpen(false);
        // Maybe show tracker
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
    await setCustomer({
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
  
  const getStatusColor = (status: OrderStatus) => {
      switch(status) {
          case 'pending': return 'bg-yellow-100 text-yellow-800';
          case 'confirmed': return 'bg-blue-100 text-blue-800';
          case 'cooking': return 'bg-orange-100 text-orange-800';
          case 'ready': return 'bg-green-100 text-green-700';
          case 'completed': return 'bg-green-100 text-green-700';
          case 'cancelled': return 'bg-red-100 text-red-700';
          default: return 'bg-gray-100 text-gray-700';
      }
  };

  // --- EMBED HELPER ---
  const VideoCard = ({ url }: { url: string }) => {
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
              embedSrc = `https://www.youtube.com/embed/${videoId}`;
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
                 {customer ? (
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

        {/* Categories */}
        <div className="bg-white border-b sticky top-16 z-30 shadow-sm">
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

        {/* REORDER: PROMOTIONS GRID - NOW IMMEDIATELY AFTER BANNER IF CATEGORY IS PROMOTION */}
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
                        <Star className="text-yellow-500" fill="currentColor" /> {t('customerReviews')}
                    </h2>
                    <div className="flex overflow-x-auto pb-4 gap-4 snap-x no-scrollbar">
                        {storeSettings.reviewLinks.filter(l => l).map((link, idx) => (
                            <VideoCard key={`review-${idx}`} url={link} />
                        ))}
                    </div>
                </div>
            </section>
        )}

        {/* --- VIBE VIDEO SECTION --- */}
        {activeCategory === 'promotion' && storeSettings.vibeLinks && storeSettings.vibeLinks.filter(l => l).length > 0 && (
            <section className="bg-gray-50 py-8 border-b">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                        <Sparkles className="text-purple-600" /> {t('vibeCheck')}
                    </h2>
                    <div className="flex overflow-x-auto pb-4 gap-4 snap-x no-scrollbar">
                        {storeSettings.vibeLinks.filter(l => l).map((link, idx) => (
                            <VideoCard key={`vibe-${idx}`} url={link} />
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
                                <div className="w-full md:w-32 h-32 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                                    <img src={news.imageUrl} className="w-full h-full object-cover"/>
                                </div>
                                <div className="flex-1">
                                    <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-1 rounded uppercase mb-2 inline-block">{new Date(news.date).toLocaleDateString()}</span>
                                    <h3 className="font-bold text-lg leading-tight mb-1">{news.title}</h3>
                                    <p className="text-gray-600 text-sm line-clamp-2">{news.summary}</p>
                                    {news.linkUrl && <a href={news.linkUrl} target="_blank" rel="noreferrer" className="text-brand-600 text-xs font-bold mt-2 hover:underline inline-block">Read More</a>}
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
            </section>
        )}

        {/* Best Sellers (Only show on Promotion page or if not browsing a specific other category) */}
        {menu.some(p => p.isBestSeller) && activeCategory !== 'promotion' && (
             <div className="max-w-7xl mx-auto px-4 py-6">
                 <h2 className="font-bold text-xl mb-4 flex items-center gap-2 text-gray-800"><Star className="text-yellow-500" fill="currentColor"/> Best Sellers</h2>
                 <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                     {menu.filter(p => p.isBestSeller).map(item => (
                         <div key={'bs-'+item.id} onClick={() => handleCustomize(item)} className="min-w-[200px] bg-white rounded-xl shadow-sm p-3 border border-yellow-100 cursor-pointer hover:shadow-md transition">
                             <img src={item.image} className="w-full h-24 object-cover rounded-lg mb-2"/>
                             <h3 className="font-bold text-sm truncate">{getLocalizedItem(item).name}</h3>
                             <p className="text-brand-600 font-bold text-sm">฿{item.basePrice}</p>
                         </div>
                     ))}
                 </div>
             </div>
        )}

        {/* Store Status Banner */}
        {!isStoreOpen && !canOrderForToday() && (
             <div className="bg-red-600 text-white p-4 text-center sticky top-28 z-20 shadow-md">
                 <div className="font-bold text-lg flex items-center justify-center gap-2">
                     <Clock size={20}/> {t('storeClosed')}
                 </div>
                 <p className="text-sm opacity-90">{closedMessage}</p>
                 <p className="text-xs mt-1 font-bold bg-white/20 inline-block px-2 py-1 rounded">Pre-ordering available for Tomorrow</p>
             </div>
        )}
        {!isStoreOpen && canOrderForToday() && (
             <div className="bg-orange-500 text-white p-4 text-center sticky top-28 z-20 shadow-md">
                 <div className="font-bold text-lg flex items-center justify-center gap-2">
                     <Clock size={20}/> Pre-Order for Lunch
                 </div>
                 <p className="text-sm opacity-90">First available slot today is {timeSlots[0]}</p>
             </div>
        )}

        {/* Menu Grid - FOR OTHER CATEGORIES (Not Promotion) */}
        {activeCategory !== 'promotion' && (
            <main className="max-w-7xl mx-auto px-4 py-6 flex-1">
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
        
        {/* Contact Us Footer Section */}
        <section className="bg-gray-800 text-gray-300 py-12">
            <div className="max-w-7xl mx-auto px-4">
                 <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><MapPin className="text-brand-500"/> {t('findUs')}</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     
                     {/* Map */}
                     <a href={storeSettings.mapUrl || "https://maps.google.com"} target="_blank" rel="noopener noreferrer" className="bg-gray-700 p-4 rounded-xl hover:bg-gray-600 transition flex items-center gap-4 group">
                         <div className="bg-green-100 p-3 rounded-full text-green-600 group-hover:scale-110 transition"><MapPin size={24}/></div>
                         <div>
                             <h3 className="text-white font-bold">Google Maps</h3>
                             <p className="text-xs text-gray-400">Navigate to Pizza Damac</p>
                         </div>
                     </a>

                     {/* Facebook */}
                     <a href={storeSettings.facebookUrl || "#"} target="_blank" rel="noopener noreferrer" className="bg-gray-700 p-4 rounded-xl hover:bg-gray-600 transition flex items-center gap-4 group">
                         <div className="bg-blue-100 p-3 rounded-full text-blue-600 group-hover:scale-110 transition"><Facebook size={24}/></div>
                         <div>
                             <h3 className="text-white font-bold">Facebook</h3>
                             <p className="text-xs text-gray-400">Follow us for updates</p>
                         </div>
                     </a>

                     {/* Line */}
                     <a href={storeSettings.lineUrl || "#"} target="_blank" rel="noopener noreferrer" className="bg-gray-700 p-4 rounded-xl hover:bg-gray-600 transition flex items-center gap-4 group">
                         <div className="bg-green-100 p-3 rounded-full text-green-500 group-hover:scale-110 transition"><MessageCircle size={24}/></div>
                         <div>
                             <h3 className="text-white font-bold">Line Official</h3>
                             <p className="text-xs text-gray-400">Chat with us</p>
                         </div>
                     </a>

                     {/* Phone */}
                     <a href={`tel:${storeSettings.contactPhone}`} className="bg-gray-700 p-4 rounded-xl hover:bg-gray-600 transition flex items-center gap-4 group">
                         <div className="bg-orange-100 p-3 rounded-full text-orange-600 group-hover:scale-110 transition"><Phone size={24}/></div>
                         <div>
                             <h3 className="text-white font-bold">{storeSettings.contactPhone}</h3>
                             <p className="text-xs text-gray-400">Call for info</p>
                         </div>
                     </a>
                 </div>
                 
                 {/* Google Reviews Link */}
                 <div className="mt-8 text-center">
                     <a href={storeSettings.reviewUrl || "#"} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 transition">
                         <Star size={16}/> Rate us on Google Maps
                     </a>
                 </div>
            </div>
        </section>
        
        {/* Footer with Staff Access */}
        <footer className="bg-gray-900 text-gray-500 py-8 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm">© 2025 Pizza Damac Nonthaburi</div>
                <div className="flex gap-4">
                    <button onClick={() => navigateTo('kitchen')} className="flex items-center gap-2 hover:text-white transition"><ChefHat size={16}/> {t('kitchen')}</button>
                    <button onClick={() => navigateTo('pos')} className="flex items-center gap-2 hover:text-white transition"><Lock size={16}/> {t('pos')}</button>
                </div>
            </div>
        </footer>

        {/* ACTIVE ORDER LIVE TRACKER (Floating) */}
        {activeOrder && (
            <div className="fixed bottom-4 left-4 right-4 z-40 md:left-auto md:right-8 md:bottom-8 md:w-96 animate-fade-in">
                <div className="bg-gray-900 text-white p-4 rounded-xl shadow-2xl border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                             <div className="relative">
                                 <Activity size={20} className="text-green-400 animate-pulse"/>
                             </div>
                             <span className="font-bold text-sm">Order Status #{activeOrder.id.slice(-4)}</span>
                        </div>
                        <button onClick={() => setShowProfile(true)} className="text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600">View</button>
                    </div>
                    <div className="flex items-center justify-between">
                         <span className="text-lg font-bold text-brand-400 uppercase">{t(activeOrder.status as any)}</span>
                         <span className="text-xs text-gray-400">Updated: {new Date().toLocaleTimeString()}</span>
                    </div>
                    {/* Simple Progress Bar */}
                    <div className="w-full bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div 
                            className={`h-full bg-brand-500 transition-all duration-1000 ${
                                activeOrder.status === 'confirmed' ? 'w-[25%]' : 
                                activeOrder.status === 'cooking' ? 'w-[60%]' :
                                activeOrder.status === 'ready' ? 'w-[100%]' : 'w-[5%]'
                            }`}
                        ></div>
                    </div>
                </div>
            </div>
        )}

        {/* Customization Modal */}
        {selectedPizza && (
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-4">
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                     {/* Header */}
                     <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-xl">{getLocalizedItem(selectedPizza).name}</h3>
                        <button onClick={() => setSelectedPizza(null)} className="p-2 bg-gray-200 rounded-full"><X size={20}/></button>
                     </div>
                     
                     {/* Content */}
                     <div className="p-4 overflow-y-auto flex-1">
                         {selectedPizza.category === 'promotion' && (selectedPizza.comboCount || 0) > 0 ? (
                             // Combo Builder Interface
                             <div>
                                 <p className="text-sm text-gray-500 mb-4">Select {selectedPizza.comboCount} pizzas for your combo:</p>
                                 {isComboBuilderOpen ? (
                                     <div className="space-y-3">
                                         {new Array(selectedPizza.comboCount).fill(0).map((_, idx) => (
                                             <div key={idx} onClick={() => handleOpenComboSlot(idx)} className={`p-4 border rounded-xl cursor-pointer flex justify-between items-center ${comboSelections[idx] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-dashed border-gray-300'}`}>
                                                 {comboSelections[idx] ? (
                                                     <div>
                                                         <div className="font-bold text-green-800">{language==='th' && comboSelections[idx].nameTh ? comboSelections[idx].nameTh : comboSelections[idx].name}</div>
                                                         <div className="text-xs text-gray-500">
                                                             {comboSelections[idx].toppings.length > 0 ? `+ ${comboSelections[idx].toppings.length} toppings` : 'No extra toppings'}
                                                         </div>
                                                     </div>
                                                 ) : (
                                                     <span className="text-gray-400 font-bold">Select Pizza #{idx + 1}</span>
                                                 )}
                                                 <ChevronRight size={16} className="text-gray-400"/>
                                             </div>
                                         ))}
                                     </div>
                                 ) : null}
                                 
                                 {/* Pizza Selector for Combo Slot */}
                                 {currentComboSlot !== null && (
                                     <div className="absolute inset-0 bg-white z-10 flex flex-col">
                                         <div className="p-4 border-b flex items-center gap-2 bg-gray-50">
                                             <button onClick={() => setCurrentComboSlot(null)}><ArrowLeft size={20}/></button>
                                             <h3 className="font-bold">Select for Slot #{currentComboSlot + 1}</h3>
                                         </div>
                                         <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 gap-3">
                                             {menu.filter(p => p.category === 'pizza').map(p => (
                                                 <div key={p.id} onClick={() => handleSelectComboPizza(p)} className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                                                     <img src={p.image} className="w-12 h-12 rounded object-cover"/>
                                                     <div className="font-bold text-sm">{getLocalizedItem(p).name}</div>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 )}
                             </div>
                         ) : (
                             // Standard Customization OR Make Your Own Pizza
                             <>
                                 {selectedPizza.id === 'custom_base' || selectedPizza.name.includes("Create") ? (
                                     // "Create Your Own" Flow
                                     <div className="space-y-6">
                                         <div className="mb-4">
                                             <label className="block text-sm font-bold mb-1">{t('nameCreation')}</label>
                                             <input className="w-full border rounded p-2" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. My Super Pizza"/>
                                         </div>

                                         {/* 1. SAUCES (Required, Select One) */}
                                         <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                            <h4 className="font-bold text-red-800 text-sm uppercase mb-2 flex items-center gap-2"><Droplets size={16}/> 1. Choose Sauce <span className="text-red-500 text-xs">(Required)</span></h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {groupedToppings.sauce.map(t => {
                                                    const isSelected = selectedToppings.find(sel => sel.id === t.id);
                                                    return (
                                                        <button 
                                                            key={t.id} 
                                                            onClick={() => toggleTopping(t)}
                                                            className={`p-3 rounded-lg border text-left flex justify-between items-center bg-white ${isSelected ? 'border-brand-500 ring-2 ring-brand-500 text-brand-700' : 'border-gray-200'}`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {isSelected ? <CheckCircle2 size={16} className="text-brand-500" /> : <div className="w-4 h-4 rounded-full border border-gray-300"></div>}
                                                                <span className="text-sm font-medium">{language === 'th' && t.nameTh ? t.nameTh : t.name}</span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                         </div>

                                         {/* 2. CHEESES */}
                                         <div>
                                            <h4 className="font-bold text-gray-800 text-sm uppercase mb-2 flex items-center gap-2"><Utensils size={16}/> 2. Select Cheeses</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {groupedToppings.cheese.map(t => (
                                                    <button key={t.id} onClick={() => toggleTopping(t)} className={`p-3 rounded-lg border text-left flex justify-between ${selectedToppings.includes(t) ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500' : 'border-gray-200'}`}>
                                                        <span className="text-sm font-medium">{language === 'th' && t.nameTh ? t.nameTh : t.name}</span>
                                                        <span className="text-xs">+฿{t.price}</span>
                                                    </button>
                                                ))}
                                            </div>
                                         </div>

                                         {/* 3. SEASONING */}
                                         <div>
                                            <h4 className="font-bold text-gray-800 text-sm uppercase mb-2 flex items-center gap-2"><Sparkles size={16}/> 3. Seasoning</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {groupedToppings.seasoning.map(t => (
                                                    <button key={t.id} onClick={() => toggleTopping(t)} className={`p-3 rounded-lg border text-left flex justify-between ${selectedToppings.includes(t) ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500' : 'border-gray-200'}`}>
                                                        <span className="text-sm font-medium">{language === 'th' && t.nameTh ? t.nameTh : t.name}</span>
                                                        <span className="text-xs">{t.price > 0 ? `+฿${t.price}` : 'Free'}</span>
                                                    </button>
                                                ))}
                                            </div>
                                         </div>

                                         {/* 4. MEAT & VEGGIES */}
                                         <div>
                                            <h4 className="font-bold text-gray-800 text-sm uppercase mb-2 flex items-center gap-2"><Carrot size={16}/> 4. Toppings (Meat & Veggies)</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[...groupedToppings.meat, ...groupedToppings.vegetable, ...groupedToppings.other].map(t => (
                                                    <button key={t.id} onClick={() => toggleTopping(t)} className={`p-3 rounded-lg border text-left flex justify-between ${selectedToppings.includes(t) ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500' : 'border-gray-200'}`}>
                                                        <span className="text-sm font-medium">{language === 'th' && t.nameTh ? t.nameTh : t.name}</span>
                                                        <span className="text-xs">+฿{t.price}</span>
                                                    </button>
                                                ))}
                                            </div>
                                         </div>
                                     </div>
                                 ) : (
                                     // Standard Pizza - Just extra toppings list
                                     <>
                                         <h4 className="font-bold text-gray-500 text-xs uppercase mb-3">{t('customizeToppings')}</h4>
                                         <div className="grid grid-cols-2 gap-2">
                                             {/* Exclude sauces from standard extra toppings unless you want them */}
                                             {toppings.filter(t => t.category !== 'sauce').map(t => (
                                                 <button 
                                                    key={t.id} 
                                                    onClick={() => toggleTopping(t)}
                                                    className={`p-3 rounded-lg border text-left flex justify-between ${selectedToppings.includes(t) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200'}`}
                                                >
                                                     <span className="text-sm font-medium">{language === 'th' && t.nameTh ? t.nameTh : t.name}</span>
                                                     <span className="text-xs">+฿{t.price}</span>
                                                 </button>
                                             ))}
                                         </div>
                                     </>
                                 )}
                             </>
                         )}
                     </div>
                     
                     {/* Footer */}
                     <div className="p-4 border-t bg-gray-50 flex gap-3">
                         <button onClick={handleSaveFavorite} className="p-3 bg-white border border-gray-300 rounded-xl text-gray-500"><Heart size={20}/></button>
                         
                         {selectedPizza.category === 'promotion' && (selectedPizza.comboCount || 0) > 0 ? (
                             <button 
                                onClick={handleAddComboToCart}
                                disabled={comboSelections.filter(Boolean).length < (selectedPizza.comboCount || 0)}
                                className="flex-1 bg-brand-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50 disabled:bg-gray-400"
                             >
                                 {comboSelections.filter(Boolean).length < (selectedPizza.comboCount || 0) ? `Select ${selectedPizza.comboCount} items` : t('addToOrder')}
                             </button>
                         ) : (
                             <button onClick={handleAddToCart} className="flex-1 bg-brand-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2">
                                 {t('addToOrder')} - ฿{selectedPizza.basePrice + selectedToppings.reduce((s,t)=>s+t.price,0)}
                             </button>
                         )}
                     </div>
                </div>
            </div>
        )}

        {/* Cart Sidebar/Modal */}
        {isCartOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
                <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h2 className="font-bold text-xl">{t('yourOrder')}</h2>
                        <button onClick={() => setIsCartOpen(false)}><X size={24}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {cart.length === 0 ? <p className="text-center text-gray-500 mt-10">{t('cartEmpty')}</p> : cart.map(item => (
                            <div key={item.id} className="flex justify-between items-start border-b pb-4">
                                <div>
                                    <div className="font-bold text-lg">{item.name} <span className="text-brand-600 text-sm">x{item.quantity}</span></div>
                                    <div className="text-sm text-gray-500">{item.selectedToppings.map(t => language==='th'?t.nameTh:t.name).join(', ')}</div>
                                    {/* Combo breakdown */}
                                    {item.subItems && (
                                        <div className="mt-1 pl-2 border-l-2 border-brand-100">
                                            {item.subItems.map((sub, i) => (
                                                <div key={i} className="text-xs text-gray-500">
                                                    • {language==='th' && sub.nameTh ? sub.nameTh : sub.name}
                                                    {sub.toppings.length > 0 && ` (+${sub.toppings.length} tops)`}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="font-bold">฿{item.totalPrice}</span>
                                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 text-xs">{t('delete')}</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {cart.length > 0 && (
                        <div className="p-4 border-t bg-gray-50 space-y-4">
                             {/* Date Selector (Today / Tomorrow) */}
                             <div className="flex gap-2">
                                 <button 
                                    onClick={() => setOrderDate('today')} 
                                    disabled={!isStoreOpen && !canOrderForToday()} // Fully disabled if night
                                    className={`flex-1 py-2 rounded-lg border font-bold ${orderDate==='today'?'bg-brand-600 text-white':'bg-white text-gray-500'} ${!isStoreOpen && !canOrderForToday() ? 'opacity-50 cursor-not-allowed' : ''}`}
                                 >
                                     Today
                                 </button>
                                 <button 
                                    onClick={() => setOrderDate('tomorrow')} 
                                    className={`flex-1 py-2 rounded-lg border font-bold ${orderDate==='tomorrow'?'bg-brand-600 text-white':'bg-white text-gray-500'}`}
                                 >
                                     Tomorrow
                                 </button>
                             </div>

                             <div className="flex gap-2">
                                 <button 
                                    onClick={() => setOrderType('online')} 
                                    className={`flex-1 py-2 rounded-lg border font-bold ${orderType==='online'?'bg-gray-900 text-white':'bg-white text-gray-500'}`}
                                 >
                                     {t('pickupTime')}
                                 </button>
                                 <button 
                                    disabled
                                    className="flex-1 py-2 rounded-lg border font-bold bg-gray-100 text-gray-400 cursor-not-allowed flex flex-col items-center justify-center leading-none gap-1"
                                    title="Delivery currently unavailable"
                                 >
                                     <span>{t('deliveryAddress')}</span>
                                     <span className="text-[10px] uppercase tracking-wider">Temporarily Off</span>
                                 </button>
                             </div>
                             
                             {orderType === 'online' && (
                                 <div>
                                     <label className="text-xs font-bold text-gray-500 mb-1 block">Select Time ({orderDate === 'today' ? 'Today' : 'Tomorrow'})</label>
                                     <select className="w-full p-2 border rounded" value={pickupTime} onChange={e => setPickupTime(e.target.value)}>
                                         <option value="">{orderDate === 'today' ? 'ASAP (approx 20 mins)' : 'Select Time'}</option>
                                         {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                                     </select>
                                 </div>
                             )}

                             {orderType === 'delivery' && (
                                 <div className="space-y-2">
                                     <textarea className="w-full p-3 border rounded-lg text-sm" placeholder={t('deliveryAddress')} value={deliveryAddress} onChange={e=>setDeliveryAddress(e.target.value)}/>
                                     {customer?.savedAddresses && customer.savedAddresses.length > 0 && (
                                         <select className="w-full p-2 text-sm border rounded bg-gray-50" onChange={e => {if(e.target.value) setDeliveryAddress(e.target.value)}}>
                                             <option value="">{t('selectAddress')}</option>
                                             {customer.savedAddresses.map((addr, i) => <option key={i} value={addr}>{addr.substring(0,30)}...</option>)}
                                         </select>
                                     )}
                                     <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 flex items-start gap-2">
                                         <Info size={16} className="mt-0.5"/>
                                         {t('deliveryNoticeDesc')}
                                     </div>
                                 </div>
                             )}
                             
                             <button onClick={handlePlaceOrderClick} disabled={isSubmitting} className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg">
                                 {isSubmitting ? 'Processing...' : (
                                     !isStoreOpen && orderDate === 'tomorrow' ? `Pre-Order for Tomorrow • ฿${cartTotal}` : `${t('placeOrder')} • ฿${cartTotal}`
                                 )}
                             </button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Auth Modal (Login / Register) */}
        {showAuthModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl relative">
                    <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-400"><X size={24}/></button>
                    
                    {/* Tabs */}
                    <div className="flex border-b mb-6">
                        <button onClick={() => setAuthMode('login')} className={`flex-1 pb-2 font-bold ${authMode === 'login' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-gray-400'}`}>Login</button>
                        <button onClick={() => setAuthMode('register')} className={`flex-1 pb-2 font-bold ${authMode === 'register' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-gray-400'}`}>Register</button>
                    </div>

                    {authMode === 'register' ? (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                                <input className="w-full bg-gray-50 border rounded-lg p-3" value={regName} onChange={e=>setRegName(e.target.value)} required/>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                                <input className="w-full bg-gray-50 border rounded-lg p-3" value={regPhone} onChange={e=>setRegPhone(e.target.value)} required type="tel"/>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                                <input className="w-full bg-gray-50 border rounded-lg p-3" value={regPassword} onChange={e=>setRegPassword(e.target.value)} required type="password"/>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('deliveryAddress')}</label>
                                <textarea className="w-full bg-gray-50 border rounded-lg p-3" value={regAddress} onChange={e=>setRegAddress(e.target.value)}/>
                            </div>
                            <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                                <input type="checkbox" className="mt-1" checked={regPdpa} onChange={e=>setRegPdpa(e.target.checked)}/>
                                <span className="text-xs">{t('pdpaLabel')}</span>
                            </label>
                            <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-black transition">{t('startEarning')}</button>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-4">
                             <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                                <input className="w-full bg-gray-50 border rounded-lg p-3" value={loginPhone} onChange={e=>setLoginPhone(e.target.value)} required type="tel"/>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                                <input className="w-full bg-gray-50 border rounded-lg p-3" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} required type="password"/>
                            </div>
                            <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-brand-700 transition">Login</button>
                        </form>
                    )}
                </div>
            </div>
        )}

        {/* Profile Modal */}
        {showProfile && customer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
                     <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4"><X size={20}/></button>
                     <div className="flex flex-col items-center mb-6">
                         <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <User size={40} className="text-gray-400"/>
                         </div>
                         <h3 className="font-bold text-xl">{customer.name}</h3>
                         <p className="text-gray-500 text-sm">{customer.phone}</p>
                         <div className="mt-3 flex gap-2">
                             <div className="bg-yellow-50 text-yellow-800 px-3 py-1 rounded-lg text-sm font-bold border border-yellow-100 flex items-center gap-1">
                                 <Star size={14}/> {customer.loyaltyPoints} Points
                             </div>
                             <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-lg text-sm font-bold border border-blue-100">
                                 {customer.tier || 'Member'}
                             </div>
                         </div>
                     </div>
                     
                     <div className="space-y-4">
                         <div>
                             <h4 className="font-bold text-sm text-gray-500 uppercase mb-2">{t('savedFavorites')}</h4>
                             {customer.savedFavorites && customer.savedFavorites.length > 0 ? (
                                 <div className="space-y-2">
                                     {customer.savedFavorites.map(fav => (
                                         <div key={fav.id} className="bg-gray-50 p-3 rounded-xl flex justify-between items-center">
                                             <span className="font-bold text-sm">{fav.name}</span>
                                             <button onClick={() => {
                                                 // Reorder logic for favorite
                                                 const pizza = menu.find(p => p.id === fav.pizzaId);
                                                 if (pizza) {
                                                     setSelectedPizza(pizza);
                                                     setSelectedToppings(fav.toppings);
                                                     setShowProfile(false);
                                                 }
                                             }} className="text-brand-600 text-xs font-bold hover:underline">{t('buyAgain')}</button>
                                         </div>
                                     ))}
                                 </div>
                             ) : <p className="text-sm text-gray-400">No favorites saved yet.</p>}
                         </div>

                         <div>
                             <h4 className="font-bold text-sm text-gray-500 uppercase mb-2">{t('recentOrders')}</h4>
                             {orders.filter(o => o.customerPhone === customer.phone).length > 0 ? (
                                 <div className="space-y-3">
                                     {orders
                                         .filter(o => o.customerPhone === customer.phone)
                                         .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                         .map(order => (
                                         <div key={order.id} className="border-b py-3 last:border-0">
                                             <div className="flex justify-between items-center mb-1">
                                                 <div>
                                                    <span className="font-bold text-sm mr-2">#{order.id.slice(-4)}</span>
                                                    <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                                                 </div>
                                                 <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${getStatusColor(order.status)}`}>{t(order.status as any) || order.status}</span>
                                             </div>
                                             
                                             {/* LIST ORDER ITEMS */}
                                             <div className="text-xs text-gray-600 mt-1 mb-2 pl-2 border-l-2 border-gray-100">
                                                 {order.items.map((item, idx) => (
                                                     <div key={idx} className="truncate">
                                                         {item.quantity}x {language==='th' && item.nameTh ? item.nameTh : item.name}
                                                     </div>
                                                 ))}
                                             </div>

                                             <div className="flex justify-between items-center">
                                                 <span className="font-bold text-brand-600">฿{order.totalAmount}</span>
                                                 <button 
                                                    onClick={() => {
                                                        reorderItem(order.id);
                                                        setShowProfile(false);
                                                        setIsCartOpen(true);
                                                    }}
                                                    className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-black transition"
                                                 >
                                                    <History size={12}/> {t('reorder')}
                                                 </button>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             ) : <p className="text-sm text-gray-400">No orders yet.</p>}
                         </div>
                         
                         <button onClick={() => {
                             setCustomer(null as any); 
                             window.location.reload();
                         }} className="w-full py-3 text-red-600 font-bold border border-red-100 rounded-xl hover:bg-red-50">{t('logout')}</button>
                     </div>
                </div>
            </div>
        )}
    </div>
  );
};
