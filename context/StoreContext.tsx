
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
  updateTopping: (topping: Topping) => Promise<void>;
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
          try {
            localStorage.setItem('damac_lang', newLang);
          } catch(e) { console.error("Storage Error", e); }
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
    try {
        localStorage.setItem('damac_logo', base64);
    } catch(e) {
        alert("Storage Full: Logo could not be saved locally. It may disappear on refresh.");
        console.error("LocalStorage Quota Exceeded", e);
    }
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
      try {
        localStorage.setItem('damac_menu', JSON.stringify(menu));
      } catch(e) { console.error("Menu Storage Full", e); }
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
      try {
        localStorage.setItem('damac_store_settings', JSON.stringify(storeSettings));
      } catch(e) { console.error("Settings Storage Full", e); }
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
              const mergedToppings = data.map(d => {
                  const local = INITIAL_TOPPINGS.find(t => t.id === d.id);
                  return {
                      ...d, 
                      nameTh: d.name_th,
                      category: d.category || local?.category || 'other',
                      image: d.image || undefined,
                      available: d.available !== false // Default true if null/undefined
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
                  promptPayNumber: data.prompt_pay_number || DEFAULT_STORE_SETTINGS.promptPayNumber,
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
              try {
                localStorage.setItem('damac_customer', JSON.stringify(updatedProfile));
              } catch(e) { console.error("Customer Storage Full", e); }
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'toppings' }, fetchToppings) // Subscribe to toppings
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
              if (error) console.error("Menu Seed Error", error);
          }
          // Upload Toppings
          for (const t of INITIAL_TOPPINGS) {
              const { error } = await supabase.from('toppings').upsert({
                  id: t.id, name: t.name, name_th: t.nameTh, price: t.price,
                  category: t.category, image: t.image, available: t.available
              });
              if (error) console.error("Topping Seed Error", error);
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
                id: topping.id, name: topping.name, name_th: topping.nameTh, price: topping.price, 
                category: topping.category, image: topping.image, available: topping.available
            }]);
          } catch(e) { console.error(e); }
      }
      setToppings(prev => [...prev, topping]);
  };
  
  const updateTopping = async (topping: Topping) => {
      if (isSupabaseConfigured) {
          try {
            await supabase.from('toppings').update({
                name: topping.name, name_th: topping.nameTh, price: topping.price, 
                category: topping.category, image: topping.image, available: topping.available
            }).eq('id', topping.id);
          } catch(e) { console.error(e); }
      }
      setToppings(prev => prev.map(t => t.id === topping.id ? topping : t));
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
      try {
        localStorage.setItem('damac_customer', JSON.stringify(profile));
      } catch(e) { console.error("Customer Storage Full", e); }
      
      // Update Offline Backup
      try {
        const saved = localStorage.getItem('damac_mock_customers');
        let list = saved ? JSON.parse(saved) : [];
        list = list.filter((c: any) => c.phone !== profile.phone);
        list.push(profile);
        localStorage.setItem('damac_mock_customers', JSON.stringify(list));
      } catch(e) { console.error("Mock Customer Storage Full", e); }

      // Sync to DB if connected
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
      let existingSavedAddresses: string[] = [];
      let action: 'created' | 'updated' = 'created';

      if (isSupabaseConfigured) {
          // Check if user exists
          try {
              const { data } = await supabase.from('customers').select('*').eq('phone', newProfile.phone).single();
              if (data) {
                  existingPoints = data.loyalty_points;
                  existingHistory = data.order_history || [];
                  existingFavorites = data.saved_favorites || [];
                  existingTier = data.tier;
                  existingSavedAddresses = data.saved_addresses || [];
                  action = 'updated';
              }
          } catch(e) {}
      } else {
           // Local Storage fallback for mock
           const saved = localStorage.getItem('damac_mock_customers');
           if (saved) {
               const list = JSON.parse(saved);
               const found = list.find((c: any) => c.phone === newProfile.phone);
               if (found) {
                   existingPoints = found.loyaltyPoints;
                   existingHistory = found.orderHistory;
                   existingFavorites = found.savedFavorites;
                   existingTier = found.tier;
                   existingSavedAddresses = found.savedAddresses;
                   action = 'updated';
               }
           }
      }

      const finalProfile: CustomerProfile = {
          ...newProfile,
          loyaltyPoints: existingPoints,
          orderHistory: existingHistory,
          savedFavorites: existingFavorites,
          tier: existingTier,
          savedAddresses: existingSavedAddresses.length > 0 ? existingSavedAddresses : (newProfile.address ? [newProfile.address] : [])
      };

      await setCustomer(finalProfile);
      return action;
  };

  const customerLogin = async (phone: string, pass: string): Promise<boolean> => {
      // First try DB if connected
      if (isSupabaseConfigured) {
          const { data } = await supabase.from('customers').select('*').eq('phone', phone).single();
          if (data && data.password === pass) {
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
              try {
                localStorage.setItem('damac_customer', JSON.stringify(profile));
              } catch(e) { console.error("Login Storage Error", e); }
              return true;
          }
      } 
      
      // Fallback to local mock data (for testing or offline)
      const saved = localStorage.getItem('damac_mock_customers');
      if (saved) {
           const list = JSON.parse(saved);
           const found = list.find((c: any) => c.phone === phone && c.password === pass);
           if (found) {
               setCustState(found);
               try {
                localStorage.setItem('damac_customer', JSON.stringify(found));
               } catch(e) { console.error("Login Storage Error", e); }
               return true;
           }
      }
      return false;
  };

  const getAllCustomers = async () => {
      let dbCustomers = [];
      let localCustomers = [];

      if (isSupabaseConfigured) {
          const { data } = await supabase.from('customers').select('*');
          if (data) dbCustomers = data;
      }
      
      // Merge with offline data
      const saved = localStorage.getItem('damac_mock_customers');
      if (saved) {
          localCustomers = JSON.parse(saved);
      }

      // Combine arrays, removing duplicates based on phone
      const combined = [...dbCustomers];
      for (const local of localCustomers) {
          if (!combined.find(c => c.phone === local.phone)) {
              combined.push(local);
          }
      }
      
      return combined;
  }

  const addToFavorites = async (name: string, pizzaId: string, toppings: Topping[]) => {
      if (!customer) return;
      const newFav: SavedFavorite = { id: Date.now().toString(), name, pizzaId, toppings };
      const updatedFavs = [...customer.savedFavorites, newFav];
      const updatedCustomer = { ...customer, savedFavorites: updatedFavs };
      await setCustomer(updatedCustomer);
  };

  const claimReward = () => {
      if (!customer || customer.loyaltyPoints < 10) return false;
      const updatedCustomer = { ...customer, loyaltyPoints: customer.loyaltyPoints - 10 };
      setCustomer(updatedCustomer);
      return true;
  };

  // Orders
  const placeOrder = async (
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
  ) => {
      // Calculate Total
      const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
      const deliveryFee = details?.delivery?.fee || 0;
      const totalAmount = subtotal + deliveryFee;
      
      // Calculate Net (GP Deduction)
      const source = details?.source || 'store';
      const gpRate = GP_RATES[source] || 0;
      const netAmount = totalAmount * (1 - gpRate);

      const newOrder: Order = {
          id: Date.now().toString(),
          customerName: customer ? customer.name : (details?.tableNumber ? `Table ${details.tableNumber}` : 'Guest'),
          customerPhone: customer ? customer.phone : '',
          type,
          source: source,
          status: details?.status || 'pending',
          items: [...cart],
          totalAmount,
          netAmount,
          createdAt: new Date().toISOString(),
          note: details?.note,
          deliveryAddress: details?.delivery?.address,
          deliveryZone: details?.delivery?.zoneName,
          deliveryFee: details?.delivery?.fee,
          paymentMethod: details?.paymentMethod,
          pickupTime: details?.pickupTime,
          tableNumber: details?.tableNumber
      };

      if (isSupabaseConfigured) {
          try {
             const payload: any = {
                 id: newOrder.id,
                 customer_name: newOrder.customerName,
                 customer_phone: newOrder.customerPhone,
                 type: newOrder.type,
                 source: newOrder.source,
                 status: newOrder.status,
                 items: newOrder.items,
                 total_amount: newOrder.totalAmount,
                 net_amount: newOrder.netAmount,
                 created_at: newOrder.createdAt,
                 note: newOrder.note,
                 delivery_address: newOrder.deliveryAddress,
                 delivery_zone: newOrder.deliveryZone,
                 delivery_fee: newOrder.deliveryFee,
                 payment_method: newOrder.paymentMethod,
                 pickup_time: newOrder.pickupTime,
                 table_number: newOrder.tableNumber
             };
             await supabase.from('orders').insert([payload]);
          } catch(e) { console.error("Order placement failed", e); return false; }
      }

      setOrders(prev => [newOrder, ...prev]);
      
      // Save ID for Guest Tracking
      try {
        localStorage.setItem('damac_last_order', newOrder.id);
      } catch(e) {}
      
      // Update Customer (Loyalty + History + Saved Address)
      if (customer) {
          // Loyalty: 1 point per pizza item
          const pizzaCount = cart.filter(i => {
               const itemDef = menu.find(m => m.id === i.pizzaId);
               return itemDef?.category === 'pizza' || itemDef?.category === 'promotion';
          }).reduce((sum, i) => sum + i.quantity, 0);

          let newPoints = customer.loyaltyPoints + pizzaCount;
          const newHistory = [newOrder.id, ...customer.orderHistory];
          
          let newSavedAddresses = customer.savedAddresses || [];
          if (type === 'delivery' && details?.delivery?.address) {
              if (!newSavedAddresses.includes(details.delivery.address)) {
                  newSavedAddresses = [details.delivery.address, ...newSavedAddresses].slice(0, 5); // Keep last 5
              }
          }

          const updatedCustomer = { 
              ...customer, 
              loyaltyPoints: newPoints, 
              orderHistory: newHistory,
              savedAddresses: newSavedAddresses
          };
          await setCustomer(updatedCustomer);
      }
      
      // Clear Cart if online/delivery or if specifically requested (Store orders might keep cart for next? No, clear it)
      clearCart();
      return true;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
      if (isSupabaseConfigured) {
          await supabase.from('orders').update({ status }).eq('id', orderId);
      }
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };
  
  const completeOrder = async (orderId: string, paymentDetails: { paymentMethod: PaymentMethod, note?: string }) => {
      if (isSupabaseConfigured) {
          await supabase.from('orders').update({ 
              status: 'completed', 
              payment_method: paymentDetails.paymentMethod,
              note: paymentDetails.note // Append or overwrite? Overwrite for now or handle logic
          }).eq('id', orderId);
      }
      setOrders(prev => prev.map(o => o.id === orderId ? { 
          ...o, 
          status: 'completed', 
          paymentMethod: paymentDetails.paymentMethod,
          note: paymentDetails.note ? (o.note ? o.note + '. ' + paymentDetails.note : paymentDetails.note) : o.note
      } : o));
  };

  const deleteOrder = async (orderId: string) => {
      if (isSupabaseConfigured) {
          await supabase.from('orders').delete().eq('id', orderId);
      }
      setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const reorderItem = (orderId: string) => {
      const order = orders.find(o => o.id === orderId);
      if (order) {
          order.items.forEach(item => {
               addToCart({ ...item, id: Date.now() + Math.random().toString() });
          });
      }
  };

  // Expenses
  const addExpense = async (expense: Expense) => {
      if (isSupabaseConfigured) {
          // Assuming 'expenses' table exists
          await supabase.from('expenses').insert([{
              id: expense.id, description: expense.description, amount: expense.amount, 
              category: expense.category, date: expense.date, note: expense.note
          }]);
      }
      setExpenses(prev => [...prev, expense]);
  };
  const deleteExpense = async (id: string) => {
      if (isSupabaseConfigured) {
           await supabase.from('expenses').delete().eq('id', id);
      }
      setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Store Settings
  const toggleStoreStatus = async (isOpen: boolean, message?: string) => {
      const updates: any = { is_open: isOpen };
      if (message !== undefined) updates.closed_message = message;
      
      if (isSupabaseConfigured) {
          await supabase.from('store_settings').update(updates).eq('id', 1); // Assuming single row ID 1
      }
      setStoreSettings(prev => ({ ...prev, isOpen, closedMessage: message || prev.closedMessage }));
  };

  const updateStoreSettings = async (settings: Partial<StoreSettings>) => {
      if (isSupabaseConfigured) {
          // Map camelCase to snake_case for DB
          const payload: any = {};
          if (settings.promoBannerUrl !== undefined) payload.promo_banner_url = settings.promoBannerUrl;
          if (settings.promoContentType !== undefined) payload.promo_content_type = settings.promoContentType;
          if (settings.reviewLinks !== undefined) payload.review_links = settings.reviewLinks;
          if (settings.vibeLinks !== undefined) payload.vibe_links = settings.vibeLinks;
          if (settings.eventGalleryUrls !== undefined) payload.event_gallery_urls = settings.eventGalleryUrls;
          if (settings.holidayStart !== undefined) payload.holiday_start = settings.holidayStart;
          if (settings.holidayEnd !== undefined) payload.holiday_end = settings.holidayEnd;
          if (settings.reviewUrl !== undefined) payload.review_url = settings.reviewUrl;
          if (settings.facebookUrl !== undefined) payload.facebook_url = settings.facebookUrl;
          if (settings.lineUrl !== undefined) payload.line_url = settings.lineUrl;
          if (settings.mapUrl !== undefined) payload.map_url = settings.mapUrl;
          if (settings.contactPhone !== undefined) payload.contact_phone = settings.contactPhone;
          if (settings.promptPayNumber !== undefined) payload.prompt_pay_number = settings.promptPayNumber; // Assuming DB column name

          if (Object.keys(payload).length > 0) {
             const { error } = await supabase.from('store_settings').update(payload).eq('id', 1);
             if (error) {
                 await supabase.from('store_settings').insert([{ id: 1, ...payload }]);
             }
          }
      }
      setStoreSettings(prev => ({ ...prev, ...settings }));
  };
  
  const generateTimeSlots = (dateOffset: number = 0) => {
      const slots: string[] = [];
      const startHour = OPERATING_HOURS.open;
      const endHour = OPERATING_HOURS.close;
      const now = new Date();
      
      // If today, start from current time + 30 mins
      let current = startHour;
      
      // Loop in 30 min increments
      while (current < endHour) {
          const hour = Math.floor(current);
          const minute = (current % 1) * 60;
          
          if (dateOffset === 0) {
              // For Today: Filter past times
              const slotTime = new Date();
              slotTime.setHours(hour, minute, 0, 0);
              const bufferTime = new Date(now.getTime() + 30 * 60000); // +30 mins prep time
              
              if (slotTime > bufferTime) {
                  slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
              }
          } else {
              // Future dates
              slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
          }
          current += 0.5;
      }
      return slots;
  };
  
  const addNewsItem = async (item: NewsItem) => {
       const updatedNews = [item, ...(storeSettings.newsItems || [])];
       if (isSupabaseConfigured) {
           await supabase.from('store_settings').update({ news_items: updatedNews }).eq('id', 1);
       }
       setStoreSettings(prev => ({ ...prev, newsItems: updatedNews }));
  };
  
  const deleteNewsItem = async (id: string) => {
      const updatedNews = (storeSettings.newsItems || []).filter(n => n.id !== id);
      if (isSupabaseConfigured) {
          await supabase.from('store_settings').update({ news_items: updatedNews }).eq('id', 1);
      }
      setStoreSettings(prev => ({ ...prev, newsItems: updatedNews }));
  };

  const value = {
      language, toggleLanguage, t, getLocalizedItem,
      currentView, navigateTo,
      isAdminLoggedIn, adminLogin, adminLogout,
      shopLogo, updateShopLogo,
      menu, addPizza, updatePizza, deletePizza, updatePizzaPrice, togglePizzaAvailability, toggleBestSeller, generateLuckyPizza, seedDatabase,
      toppings, addTopping, updateTopping, deleteTopping,
      cart, addToCart, removeFromCart, updateCartItemQuantity, updateCartItem, clearCart, cartTotal,
      customer, setCustomer, registerCustomer, customerLogin, getAllCustomers, addToFavorites, claimReward,
      orders, placeOrder, updateOrderStatus, completeOrder, deleteOrder, reorderItem, fetchOrders,
      expenses, addExpense, deleteExpense,
      isStoreOpen, isHoliday, closedMessage: storeSettings.closedMessage, storeSettings, toggleStoreStatus, updateStoreSettings, generateTimeSlots, canOrderForToday,
      addNewsItem, deleteNewsItem,
      tableSession
  };

  return (
    <StoreContext.Provider value={value}>
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
