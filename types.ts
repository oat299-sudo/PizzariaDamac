
export interface Topping {
  id: string;
  name: string;
  nameTh?: string; // Thai Name
  price: number;
}

export type ProductCategory = 'pizza' | 'pasta' | 'appetizer' | 'salad' | 'drink' | 'promotion' | 'cake';

export interface Pizza {
  id: string;
  name: string;
  nameTh?: string; // Thai Name
  basePrice: number;
  description: string;
  descriptionTh?: string; // Thai Description
  image: string;
  available: boolean;
  category: ProductCategory;
}

export interface CartItem {
  id: string;
  pizzaId: string;
  name: string;
  nameTh?: string; // Store localized name in cart
  basePrice: number;
  selectedToppings: Topping[];
  quantity: number;
  totalPrice: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  nameTh?: string;
  fee: number;
}

export interface SavedFavorite {
  id: string;
  name: string;
  pizzaId: string;
  toppings: Topping[];
}

export interface CustomerProfile {
  name: string;
  phone: string;
  favoritePizza?: string;
  address?: string;
  birthday?: string;
  loyaltyPoints: number; // 1 point per pizza ordered
  tier?: 'Bronze' | 'Silver' | 'Gold';
  savedFavorites: SavedFavorite[];
  orderHistory: string[]; // List of Order IDs
}

export type OrderType = 'dine-in' | 'online' | 'delivery';
export type OrderSource = 'store' | 'grab' | 'lineman' | 'robinhood' | 'foodpanda';
export type OrderStatus = 'pending' | 'confirmed' | 'acknowledged' | 'cooking' | 'ready' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'qr_transfer';
export type AppView = 'customer' | 'kitchen' | 'pos';
export type Language = 'en' | 'th';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  type: OrderType;
  source: OrderSource; // Where did the order come from?
  status: OrderStatus;
  items: CartItem[];
  totalAmount: number; // Gross amount
  netAmount: number; // Amount after GP deduction
  createdAt: string;
  note?: string;
  
  // Delivery Specific
  deliveryAddress?: string;
  deliveryZone?: string;
  deliveryFee?: number;

  // New Features
  tableNumber?: string;
  paymentMethod?: PaymentMethod;
  pickupTime?: string;
}

// Accounting
export type ExpenseCategory = 'COGS' | 'Labor' | 'Rent' | 'Utilities' | 'Marketing' | 'Maintenance' | 'Other';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  note?: string;
}

export interface StoreSettings {
  isOpen: boolean;
  closedMessage: string;
}
