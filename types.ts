

export interface Topping {
  id: string;
  name: string;
  nameTh?: string; // Thai Name
  price: number;
  category?: 'sauce' | 'cheese' | 'meat' | 'vegetable' | 'seasoning' | 'other';
  image?: string; // New: Topping Image
  available?: boolean; // New: Stock status
}

export type ProductCategory = 'pizza' | 'pasta' | 'appetizer' | 'salad' | 'drink' | 'promotion' | 'cake' | 'rice';

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
  isBestSeller?: boolean;
  comboCount?: number; // New: How many pizzas allowed in this combo
  allowedPromotions?: string[]; // IDs of promotions this item can be added to. If empty/undefined, allowed in all.
  badge?: string; // Promo badge (e.g., 'New', 'Promo')
  badgeTh?: string; // Thai Promo badge (e.g., 'เมนูใหม่', 'เมนูประจำเดือน')
}

export interface SubItem {
    pizzaId: string;
    name: string;
    nameTh?: string;
    toppings: Topping[];
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
  subItems?: SubItem[]; // New: Stores choices for combos
  specialInstructions?: string; // New: User comments (e.g. "No Spicy")
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
  password?: string; // New: Password for login
  favoritePizza?: string;
  address?: string; // Current default address
  savedAddresses?: string[]; // New: History of addresses
  birthday?: string;
  loyaltyPoints: number; // 1 point per pizza ordered
  tier?: 'Bronze' | 'Silver' | 'Gold';
  savedFavorites: SavedFavorite[];
  orderHistory: string[]; // List of Order IDs
  pdpaAccepted?: boolean; // New: PDPA Consent
}

export type OrderType = 'dine-in' | 'online' | 'delivery';
export type OrderSource = 'store' | 'grab' | 'lineman' | 'robinhood' | 'foodpanda' | 'shopeefood' | 'other';
export type OrderStatus = 'pending' | 'confirmed' | 'acknowledged' | 'cooking' | 'ready' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'qr_transfer' | 'thai_chuay_thai';
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
  deliveryFee?: number | 'pending';

  // New Features
  tableNumber?: string;
  paymentMethod?: PaymentMethod;
  pickupTime?: string;
  deliveryPlatformRef?: string;
  rating?: number;
  comment?: string;

  // Partner Cafe QR parameters
  partnerId?: string;
  partnerCommissionAmount?: number;

  // Discount & Promo code
  promoCode?: string;
  discountAmount?: number;
}

export type PromoDiscountType = 'percentage' | 'fixed_order' | 'fixed_delivery';

export interface PromoCode {
  id: string;
  code: string; // e.g. "BOI3", "FREE50"
  discountType: PromoDiscountType;
  discountValue: number; // percentage value or baht value
  minOrderAmount: number; // 0 if no minimum
  isActive: boolean;
  description?: string;
  descriptionTh?: string;
  maxUsesPerDay?: number;
  currentUses?: number;
  lastUseDate?: string;
  createdAt: string;
}

export interface Partner {
  id: string;
  name: string;
  nameTh?: string;
  commissionPercent: number; // e.g. 10 for 10%
  createdAt: string;
  note?: string;
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

export interface NewsItem {
    id: string;
    title: string;
    summary: string;
    imageUrl: string;
    linkUrl?: string;
    date: string;
}

export interface StoreSettings {
  isOpen: boolean;
  closedMessage: string;
  // Promo / Marketing
  promoBannerUrl?: string; // URL for image or video
  promoContentType?: 'image' | 'video';
  // Holiday
  holidayStart?: string; // ISO Date
  holidayEnd?: string; // ISO Date
  // Contact & Links (Editable)
  reviewUrl?: string; // Main Google Review URL
  facebookUrl?: string;
  lineUrl?: string;
  mapUrl?: string;
  contactPhone?: string;
  
  // Payment
  promptPayNumber?: string; // New: Mobile or Tax ID

  // Delivery 
  storeLocationGps?: string;
  freeDeliveryRadiusKm?: number;
  deliveryFeePerKm?: number;
  baseDeliveryFee?: number;

  // Media Lists
  reviewLinks?: string[]; // Up to 5
  vibeLinks?: string[]; // Up to 5
  eventGalleryUrls?: string[]; // New: Catering Images
  
  newsItems?: NewsItem[];
  partners?: Partner[];
}

export function parseAnyMapLink(text?: string): { lat: number, lng: number } | null {
  if (!text) return null;
  
  // Hardcoded for the specific Pizza Damac short link
  if (text.includes('AipUucBBovnz24gR8')) {
      return { lat: 13.9239103, lng: 100.5220632 };
  }

  // Google Maps URL with 3d...4d, query=, @, or ll=
  const urlMatch = text.match(/3d(-?\d+(?:\.\d+)?).*?4d(-?\d+(?:\.\d+)?)/) || 
                   text.match(/query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) ||
                   text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) ||
                   text.match(/ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (urlMatch) {
      return { lat: parseFloat(urlMatch[1]), lng: parseFloat(urlMatch[2]) };
  }

  // Look for any raw "lat,lng" string
  // Use a heuristic: check if two numbers are separated by comma and look like coords
  const coordMatch = text.match(/(-?\d{1,2}(?:\.\d{3,10})?)\s*,\s*(-?\d{1,3}(?:\.\d{3,10})?)/);
  if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { lat, lng };
      }
  }

  return null;
}

export function parseGPSCoordinates(address?: string) {
  if (!address) return null;
  const match = address.match(/\[(?:พิกัด GPS|GPS Pin):\s*([\d.-]+),\s*([\d.-]+)\]/);
  const linkMatch = address.match(/\[(?:Google Maps Link):\s*(https?:\/\/[^\s\]]+)\]/);
  
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    return {
      lat,
      lng,
      url: linkMatch ? linkMatch[1] : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    };
  } else if (linkMatch) {
    const coords = parseAnyMapLink(linkMatch[1]);
    return {
      lat: coords ? coords.lat : 13.9239103, // Default to Pizza Damac if unresolvable shortlink
      lng: coords ? coords.lng : 100.5220632,
      url: linkMatch[1]
    };
  }
  return null;
}

export function parseDeliveryPhone(address?: string) {
  if (!address) return null;
  const match = address.match(/\[(?:ติดต่อโทร|Phone):\s*([^\]]+)\]/);
  return match ? match[1] : null;
}

