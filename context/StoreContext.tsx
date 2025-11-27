
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Pizza, Order, CartItem, CustomerProfile, OrderType, PaymentMethod, AppView, Topping, OrderSource, SavedFavorite, Expense, Language, StoreSettings } from '../types';
import { INITIAL_MENU, INITIAL_TOPPINGS, GP_RATES, TRANSLATIONS, OPERATING_HOURS } from '../constants';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface StoreContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: keyof typeof TRANSLATIONS.en, params?: Record<string, string | number>) => string;
  getLocalizedItem: (item: { name: string; nameTh?: string; description?: string; descriptionTh?: string } | undefined) => { name: string; description: string };
  currentView: AppView;
  navigateTo: (view: AppView) => void;
  isAdminLoggedIn: boolean;
  adminLogin: (u: string, p: string) => boolean;
  adminLogout: () => void;
  shopLogo: string;
  updateShopLogo: (base64: string) => void;
  menu: Pizza[];
  addPizza: (pizza: Pizza) => Promise<void>;
  updatePizza: (pizza: Pizza) => Promise<void>;
  deletePizza: (id: string) => Promise<void>;
  updatePizzaPrice: (id: string, newPrice: number) => Promise<void>;
  togglePizzaAvailability: (id: string) => Promise<void>;
  toggleBestSeller: (id: string) => Promise<void>; // New
  generateLuckyPizza: () => { pizza: Pizza; toppings: Topping[] } | null;
  toppings: Topping[];
  addTopping: (topping: Topping) => Promise<void>;
  deleteTopping: (id: string) => Promise<void>;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateCartItemQuantity: (itemId: string, delta: number) => void;
  updateCartItem: (updatedItem: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  customer: CustomerProfile | null;
  setCustomer: (profile: CustomerProfile) => Promise<void>;
  addToFavorites: (name: string, pizzaId: string, toppings: Topping[]) => Promise<void>;
  claimReward: () => boolean;
  orders: Order[];
  placeOrder: (
    type: OrderType, 
    details?: {
      note?: string;
      delivery?: { address: string; zoneName: string; fee: number };
      paymentMethod?: PaymentMethod;
      pickupTime?: string;
      tableNumber?: string;
      source?: OrderSource;
    }
  ) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  reorderItem: (orderId: string) => void;
  expenses: Expense[];
  addExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Store Settings
  isStoreOpen: boolean;
  isHoliday: boolean;
  closedMessage: string;
  storeSettings: StoreSettings; // New: Full settings object
  toggleStoreStatus: (isOpen: boolean, message?: string) => Promise<void>;
  updateStoreSettings: (settings: Partial<StoreSettings>) => Promise<void>; // New
  generateTimeSlots: (dateOffset?: number) => string[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- Language State ---
  const [language, setLanguage] = useState<Language>(() => {
      return (localStorage.getItem('damac_lang') as Language) || 'en';
  });
  const toggleLanguage = () => {
      setLanguage(prev => {
          const newLang = prev === 'en' ? 'th' : 'en';
          localStorage.setItem('damac_lang', newLang);
          return newLang;
      });
  };
  const t = (key: keyof typeof TRANSLATIONS.en, params?: Record<string, string | number>) => {
      let text = TRANSLATIONS[language][key] || TRANSLATIONS['en'][key] || key;
      if (params) {
          Object.entries(params).forEach(([k, v]) => {
              text = text.replace(`{${k}}`, String(v));
          });
      }
      return text;
  };
  const getLocalizedItem = (item: { name: string; nameTh?: string; description?: string; descriptionTh?: string } | undefined) => {
      if (!item) return { name: '', description: '' };
      return {
          name: (language === 'th' && item.nameTh) ? item.nameTh : item.name,
          description: (language === 'th' && item.descriptionTh) ? item.descriptionTh : (item.description || '')
      };
  };

  // --- View Navigation ---
  // Initialize from URL params so direct links work
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      return (view === 'kitchen' || view === 'pos') ? view : 'customer';
    }
    return 'customer';
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      setCurrentView((view === 'kitchen' || view === 'pos') ? view : 'customer');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: AppView) => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (view === 'customer') {
            url.searchParams.delete('view');
        } else {
            url.searchParams.set('view', view);
        }
        window.history.pushState({}, '', url.toString());
        window.scrollTo(0, 0);
    }
  };

  // --- Auth State ---
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => sessionStorage.getItem('damac_auth') === 'true');
  const adminLogin = (u: string, p: string) => {
    if ((u === 'oat299@gmail.com' && p === 'PizzaDamac2025*') || (u === 'admin' && p === '123')) {
        setIsAdminLoggedIn(true);
        sessionStorage.setItem('damac_auth', 'true');
        return true;
    }
    return false;
  };
  const adminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('damac_auth');
    navigateTo('customer');
  };

  // --- Branding ---
  const [shopLogo, setShopLogo] = useState(() => localStorage.getItem('damac_logo') || '');
  const updateShopLogo = (base64: string) => {
    setShopLogo(base64);
    localStorage.setItem('damac_logo', base64);
  };

  // --- Data States (From DB) ---
  const [menu, setMenu] = useState<Pizza[]>(INITIAL_MENU);
  const [toppings, setToppings] = useState<Topping[]>(INITIAL_TOPPINGS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustState] = useState<CustomerProfile | null>(() => {
    const saved = localStorage.getItem('damac_customer');
    return saved ? JSON.parse(saved) : null;
  });

  // --- Store Settings State ---
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({ isOpen: true, closedMessage: '' });
  const [isHoliday, setIsHoliday] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  // Helper to check if today is within holiday range
  const checkHolidayStatus = (start?: string, end?: string) => {
      if (!start || !end) return false;
      const today = new Date().toISOString().split('T')[0];
      return today >= start && today <= end;
  };

  const checkOperatingHours = () => {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const isOpenHours = currentHour >= OPERATING_HOURS.open && currentHour < OPERATING_HOURS.close;
    return isOpenHours;
  };

  useEffect(() => {
     // Check if explicit holiday in DB OR manually closed
     const isScheduledHoliday = checkHolidayStatus(storeSettings.holidayStart, storeSettings.holidayEnd);
     const effectiveHoliday = isScheduledHoliday || !storeSettings.isOpen; // Logic: settings.isOpen acts as "Manual Override"

     setIsHoliday(effectiveHoliday);

     const openHours = checkOperatingHours();
     // Store is Open IF (Not Holiday) AND (Within Hours)
     // BUT if manually closed via toggle (isOpen=false), it stays closed.
     setIsStoreOpen(storeSettings.isOpen && !isScheduledHoliday && openHours);
     
     const interval = setInterval(() => {
         const openHours = checkOperatingHours();
         const isScheduled = checkHolidayStatus(storeSettings.holidayStart, storeSettings.holidayEnd);
         setIsStoreOpen(storeSettings.isOpen && !isScheduled && openHours);
     }, 60000); 
     return () => clearInterval(interval);
  }, [storeSettings]);

  // --- 1. Fetch Initial Data ---
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const fetchData = async () => {
      // Menu
      const { data: menuData } = await supabase.from('menu_items').select('*');
      if (menuData && menuData.length > 0) {
        const mappedMenu: Pizza[] = menuData.map((m: any) => ({
          id: m.id, name: m.name, nameTh: m.name_th, 
          description: m.description, descriptionTh: m.description_th,
          basePrice: m.base_price, image: m.image, available: m.available, category: m.category,
          isBestSeller: m.is_best_seller // New field
        }));
        setMenu(mappedMenu);
      }

      // Toppings
      const { data: toppingsData } = await supabase.from('toppings').select('*');
      if (toppingsData && toppingsData.length > 0) {
        const mappedToppings: Topping[] = toppingsData.map((t: any) => ({
          id: t.id, name: t.name, nameTh: t.name_th, price: t.price
        }));
        setToppings(mappedToppings);
      }

      // Orders
      const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100);
      if (ordersData) {
        const mappedOrders: Order[] = ordersData.map((o: any) => ({
          id: o.id, customerName: o.customer_name, customerPhone: o.customer_phone,
          type: o.type, source: o.source, status: o.status,
          totalAmount: o.total_amount, netAmount: o.net_amount, createdAt: o.created_at,
          note: o.note, deliveryAddress: o.delivery_address, deliveryZone: o.delivery_zone,
          deliveryFee: o.delivery_fee, paymentMethod: o.payment_method, pickupTime: o.pickup_time,
          tableNumber: o.table_number, items: o.items
        }));
        setOrders(mappedOrders);
      }

      // Settings
      const { data: settingsData } = await supabase.from('store_settings').select('*').eq('id', 'global').single();
      if (settingsData) {
          setStoreSettings({
              isOpen: settingsData.is_open,
              closedMessage: settingsData.closed_message || '',
              promoBannerUrl: settingsData.promo_banner_url,
              promoContentType: settingsData.promo_content_type || 'image',
              holidayStart: settingsData.holiday_start,
              holidayEnd: settingsData.holiday_end
          });
      }
    };

    fetchData();

    // --- 2. Realtime Subscriptions ---
    const channel = supabase.channel('realtime_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, (payload) => {
          if (payload.new) {
             setStoreSettings({
                 isOpen: payload.new.is_open,
                 closedMessage: payload.new.closed_message,
                 promoBannerUrl: payload.new.promo_banner_url,
                 promoContentType: payload.new.promo_content_type,
                 holidayStart: payload.new.holiday_start,
                 holidayEnd: payload.new.holiday_end
             });
          }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); }
  }, []);

  // --- Menu Actions ---
  const addPizza = async (pizza: Pizza) => {
    setMenu(prev => [...prev, pizza]);
    if(isSupabaseConfigured) {
        await supabase.from('menu_items').insert([{
            id: pizza.id, name: pizza.name, name_th: pizza.nameTh,
            description: pizza.description, description_th: pizza.descriptionTh,
            base_price: pizza.basePrice, image: pizza.image, available: pizza.available, category: pizza.category,
            is_best_seller: pizza.isBestSeller
        }]);
    }
  };

  const updatePizza = async (updatedPizza: Pizza) => {
    setMenu(prev => prev.map(p => p.id === updatedPizza.id ? updatedPizza : p));
    if(isSupabaseConfigured) {
        await supabase.from('menu_items').update({
            name: updatedPizza.name, name_th: updatedPizza.nameTh,
            description: updatedPizza.description, description_th: updatedPizza.descriptionTh,
            base_price: updatedPizza.basePrice, image: updatedPizza.image, 
            available: updatedPizza.available, category: updatedPizza.category,
            is_best_seller: updatedPizza.isBestSeller
        }).eq('id', updatedPizza.id);
    }
  };

  const deletePizza = async (id: string) => {
    setMenu(prev => prev.filter(p => p.id !== id));
    if(isSupabaseConfigured) {
        await supabase.from('menu_items').delete().eq('id', id);
    }
  };

  const updatePizzaPrice = async (id: string, newPrice: number) => {
    setMenu(prev => prev.map(p => p.id === id ? { ...p, basePrice: newPrice } : p));
    if(isSupabaseConfigured) {
        await supabase.from('menu_items').update({ base_price: newPrice }).eq('id', id);
    }
  };

  const togglePizzaAvailability = async (id: string) => {
    const item = menu.find(p => p.id === id);
    if (!item) return;
    const newVal = !item.available;
    setMenu(prev => prev.map(p => p.id === id ? { ...p, available: newVal } : p));
    if(isSupabaseConfigured) {
        await supabase.from('menu_items').update({ available: newVal }).eq('id', id);
    }
  };
  
  const toggleBestSeller = async (id: string) => {
    const item = menu.find(p => p.id === id);
    if (!item) return;
    const newVal = !item.isBestSeller;
    setMenu(prev => prev.map(p => p.id === id ? { ...p, isBestSeller: newVal } : p));
    if(isSupabaseConfigured) {
        await supabase.from('menu_items').update({ is_best_seller: newVal }).eq('id', id);
    }
  };

  // --- Topping Actions ---
  const addTopping = async (topping: Topping) => {
    setToppings(prev => [...prev, topping]);
    if(isSupabaseConfigured) {
        await supabase.from('toppings').insert([{
            id: topping.id, name: topping.name, name_th: topping.nameTh, price: topping.price
        }]);
    }
  };

  const deleteTopping = async (id: string) => {
    setToppings(prev => prev.filter(t => t.id !== id));
    if(isSupabaseConfigured) {
        await supabase.from('toppings').delete().eq('id', id);
    }
  };

  // --- Cart ---
  const addToCart = (item: CartItem) => setCart(prev => [...prev, item]);
  const updateCartItemQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
        if (item.id === itemId) {
            const newQuantity = Math.max(1, item.quantity + delta);
            const unitPrice = item.basePrice + item.selectedToppings.reduce((sum, t) => sum + t.price, 0);
            return { ...item, quantity: newQuantity, totalPrice: unitPrice * newQuantity };
        }
        return item;
    }));
  };
  const updateCartItem = (updatedItem: CartItem) => {
    setCart(prev => prev.map(item => {
        if (item.id === updatedItem.id) {
             const unitPrice = updatedItem.basePrice + updatedItem.selectedToppings.reduce((sum, t) => sum + t.price, 0);
             return { ...updatedItem, totalPrice: unitPrice * updatedItem.quantity };
        }
        return item;
    }));
  };
  const removeFromCart = (itemId: string) => setCart(prev => prev.filter(i => i.id !== itemId));
  const clearCart = () => setCart([]);
  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  // --- Customer & Auth ---
  const setCustomer = async (profile: CustomerProfile) => {
    setCustState(profile);
    localStorage.setItem('damac_customer', JSON.stringify(profile));
    
    if(isSupabaseConfigured) {
        const { data } = await supabase.from('customers').select('phone').eq('phone', profile.phone).single();
        if (data) {
            await supabase.from('customers').update({
                name: profile.name, address: profile.address, birthday: profile.birthday,
                loyalty_points: profile.loyaltyPoints, saved_favorites: profile.savedFavorites, 
                order_history: profile.orderHistory
            }).eq('phone', profile.phone);
        } else {
            await supabase.from('customers').insert([{
                phone: profile.phone, name: profile.name, address: profile.address, birthday: profile.birthday,
                loyalty_points: profile.loyaltyPoints, tier: 'Bronze',
                saved_favorites: profile.savedFavorites || [], order_history: profile.orderHistory || []
            }]);
        }
    }
  };

  const addToFavorites = async (name: string, pizzaId: string, tops: Topping[]) => {
      if (!customer) return;
      const newFav: SavedFavorite = { id: 'fav' + Date.now(), name, pizzaId, toppings: tops };
      const updatedProfile = { ...customer, savedFavorites: [...(customer.savedFavorites || []), newFav] };
      await setCustomer(updatedProfile);
  };

  const claimReward = () => {
      if (!customer || customer.loyaltyPoints < 10) return false;
      const rewardPizza = menu.find(p => p.name === "Pizza Damac") || menu[0];
      addToCart({
          id: 'reward-' + Date.now(), pizzaId: rewardPizza.id,
          name: rewardPizza.name + " (Reward)", nameTh: (rewardPizza.nameTh || rewardPizza.name) + " (รางวัลฟรี)",
          basePrice: 0, quantity: 1, selectedToppings: [], totalPrice: 0
      });
      const updatedProfile = { ...customer, loyaltyPoints: customer.loyaltyPoints - 10 };
      setCustomer(updatedProfile);
      return true;
  };

  // --- Orders ---
  const placeOrder = async (
    type: OrderType, 
    details?: {
      note?: string;
      delivery?: { address: string; zoneName: string; fee: number };
      paymentMethod?: PaymentMethod;
      pickupTime?: string;
      tableNumber?: string;
      source?: OrderSource;
    }
  ): Promise<boolean> => {
    if (!isSupabaseConfigured) {
        alert("Database not connected.");
        return false;
    }

    if (cart.length === 0) return false;
    if ((type === 'online' || type === 'delivery') && !customer) {
      alert("Please register first.");
      return false;
    }

    // Logic: If Pickup Time is specifically for future, allow it.
    const isFutureOrder = details?.pickupTime && details.pickupTime.includes('Tomorrow');
    
    // Block if Store Closed AND Not Future Order
    if (!isStoreOpen && !isFutureOrder && (type === 'online' || type === 'delivery')) {
        alert(storeSettings.closedMessage || t('storeClosedMsg'));
        return false;
    }

    const subTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const deliveryFee = details?.delivery?.fee || 0;
    const totalAmount = subTotal + deliveryFee;
    const source = details?.source || 'store';
    const gpRate = GP_RATES[source] || 0;
    const netAmount = totalAmount * (1 - gpRate);

    const newOrder: Order = {
      id: Date.now().toString(),
      customerName: type === 'dine-in' ? (details?.tableNumber ? `Table ${details.tableNumber}` : 'Walk-in') : (customer?.name || 'Guest'),
      customerPhone: customer?.phone || '-',
      type, source,
      status: (type === 'online' || type === 'delivery') ? 'pending' : 'confirmed',
      items: [...cart],
      totalAmount, netAmount,
      createdAt: new Date().toISOString(),
      note: details?.note,
      deliveryAddress: details?.delivery?.address,
      deliveryZone: details?.delivery?.zoneName,
      deliveryFee: details?.delivery?.fee,
      paymentMethod: details?.paymentMethod,
      pickupTime: details?.pickupTime,
      tableNumber: details?.tableNumber
    };

    const { error } = await supabase.from('orders').insert([{
        id: newOrder.id,
        customer_name: newOrder.customerName,
        customer_phone: newOrder.customerPhone,
        type: newOrder.type, source: newOrder.source, status: newOrder.status,
        total_amount: newOrder.totalAmount, net_amount: newOrder.netAmount,
        created_at: newOrder.createdAt, note: newOrder.note,
        delivery_address: newOrder.deliveryAddress, delivery_zone: newOrder.deliveryZone,
        delivery_fee: newOrder.deliveryFee, payment_method: newOrder.paymentMethod,
        pickup_time: newOrder.pickupTime, table_number: newOrder.tableNumber,
        items: newOrder.items
    }]);

    if (error) {
        console.error("Order Error:", error);
        alert(`Order Failed: ${error.message}`);
        return false;
    }

    setOrders(prev => [newOrder, ...prev]);
    
    // Loyalty
    if (customer && source === 'store') {
        const pizzaCount = cart.filter(i => {
           const menuItem = menu.find(p => p.id === i.pizzaId);
           return menuItem?.category === 'pizza' && i.basePrice > 0;
        }).length;
        
        if (pizzaCount > 0) {
            const updatedProfile = {
                ...customer,
                loyaltyPoints: (customer.loyaltyPoints || 0) + pizzaCount,
                orderHistory: [newOrder.id, ...(customer.orderHistory || [])]
            };
            setCustomer(updatedProfile);
        }
    }

    clearCart();
    return true;
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    if(isSupabaseConfigured) {
        await supabase.from('orders').update({ status }).eq('id', orderId);
    }
  };

  const reorderItem = (orderId: string) => {
      const order = orders.find(o => o.id === orderId);
      if (order) {
          order.items.forEach(item => {
             addToCart({...item, id: Date.now() + Math.random().toString()}); 
          });
      }
  };

  const addExpense = async (expense: Expense) => {
    setExpenses(prev => [expense, ...prev]);
    if(isSupabaseConfigured) {
        await supabase.from('expenses').insert([{
            id: expense.id, description: expense.description,
            amount: expense.amount, category: expense.category,
            date: expense.date, note: expense.note
        }]);
    }
  };

  const deleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    if(isSupabaseConfigured) {
        await supabase.from('expenses').delete().eq('id', id);
    }
  };

  const generateLuckyPizza = () => {
    const pizzaBase = menu.find(p => p.name === "Create Your Own Pizza") || menu[0];
    if (!pizzaBase || toppings.length === 0) return null;
    const shuffled = [...toppings].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 3) + 3;
    const selected = shuffled.slice(0, count);
    return { pizza: pizzaBase, toppings: selected };
  };

  // --- Store Settings ---
  const toggleStoreStatus = async (isOpen: boolean, message?: string) => {
     setStoreSettings(prev => ({ ...prev, isOpen, closedMessage: message ?? prev.closedMessage }));
     if(isSupabaseConfigured) {
         await supabase.from('store_settings').update({ 
             is_open: isOpen, 
             closed_message: message ?? storeSettings.closedMessage 
         }).eq('id', 'global');
     }
  };

  const updateStoreSettings = async (settings: Partial<StoreSettings>) => {
      setStoreSettings(prev => ({ ...prev, ...settings }));
      if (isSupabaseConfigured) {
           await supabase.from('store_settings').update({
               promo_banner_url: settings.promoBannerUrl,
               promo_content_type: settings.promoContentType,
               holiday_start: settings.holidayStart,
               holiday_end: settings.holidayEnd
           }).eq('id', 'global');
      }
  };

  const generateTimeSlots = (dateOffset: number = 0) => {
      const slots = [];
      let time = OPERATING_HOURS.open;
      const now = new Date();
      const currentDecimalTime = now.getHours() + (now.getMinutes() / 60);

      while (time < OPERATING_HOURS.close) {
          if (dateOffset === 0 && time < currentDecimalTime + 0.5) {
              time += 0.5;
              continue;
          }
          const hours = Math.floor(time);
          const minutes = (time % 1) * 60;
          const timeStr = `${hours.toString().padStart(2, '0')}:${minutes === 0 ? '00' : '30'}`;
          slots.push(timeStr);
          time += 0.5;
      }
      return slots;
  };

  return (
    <StoreContext.Provider value={{
      language, toggleLanguage, t, getLocalizedItem,
      currentView, navigateTo,
      isAdminLoggedIn, adminLogin, adminLogout,
      shopLogo, updateShopLogo,
      menu, addPizza, updatePizza, deletePizza, updatePizzaPrice, togglePizzaAvailability, toggleBestSeller, generateLuckyPizza,
      toppings, addTopping, deleteTopping,
      cart, addToCart, updateCartItemQuantity, updateCartItem, removeFromCart, clearCart, cartTotal,
      customer, setCustomer, addToFavorites, claimReward,
      orders, placeOrder, updateOrderStatus, reorderItem,
      expenses, addExpense, deleteExpense,
      isStoreOpen, isHoliday, closedMessage: storeSettings.closedMessage, storeSettings, toggleStoreStatus, updateStoreSettings, generateTimeSlots
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};
