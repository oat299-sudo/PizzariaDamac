
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Pizza, Order, CartItem, CustomerProfile, OrderType, PaymentMethod, AppView, Topping, OrderSource, SavedFavorite } from '../types';
import { INITIAL_MENU, INITIAL_TOPPINGS, GP_RATES } from '../constants';

interface StoreContextType {
  // Navigation
  currentView: AppView;
  navigateTo: (view: AppView) => void;

  // Auth
  isAdminLoggedIn: boolean;
  adminLogin: (u: string, p: string) => boolean;
  adminLogout: () => void;

  // Branding
  shopLogo: string;
  updateShopLogo: (base64: string) => void;

  // Menu
  menu: Pizza[];
  addPizza: (pizza: Pizza) => void;
  updatePizza: (pizza: Pizza) => void;
  deletePizza: (id: string) => void;
  updatePizzaPrice: (id: string, newPrice: number) => void;
  togglePizzaAvailability: (id: string) => void;
  
  // Toppings
  toppings: Topping[];
  addTopping: (topping: Topping) => void;
  deleteTopping: (id: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateCartItemQuantity: (itemId: string, delta: number) => void;
  updateCartItem: (updatedItem: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  
  // Customer
  customer: CustomerProfile | null;
  setCustomer: (profile: CustomerProfile) => void;
  addToFavorites: (name: string, pizzaId: string, toppings: Topping[]) => void;
  claimReward: () => boolean;
  
  // Orders
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
  ) => boolean;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  reorderItem: (orderId: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation State
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const saved = localStorage.getItem('damac_view');
    return (saved as AppView) || 'customer';
  });

  const navigateTo = (view: AppView) => {
    setCurrentView(view);
    localStorage.setItem('damac_view', view);
    if (window.history.pushState) {
        const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.pushState({path:newurl},'',newurl);
    }
  };

  // Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('damac_auth') === 'true';
  });

  const adminLogin = (u: string, p: string) => {
    if (u === 'oat299@gmail.com' && p === 'PizzaDamac2025*') {
        setIsAdminLoggedIn(true);
        sessionStorage.setItem('damac_auth', 'true');
        return true;
    }
    // Keep old login for testing ease if needed, or remove.
    if (u === 'admin' && p === '123') return true; 
    return false;
  };

  const adminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('damac_auth');
    navigateTo('customer');
  };

  // Branding State
  const [shopLogo, setShopLogo] = useState(() => {
    return localStorage.getItem('damac_logo') || '';
  });

  const updateShopLogo = (base64: string) => {
    setShopLogo(base64);
    localStorage.setItem('damac_logo', base64);
  };

  // Menu State
  const [menu, setMenu] = useState<Pizza[]>(() => {
    const saved = localStorage.getItem('damac_menu_v4'); // v4 for promotions/cakes
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });

  // Toppings State
  const [toppings, setToppings] = useState<Topping[]>(() => {
    const saved = localStorage.getItem('damac_toppings');
    return saved ? JSON.parse(saved) : INITIAL_TOPPINGS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('damac_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<CustomerProfile | null>(() => {
      const saved = localStorage.getItem('damac_customer');
      return saved ? JSON.parse(saved) : null;
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('damac_menu_v4', JSON.stringify(menu));
  }, [menu]);

  useEffect(() => {
    localStorage.setItem('damac_toppings', JSON.stringify(toppings));
  }, [toppings]);

  useEffect(() => {
    localStorage.setItem('damac_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
      if (customer) {
          localStorage.setItem('damac_customer', JSON.stringify(customer));
      }
  }, [customer]);


  // Menu Actions
  const addPizza = (pizza: Pizza) => {
    setMenu(prev => [...prev, pizza]);
  };

  const updatePizza = (updatedPizza: Pizza) => {
    setMenu(prev => prev.map(p => p.id === updatedPizza.id ? updatedPizza : p));
  };

  const deletePizza = (id: string) => {
    setMenu(prev => prev.filter(p => p.id !== id));
  };

  const updatePizzaPrice = (id: string, newPrice: number) => {
    setMenu(prev => prev.map(p => p.id === id ? { ...p, basePrice: newPrice } : p));
  };

  const togglePizzaAvailability = (id: string) => {
    setMenu(prev => prev.map(p => p.id === id ? { ...p, available: !p.available } : p));
  };

  // Topping Actions
  const addTopping = (topping: Topping) => {
    setToppings(prev => [...prev, topping]);
  };

  const deleteTopping = (id: string) => {
    setToppings(prev => prev.filter(t => t.id !== id));
  };

  // Cart Actions
  const addToCart = (item: CartItem) => {
    setCart(prev => [...prev, item]);
  };

  const updateCartItemQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
        if (item.id === itemId) {
            const newQuantity = Math.max(1, item.quantity + delta);
            const unitPrice = item.basePrice + item.selectedToppings.reduce((sum, t) => sum + t.price, 0);
            return {
                ...item,
                quantity: newQuantity,
                totalPrice: unitPrice * newQuantity
            };
        }
        return item;
    }));
  };

  const updateCartItem = (updatedItem: CartItem) => {
    setCart(prev => prev.map(item => {
        if (item.id === updatedItem.id) {
             const unitPrice = updatedItem.basePrice + updatedItem.selectedToppings.reduce((sum, t) => sum + t.price, 0);
             return {
                 ...updatedItem,
                 totalPrice: unitPrice * updatedItem.quantity
             };
        }
        return item;
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const clearCart = () => setCart([]);

  // Customer Actions
  const addToFavorites = (name: string, pizzaId: string, toppings: Topping[]) => {
      if (!customer) return;
      const newFav: SavedFavorite = {
          id: 'fav' + Date.now(),
          name,
          pizzaId,
          toppings
      };
      setCustomer({
          ...customer,
          savedFavorites: [...(customer.savedFavorites || []), newFav]
      });
  };

  const claimReward = () => {
      if (!customer || customer.loyaltyPoints < 10) return false;
      
      // Add Free Pizza Damac
      const rewardPizza = menu.find(p => p.name === "Pizza Damac") || menu[0];
      addToCart({
          id: 'reward-' + Date.now(),
          pizzaId: rewardPizza.id,
          name: rewardPizza.name + " (Reward)",
          basePrice: 0,
          quantity: 1,
          selectedToppings: [],
          totalPrice: 0
      });
      
      // Deduct Points
      setCustomer({
          ...customer,
          loyaltyPoints: customer.loyaltyPoints - 10
      });
      return true;
  };

  const reorderItem = (orderId: string) => {
      const order = orders.find(o => o.id === orderId);
      if (order) {
          order.items.forEach(item => {
             addToCart({...item, id: Date.now() + Math.random().toString()}); 
          });
      }
  };

  const placeOrder = (
    type: OrderType, 
    details?: {
      note?: string;
      delivery?: { address: string; zoneName: string; fee: number };
      paymentMethod?: PaymentMethod;
      pickupTime?: string;
      tableNumber?: string;
      source?: OrderSource;
    }
  ) => {
    if (cart.length === 0) return false;
    
    // For online/delivery, require customer
    if ((type === 'online' || type === 'delivery') && !customer) {
      alert("Please register your details first.");
      return false;
    }

    const subTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const deliveryFee = details?.delivery?.fee || 0;
    const totalAmount = subTotal + deliveryFee;
    
    // Calculate Net Amount based on Source GP
    const source = details?.source || 'store';
    const gpRate = GP_RATES[source] || 0;
    const netAmount = totalAmount * (1 - gpRate);

    const newOrder: Order = {
      id: Date.now().toString(),
      customerName: type === 'dine-in' ? (details?.tableNumber ? `Table ${details.tableNumber}` : 'Walk-in') : (customer?.name || 'Guest'),
      customerPhone: customer?.phone || '-',
      type,
      source,
      status: (type === 'online' || type === 'delivery') ? 'pending' : 'confirmed',
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

    setOrders(prev => [newOrder, ...prev]); // Newest first
    
    // Update Loyalty Points & History (Only for Online/Delivery or if customer is linked)
    if (customer && source === 'store') {
        // Count pizzas in cart for loyalty points
        const pizzaCount = cart.filter(i => {
           const menuItem = menu.find(p => p.id === i.pizzaId);
           return menuItem?.category === 'pizza' && i.basePrice > 0; // Exclude free rewards
        }).length;
        
        setCustomer({
            ...customer,
            loyaltyPoints: (customer.loyaltyPoints || 0) + pizzaCount,
            orderHistory: [newOrder.id, ...(customer.orderHistory || [])]
        });
    }

    clearCart();
    return true;
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <StoreContext.Provider value={{
      currentView,
      navigateTo,
      isAdminLoggedIn,
      adminLogin,
      adminLogout,
      shopLogo,
      updateShopLogo,
      menu,
      addPizza,
      updatePizza,
      deletePizza,
      updatePizzaPrice,
      togglePizzaAvailability,
      toppings,
      addTopping,
      deleteTopping,
      cart,
      addToCart,
      updateCartItemQuantity,
      updateCartItem,
      removeFromCart,
      clearCart,
      cartTotal,
      customer,
      setCustomer,
      addToFavorites,
      claimReward,
      orders,
      placeOrder,
      updateOrderStatus,
      reorderItem
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
