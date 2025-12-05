
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { 
  Pizza, Topping, CartItem, Order, OrderType, OrderSource, OrderStatus, 
  PaymentMethod, CustomerProfile, Expense, StoreSettings, NewsItem, 
  SavedFavorite, Language, AppView, ProductCategory, SubItem, ExpenseCategory
} from '../types';
import { 
  INITIAL_MENU, INITIAL_TOPPINGS, DEFAULT_STORE_SETTINGS, 
  OPERATING_HOURS, GP_RATES, TRANSLATIONS, CATEGORIES 
} from '../constants';
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
  toggleBestSeller: (id: string) => Promise<void>;
  generateLuckyPizza: () => { pizza: Pizza; toppings: Topping[] } | null;
  seedDatabase: () => Promise<void>;

  toppings: Topping[];
  addTopping: (topping: Topping) => Promise<void>;
  deleteTopping: (id: string) => Promise<void>;
  
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQuantity: (itemId: string, delta: number) => void;
  updateCartItem: (item: CartItem) => void;
  clearCart: () => void;
  cartTotal: number;
  
  customer: CustomerProfile | null;
  setCustomer: (profile: CustomerProfile) => Promise<void>;
  registerCustomer: (profile: CustomerProfile) => Promise<'created' | 'updated'>;
  customerLogin: (phone: string, pass: string) => Promise<boolean>;
  getAllCustomers: () => Promise<any[]>;
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
      status?: OrderStatus;
    }
  ) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  completeOrder: (orderId: string, paymentDetails: { paymentMethod: PaymentMethod, note?: string }) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  reorderItem: (orderId: string) => void;
  fetchOrders: () => Promise<void>;

  expenses: Expense[];
  addExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  isStoreOpen: boolean;
  isHoliday: boolean;
  closedMessage: string;
  storeSettings: StoreSettings;
  toggleStoreStatus: (isOpen: boolean, message?: string) => Promise<void>;
  updateStoreSettings: (settings: Partial<StoreSettings>) => Promise<void>;
  generateTimeSlots: (dateOffset?: number) => string[];
  canOrderForToday: () => boolean;

  addNewsItem: (item: NewsItem) => Promise<void>;
  deleteNewsItem: (id: string) => Promise<void>;

  tableSession: string | null;
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

  // --- View Navigation & Table Session ---
  // Initialize from URL params so direct links work
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      return (view === 'kitchen' || view === 'pos') ? view : 'customer';
    }
    return 'customer';
  });
  
  // Check for Table Param (QR Code Scan)
  const [tableSession, setTableSession] = useState<string | null>(() => {
      if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          return params.get('table');
      }
      return null;
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const table = params.get('table');
      setCurrentView((view === 'kitchen' || view === 'pos') ? view : 'customer');
      if (table) setTableSession(table);
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
        // Preserve table param if it exists
        if (tableSession) {
            url.searchParams.set('table', tableSession);
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

  // --- Data States (From DB + Local Storage Backup) ---
  const [menu, setMenu] = useState<Pizza[]>(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('damac_menu');
          if (saved) {
              try { return JSON.parse(saved); } catch(e) {}
          }
      }
      return INITIAL_MENU;
  });
  
  // Persist Menu to LocalStorage
  useEffect(() => {
      localStorage.setItem('damac_menu', JSON.stringify(menu));
  }, [menu]);

  const [toppings, setToppings] = useState<Topping[]>(INITIAL_TOPPINGS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustState] = useState<CustomerProfile | null>(() => {
    const saved = localStorage.getItem('damac_customer');
    return saved ? JSON.parse(saved) : null;
  });

  // --- Store Settings State (From DB + Local Storage Backup) ---
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('damac_store_settings');
          if (saved) {
              try { return { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(saved) }; } 
              catch(e) { console.error("Settings parse error", e); }
          }
      }
      return DEFAULT_STORE_SETTINGS;
  });

  // Persist Settings to LocalStorage
  useEffect(() => {
      localStorage.setItem('damac_store_settings', JSON.stringify(storeSettings));
  }, [storeSettings]);

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
  
  const canOrderForToday = () => {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      // Can order today if we haven't passed the closing time yet
      return currentHour < OPERATING_HOURS.close;
  };

  useEffect(() => {
     // Check if explicit holiday in DB OR manually closed
     const isScheduledHoliday = checkHolidayStatus(storeSettings.holidayStart, storeSettings.holidayEnd);
     const effectiveHoliday = isScheduledHoliday || !storeSettings.isOpen;
     
     // Store is "Open" if no holiday/manual close AND within hours
     const withinHours = checkOperatingHours();
     
     setIsHoliday(isScheduledHoliday);
     // Note: isStoreOpen tracks "Currently accepting ASAP orders". 
     // If closed (morning), you can still preorder for today.
     setIsStoreOpen(!effectiveHoliday && withinHours);
  }, [storeSettings]);

  // DB Sync
  const fetchMenu = async () => {
      if (!isSupabaseConfigured) return;
      try {
        const { data, error } = await supabase.from('menu_items').select('*');
        if (!error && data) {
           // Merge with local to ensure category/combo logic exists even if DB column missing
           const mergedMenu = data.map(d => {
               const local = INITIAL_MENU.find(m => m.id === d.id);
               return {
                   ...d, 
                   basePrice: d.base_price, 
                   nameTh: d.name_th, 
                   descriptionTh: d.description_th, 
                   isBestSeller: d.is_best_seller,
                   comboCount: d.combo_count !== undefined ? d.combo_count : (local?.comboCount || 0),
                   category: d.category || local?.category || 'pizza'
               };
           });
           setMenu(mergedMenu);
        }
      } catch (err) { console.error("Menu fetch failed", err); }
  };
  const fetchToppings = async () => {
      if (!isSupabaseConfigured) return;
      try {
          const { data, error } = await supabase.from('toppings').select('*');
          if (!error && data) {
              // Vital Fix: If DB lacks 'category' column, fallback to INITIAL_TOPPINGS
              const mergedToppings = data.map(d => {
                  const local = INITIAL_TOPPINGS.find(t => t.id === d.id);
                  return {
                      ...d, 
                      nameTh: d.name_th,
                      category: d.category || local?.category || 'other'
                  };
              });
              setToppings(mergedToppings);
          }
      } catch (err) { console.error("Toppings fetch failed", err); }
  };
  const fetchOrders = async () => {
      if (!isSupabaseConfigured) return;
      try {
          const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (error) {
              if (error.code === '42P01') {
                  console.warn("Table 'orders' missing. Please run SQL script.");
                  return;
              }
          }
          if (data) setOrders(data.map(d => ({
              ...d, 
              customerName: d.customer_name, 
              customerPhone: d.customer_phone, 
              totalAmount: d.total_amount,
              netAmount: d.net_amount || d.total_amount,
              createdAt: d.created_at,
              deliveryAddress: d.delivery_address,
              deliveryZone: d.delivery_zone,
              deliveryFee: d.delivery_fee,
              paymentMethod: d.payment_method,
              pickupTime: d.pickup_time,
              tableNumber: d.table_number
          })));
      } catch (err) { console.error("Orders fetch failed", err); }
  };
  const fetchSettings = async () => {
      if (!isSupabaseConfigured) return;
      try {
          const { data } = await supabase.from('store_settings').select('*').single();
          if (data) {
              setStoreSettings({
                  isOpen: data.is_open,
                  closedMessage: data.closed_message,
                  promoBannerUrl: data.promo_banner_url,
                  promoContentType: data.promo_content_type,
                  holidayStart: data.holiday_start,
                  holidayEnd: data.holiday_end,
                  // New fields with fallback to constants
                  reviewUrl: data.review_url || DEFAULT_STORE_SETTINGS.reviewUrl,
                  facebookUrl: data.facebook_url || DEFAULT_STORE_SETTINGS.facebookUrl,
                  lineUrl: data.line_url || DEFAULT_STORE_SETTINGS.lineUrl,
                  mapUrl: data.map_url || DEFAULT_STORE_SETTINGS.mapUrl,
                  contactPhone: data.contact_phone || DEFAULT_STORE_SETTINGS.contactPhone,
                  // JSON or Array columns
                  reviewLinks: data.review_links || [],
                  vibeLinks: data.vibe_links || [],
                  eventGalleryUrls: data.event_gallery_urls || DEFAULT_STORE_SETTINGS.eventGalleryUrls, // Map new column
                  newsItems: data.news_items || []
              });
          }
      } catch (err) { console.error("Settings fetch failed", err); }
  };
  const fetchCustomerProfile = async () => {
      if (!isSupabaseConfigured || !customer) return;
      try {
          // Fetch latest profile including addresses
          const { data } = await supabase.from('customers').select('*').eq('phone', customer.phone).single();
          if (data) {
              const updatedProfile: CustomerProfile = {
                  name: data.name,
                  phone: data.phone,
                  password: data.password,
                  address: data.address,
                  birthday: data.birthday,
                  loyaltyPoints: data.loyalty_points,
                  tier: data.tier,
                  savedFavorites: data.saved_favorites || [],
                  orderHistory: data.order_history || [],
                  pdpaAccepted: data.pdpa_accepted,
                  savedAddresses: data.saved_addresses || []
              };
              setCustState(updatedProfile);
              localStorage.setItem('damac_customer', JSON.stringify(updatedProfile));
          }
      } catch (err) { console.error("Profile fetch failed", err); }
  }
  
  useEffect(() => {
    if (isSupabaseConfigured) {
        fetchMenu();
        fetchToppings();
        fetchOrders();
        fetchSettings();
        
        const subscription = supabase.channel('realtime_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
            fetchOrders(); // Reload orders when change happens
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, fetchMenu)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, fetchSettings)
        .subscribe();
        
        // Polling fallback every 5 seconds to ensure status updates even if realtime is flaky
        const interval = setInterval(() => {
             fetchOrders();
        }, 5000);
        
        return () => { 
            subscription.unsubscribe(); 
            clearInterval(interval);
        }
    }
  }, []);

  // Update customer profile on load if logged in
  useEffect(() => {
      if (isSupabaseConfigured && customer) {
          fetchCustomerProfile();
      }
  }, []);

  // Actions
  const addPizza = async (pizza: Pizza) => {
      if (isSupabaseConfigured) {
          try {
            await supabase.from('menu_items').insert([{
                id: pizza.id, name: pizza.name, name_th: pizza.nameTh, 
                description: pizza.description, description_th: pizza.descriptionTh,
                base_price: pizza.basePrice, image: pizza.image, available: pizza.available, category: pizza.category,
                combo_count: pizza.comboCount
            }]);
          } catch (e) { console.error(e); }
      } 
      // Always update local state for immediate feedback
      setMenu(prev => [...prev, pizza]);
  };
  const updatePizza = async (pizza: Pizza) => {
      if (isSupabaseConfigured) {
          try {
            await supabase.from('menu_items').update({
                name: pizza.name, name_th: pizza.nameTh, 
                description: pizza.description, description_th: pizza.descriptionTh,
                base_price: pizza.basePrice, image: pizza.image, available: pizza.available, category: pizza.category,
                combo_count: pizza.comboCount
            }).eq('id', pizza.id);
          } catch(e) { console.error(e); }
      }
      // Always update local
      setMenu(prev => prev.map(p => p.id === pizza.id ? pizza : p));
  };
  const deletePizza = async (id: string) => {
      if (isSupabaseConfigured) {
          try { await supabase.from('menu_items').delete().eq('id', id); } catch(e) { console.error(e); }
      }
      setMenu(prev => prev.filter(p => p.id !== id));
  };
  const updatePizzaPrice = async (id: string, newPrice: number) => {
      const p = menu.find(i => i.id === id);
      if (p) await updatePizza({ ...p, basePrice: newPrice });
  };
  const togglePizzaAvailability = async (id: string) => {
      const p = menu.find(i => i.id === id);
      if (p) await updatePizza({ ...p, available: !p.available });
  };
  const toggleBestSeller = async (id: string) => {
      const p = menu.find(i => i.id === id);
      if (p) {
          const newVal = !p.isBestSeller;
          if (isSupabaseConfigured) {
              try {
                await supabase.from('menu_items').update({ is_best_seller: newVal }).eq('id', id);
              } catch(e) { console.error(e); }
          }
          setMenu(prev => prev.map(item => item.id === id ? {...item, isBestSeller: newVal} : item));
      }
  }

  const generateLuckyPizza = () => {
      const pizzaBase = menu.find(p => p.name.includes("Create Your Own"));
      if (!pizzaBase) return null;
      
      const randomToppings: Topping[] = [];
      const numToppings = Math.floor(Math.random() * 3) + 2; // 2-4 toppings
      const shuffled = [...toppings].sort(() => 0.5 - Math.random());
      
      for(let i=0; i<numToppings; i++) {
          if (shuffled[i]) randomToppings.push(shuffled[i]);
      }
      return { pizza: pizzaBase, toppings: randomToppings };
  };

  const seedDatabase = async () => {
      if (!isSupabaseConfigured) {
          alert("Database not connected. Cannot upload.");
          return;
      }
      const confirmUpload = window.confirm("This will upload all the latest Menu Items and Toppings from the code to the Database. It will overwrite existing items with the same ID. Continue?");
      if (!confirmUpload) return;

      try {
          // Upload Menu
          for (const p of INITIAL_MENU) {
              const { error } = await supabase.from('menu_items').upsert({
                  id: p.id, name: p.name, name_th: p.nameTh, 
                  base_price: p.basePrice, description: p.description, 
                  description_th: p.descriptionTh, image: p.image, 
                  category: p.category, available: p.available, 
                  is_best_seller: p.isBestSeller, combo_count: p.comboCount
              });
              if (error) {
                  if (error.code === '42703') {
                      alert("Database Error: Column missing. Please run the SQL script provided in the Supabase SQL Editor to update your table structure.");
                      return;
                  }
                  console.error("Menu Seed Error", error);
              }
          }
          // Upload Toppings
          for (const t of INITIAL_TOPPINGS) {
              // Try catch for category column specifically (in case user schema is old)
              try {
                  const { error } = await supabase.from('toppings').upsert({
                      id: t.id, name: t.name, name_th: t.nameTh, price: t.price,
                      category: t.category 
                  });
                  if (error) throw error;
              } catch (e: any) {
                  if (e.code === '42703') {
                      alert("Database Error: Column missing. Please run the SQL script.");
                      return;
                  }
                  // Fallback: Try without category if column missing
                   await supabase.from('toppings').upsert({
                      id: t.id, name: t.name, name_th: t.nameTh, price: t.price
                  });
              }
          }
          alert("Menu uploaded to database successfully! Your app is now in sync.");
          fetchMenu(); // Refresh
          fetchToppings(); // Refresh
      } catch (err) {
          console.error("Seeding failed", err);
          alert("Seeding failed. Check console for details.");
      }
  };

  const addTopping = async (topping: Topping) => {
      if (isSupabaseConfigured) {
          try {
            await supabase.from('toppings').insert([{
                id: topping.id, name: topping.name, name_th: topping.nameTh, price: topping.price, category: topping.category
            }]);
          } catch(e) { console.error(e); }
      }
      setToppings(prev => [...prev, topping]);
  };
  const deleteTopping = async (id: string) => {
      if (isSupabaseConfigured) {
          try { await supabase.from('toppings').delete().eq('id', id); } catch(e) { console.error(e); }
      }
      setToppings(prev => prev.filter(t => t.id !== id));
  };
  
  // Cart
  const addToCart = (item: CartItem) => setCart(prev => [...prev, item]);
  const updateCartItemQuantity = (itemId: string, delta: number) => {
      setCart(prev => prev.map(item => {
          if (item.id === itemId) {
              const newQty = Math.max(1, item.quantity + delta);
              return { ...item, quantity: newQty, totalPrice: (item.totalPrice / item.quantity) * newQty };
          }
          return item;
      }));
  };
  const updateCartItem = (updatedItem: CartItem) => {
      setCart(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };
  const removeFromCart = (itemId: string) => setCart(prev => prev.filter(item => item.id !== itemId));
  const clearCart = () => setCart([]);
  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  // Customer
  const setCustomer = async (profile: CustomerProfile) => {
      setCustState(profile);
      localStorage.setItem('damac_customer', JSON.stringify(profile));
      // Sync to DB
      if (isSupabaseConfigured) {
          try {
            const payload: any = {
                phone: profile.phone, 
                name: profile.name, 
                address: profile.address, 
                birthday: profile.birthday, 
                password: profile.password,
                loyalty_points: profile.loyaltyPoints, 
                tier: profile.tier,
                saved_favorites: profile.savedFavorites, 
                order_history: profile.orderHistory
            };
            
            if (profile.pdpaAccepted !== undefined) payload.pdpa_accepted = profile.pdpaAccepted;
            if (profile.savedAddresses !== undefined) payload.saved_addresses = profile.savedAddresses;

            await supabase.from('customers').upsert(payload);
          } catch(e) { console.error("Customer sync failed", e); }
      }
  };
  
  // Smart Register / Reset Password
  const registerCustomer = async (newProfile: CustomerProfile): Promise<'created' | 'updated'> => {
      let existingPoints = 0;
      let existingHistory: string[] = [];
      let existingFavorites: SavedFavorite[] = [];
      let existingTier: 'Bronze' | 'Silver' | 'Gold' | undefined = undefined;
      let action: 'created' | 'updated' = 'created';

      if (isSupabaseConfigured) {
          // Check if user exists
          try {
              const { data } = await supabase.from('customers').select('*').eq('phone', newProfile.phone).single();
              if (data) {
                  // User exists! Preserve their valuable data
                  action = 'updated';
                  existingPoints = data.loyalty_points || 0;
                  existingHistory = data.order_history || [];
                  existingFavorites = data.saved_favorites || [];
                  existingTier = data.tier;
              }
          } catch (e) { console.warn("Error checking existing customer", e); }
      }

      // Merge new details with existing history
      const finalProfile: CustomerProfile = {
          ...newProfile,
          loyaltyPoints: existingPoints,
          orderHistory: existingHistory,
          savedFavorites: existingFavorites,
          tier: existingTier
      };
      
      await setCustomer(finalProfile);
      return action;
  };
  
  const getAllCustomers = async () => {
      if (!isSupabaseConfigured) return [];
      try {
          const { data, error } = await supabase.from('customers').select('name, phone, loyalty_points, tier, created_at, birthday, address, order_history');
          if (error) throw error;
          
          // Format data for CSV
          return data.map((c: any) => ({
              Name: c.name,
              Phone: c.phone,
              Points: c.loyalty_points,
              Tier: c.tier,
              Joined: new Date(c.created_at).toLocaleDateString(),
              Birthday: c.birthday,
              Address: c.address ? c.address.replace(/[\n,]/g, ' ') : '', // Escape commas
              OrdersCount: c.order_history ? c.order_history.length : 0
          }));
      } catch (e) {
          console.error("Export failed", e);
          return [];
      }
  };
  
  const customerLogin = async (phone: string, password: string): Promise<boolean> => {
      if (!isSupabaseConfigured) {
          // If DB is offline, check local storage or basic bypass for demo purposes
          const saved = localStorage.getItem('damac_customer');
          if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed.phone === phone) { // Very basic "offline" check
                  setCustState(parsed);
                  return true;
              }
          }
          alert("Database not connected and no local profile found.");
          return false;
      }
      try {
          const { data, error } = await supabase.from('customers')
              .select('*')
              .eq('phone', phone)
              .eq('password', password)
              .single();
          
          if (data && !error) {
              const profile: CustomerProfile = {
                  name: data.name,
                  phone: data.phone,
                  password: data.password,
                  address: data.address,
                  birthday: data.birthday,
                  loyaltyPoints: data.loyalty_points,
                  tier: data.tier,
                  savedFavorites: data.saved_favorites || [],
                  orderHistory: data.order_history || [],
                  pdpaAccepted: data.pdpa_accepted,
                  savedAddresses: data.saved_addresses || []
              };
              setCustState(profile);
              localStorage.setItem('damac_customer', JSON.stringify(profile));
              return true;
          }
      } catch (e) {
          console.error("Login failed", e);
      }
      return false;
  };

  const addToFavorites = async (name: string, pizzaId: string, toppings: Topping[]) => {
      if (!customer) return;
      const newFav: SavedFavorite = {
          id: Date.now().toString(),
          name, pizzaId, toppings
      };
      const updated = { ...customer, savedFavorites: [...(customer.savedFavorites || []), newFav] };
      await setCustomer(updated);
  };
  const reorderItem = (orderId: string) => {
      const order = orders.find(o => o.id === orderId);
      if (order) {
          order.items.forEach(item => {
              addToCart({ ...item, id: Date.now().toString() + Math.random() }); // New ID for new cart item
          });
      }
  };
  const claimReward = () => {
      if (!customer || customer.loyaltyPoints < 10) return false;
      const pizza = menu.find(p => p.basePrice <= 380 && p.category === 'pizza') || menu[0];
      addToCart({
          id: 'reward-' + Date.now(),
          pizzaId: pizza.id,
          name: `🏆 FREE ${pizza.name}`,
          nameTh: `🏆 ฟรี ${pizza.nameTh || pizza.name}`,
          basePrice: 0,
          selectedToppings: [],
          quantity: 1,
          totalPrice: 0
      });
      // Deduct points
      const updated = { ...customer, loyaltyPoints: customer.loyaltyPoints - 10 };
      setCustomer(updated);
      return true;
  };

  // Orders
  const placeOrder = async (type: OrderType, details: any = {}): Promise<boolean> => {
    // If DB is offline, we proceed with local state to allow the app to function as a demo/offline POS
    try {
        const { note, delivery, paymentMethod, pickupTime, tableNumber, source = 'store', status } = details;
        
        // Save address if new (only for store orders with a logged in customer)
        if (source === 'store' && customer && type === 'delivery' && delivery?.address) {
            const currentSaved = customer.savedAddresses || [];
            if (!currentSaved.includes(delivery.address)) {
                const newSavedAddresses = [...currentSaved, delivery.address];
                // Note: setCustomer handles its own errors silently
                try {
                     await setCustomer({ ...customer, savedAddresses: newSavedAddresses, address: delivery.address });
                } catch (e) { console.warn("Could not save address, continuing", e); }
            }
        }
        
        // Calculate Net Revenue (Deduct GP)
        const gpRate = GP_RATES[source as OrderSource] || 0;
        const netAmount = cartTotal * (1 - gpRate);

        const newOrder: Order = {
            id: Date.now().toString(),
            customerName: customer?.name || 'Guest',
            customerPhone: customer?.phone || 'Guest',
            type,
            source: source,
            // Use status from details, else default: 'pending' for store/POS (unpaid), 'confirmed' for external
            status: status || (source === 'store' ? 'pending' : 'confirmed'),
            items: cart,
            totalAmount: cartTotal,
            netAmount: Math.round(netAmount || 0),
            createdAt: new Date().toISOString(),
            note: note || '',
            deliveryAddress: delivery?.address,
            deliveryZone: delivery?.zoneName,
            deliveryFee: delivery?.fee,
            paymentMethod,
            pickupTime,
            tableNumber
        };
        
        // SAVE ORDER ID TO LOCAL STORAGE FOR GUEST TRACKING
        localStorage.setItem('damac_last_order', newOrder.id);

        // Always update local state first for responsiveness
        setOrders(prev => [newOrder, ...prev]);
        
        // Loyalty Points (Only for Store Orders)
        if (customer && source === 'store') {
            const pizzasCount = cart.filter(i => menu.find(m => m.id === i.pizzaId)?.category === 'pizza').length;
            if (pizzasCount > 0) {
                const updated = { 
                    ...customer, 
                    loyaltyPoints: customer.loyaltyPoints + pizzasCount,
                    orderHistory: [newOrder.id, ...(customer.orderHistory || [])]
                };
                // setCustomer handles its own errors
                try {
                     await setCustomer(updated);
                } catch(e) { console.warn("Could not update points", e); }
            }
        }

        // Attempt DB Sync
        if (isSupabaseConfigured) {
            try {
                const { error } = await supabase.from('orders').insert([{
                    id: newOrder.id,
                    customer_name: newOrder.customerName,
                    customer_phone: newOrder.customerPhone,
                    type: newOrder.type,
                    source: newOrder.source,
                    status: newOrder.status,
                    total_amount: newOrder.totalAmount,
                    net_amount: newOrder.netAmount,
                    note: newOrder.note,
                    delivery_address: newOrder.deliveryAddress,
                    delivery_zone: newOrder.deliveryZone,
                    delivery_fee: newOrder.deliveryFee,
                    payment_method: newOrder.paymentMethod,
                    pickup_time: newOrder.pickupTime,
                    table_number: newOrder.tableNumber,
                    items: newOrder.items
                }]);

                if (error) {
                    console.error("Supabase Order Insert Error:", error);
                }
            } catch (err) {
                console.error("Supabase Connection Error (Swallowed):", err);
                // Swallow "Failed to fetch" errors here so app continues offline
            }
        }

        clearCart();
        return true;
    } catch (criticalError) {
        console.error("Critical Error in placeOrder:", criticalError);
        alert("An unexpected error occurred, but we are attempting to process your request locally.");
        return true; // Return true to close UI even if critical error logic happens
    }
  };

  // --- Missing Function implementations ---

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (isSupabaseConfigured) {
        try {
            await supabase.from('orders').update({ status }).eq('id', orderId);
        } catch (e) { console.error(e); }
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const completeOrder = async (orderId: string, paymentDetails: { paymentMethod: PaymentMethod, note?: string }) => {
    // 1. Find Order locally
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // 2. Prepare Updates
    const updatedOrder = { 
        ...order, 
        status: 'completed' as OrderStatus, 
        paymentMethod: paymentDetails.paymentMethod,
        note: (order.note ? order.note + '. ' : '') + (paymentDetails.note || '')
    };
    
    // 3. Update Local State Immediately
    setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));

    // 4. Update Database
    if (isSupabaseConfigured) {
        try {
            await supabase.from('orders').update({ 
                status: 'completed',
                payment_method: paymentDetails.paymentMethod,
                note: updatedOrder.note
            }).eq('id', orderId);
        } catch (e) { 
            console.error("DB Update Failed for CompleteOrder", e); 
            // Optional: Revert local state or show error if critical
        }
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (isSupabaseConfigured) {
        try {
            await supabase.from('orders').delete().eq('id', orderId);
        } catch (e) { console.error(e); }
    }
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const addExpense = async (expense: Expense) => {
    if (isSupabaseConfigured) {
        try {
            await supabase.from('expenses').insert([{
                id: expense.id, description: expense.description, amount: expense.amount, 
                category: expense.category, date: expense.date, note: expense.note
            }]);
        } catch (e) { console.error(e); }
    }
    setExpenses(prev => [...prev, expense]);
  };

  const deleteExpense = async (id: string) => {
    if (isSupabaseConfigured) {
         try { await supabase.from('expenses').delete().eq('id', id); } catch(e) {}
    }
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const toggleStoreStatus = async (isOpen: boolean, message?: string) => {
    const newSettings = { ...storeSettings, isOpen, closedMessage: message || storeSettings.closedMessage };
    if (isSupabaseConfigured) {
        try {
            await supabase.from('store_settings').update({ 
                is_open: isOpen, 
                closed_message: message || storeSettings.closedMessage 
            }).eq('id', 1); // Assuming single row
        } catch (e) { console.error(e); }
    }
    setStoreSettings(newSettings);
  };

  const updateStoreSettings = async (settings: Partial<StoreSettings>) => {
    const newSettings = { ...storeSettings, ...settings };
    if (isSupabaseConfigured) {
         try {
             const payload: any = {};
             if (settings.promoBannerUrl !== undefined) payload.promo_banner_url = settings.promoBannerUrl;
             if (settings.promoContentType !== undefined) payload.promo_content_type = settings.promoContentType;
             if (settings.holidayStart !== undefined) payload.holiday_start = settings.holidayStart;
             if (settings.holidayEnd !== undefined) payload.holiday_end = settings.holidayEnd;
             if (settings.reviewUrl !== undefined) payload.review_url = settings.reviewUrl;
             if (settings.facebookUrl !== undefined) payload.facebook_url = settings.facebookUrl;
             if (settings.lineUrl !== undefined) payload.line_url = settings.lineUrl;
             if (settings.mapUrl !== undefined) payload.map_url = settings.mapUrl;
             if (settings.contactPhone !== undefined) payload.contact_phone = settings.contactPhone;
             if (settings.promptPayNumber !== undefined) payload.prompt_pay_number = settings.promptPayNumber; 
             if (settings.reviewLinks !== undefined) payload.review_links = settings.reviewLinks;
             if (settings.vibeLinks !== undefined) payload.vibe_links = settings.vibeLinks;
             if (settings.eventGalleryUrls !== undefined) payload.event_gallery_urls = settings.eventGalleryUrls;
             
             await supabase.from('store_settings').update(payload).eq('id', 1);
         } catch (e) { console.error(e); }
    }
    setStoreSettings(newSettings);
  };

  const generateTimeSlots = (dateOffset: number = 0) => {
    const slots: string[] = [];
    const startHour = OPERATING_HOURS.open;
    const endHour = OPERATING_HOURS.close;
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;

    for (let h = startHour; h < endHour; h += 0.5) {
        // If today (offset 0), only show future slots + buffer (e.g. 30 mins)
        if (dateOffset === 0) {
            if (h > currentHour + 0.5) {
                const hour = Math.floor(h);
                const minute = (h % 1) * 60;
                slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
            }
        } else {
            const hour = Math.floor(h);
            const minute = (h % 1) * 60;
            slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
    }
    return slots;
  };

  const addNewsItem = async (item: NewsItem) => {
    const newItems = [item, ...(storeSettings.newsItems || [])];
    if (isSupabaseConfigured) {
        try {
            await supabase.from('store_settings').update({ news_items: newItems }).eq('id', 1);
        } catch (e) { console.error(e); }
    }
    setStoreSettings(prev => ({ ...prev, newsItems: newItems }));
  };

  const deleteNewsItem = async (id: string) => {
    const newItems = (storeSettings.newsItems || []).filter(i => i.id !== id);
    if (isSupabaseConfigured) {
        try {
            await supabase.from('store_settings').update({ news_items: newItems }).eq('id', 1);
        } catch (e) { console.error(e); }
    }
    setStoreSettings(prev => ({ ...prev, newsItems: newItems }));
  };

  return (
    <StoreContext.Provider value={{
        language, toggleLanguage, t, getLocalizedItem,
        currentView, navigateTo,
        isAdminLoggedIn, adminLogin, adminLogout,
        shopLogo, updateShopLogo,
        menu, addPizza, updatePizza, deletePizza, updatePizzaPrice, togglePizzaAvailability, toggleBestSeller, generateLuckyPizza, seedDatabase,
        toppings, addTopping, deleteTopping,
        cart, addToCart, removeFromCart, updateCartItemQuantity, updateCartItem, clearCart, cartTotal,
        customer, setCustomer, registerCustomer, customerLogin, getAllCustomers, addToFavorites, claimReward,
        orders, placeOrder, updateOrderStatus, completeOrder, deleteOrder, reorderItem, fetchOrders,
        expenses, addExpense, deleteExpense,
        isStoreOpen, isHoliday, closedMessage: storeSettings.closedMessage, storeSettings, toggleStoreStatus, updateStoreSettings, generateTimeSlots, canOrderForToday,
        addNewsItem, deleteNewsItem,
        tableSession
    }}>
        {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
