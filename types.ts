
export interface Topping {
  id: string;
  name: string;
  price: number;
}

export type ProductCategory = 'pizza' | 'pasta' | 'appetizer' | 'salad' | 'drink' | 'promotion' | 'cake';

export interface Pizza {
  id: string;
  name: string;
  basePrice: number;
  description: string;
  image: string;
  available: boolean;
  category: ProductCategory;
}

export interface CartItem {
  id: string;
  pizzaId: string;
  name: string;
  basePrice: number;
  selectedToppings: Topping[];
  quantity: number;
  totalPrice: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
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
  loyaltyPoints: number; // 1 point per pizza ordered
  savedFavorites: SavedFavorite[];
  orderHistory: string[]; // List of Order IDs
}

export type OrderType = 'dine-in' | 'online' | 'delivery';
export type OrderSource = 'store' | 'grab' | 'lineman' | 'robinhood' | 'foodpanda';
export type OrderStatus = 'pending' | 'confirmed' | 'acknowledged' | 'cooking' | 'ready' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'qr_transfer';
export type AppView = 'customer' | 'kitchen' | 'pos';

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
