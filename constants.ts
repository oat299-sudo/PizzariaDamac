
import { Pizza, Topping, DeliveryZone, ProductCategory, OrderSource } from './types';

// GP Rates (The % the app takes)
export const GP_RATES: Record<OrderSource, number> = {
  store: 0,
  grab: 0.32,      // 32%
  lineman: 0.32,   // 32%
  robinhood: 0.25, // 25%
  foodpanda: 0.35  // 35%
};

export const INITIAL_MENU: Pizza[] = [
  // PROMOTIONS
  {
    id: 'promo1',
    name: 'Family Combo Set',
    basePrice: 899,
    description: '2 Large Pizzas + 1 Caesar Salad + 1 Garlic Bread + 2 Colas',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'promotion'
  },
  {
    id: 'promo2',
    name: 'Duo Delight',
    basePrice: 599,
    description: '1 Pizza Damac + 1 Spaghetti Carbonara + 2 Drinks',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'promotion'
  },
  // CUSTOM
  {
    id: 'custom_base',
    name: 'Create Your Own Pizza',
    basePrice: 250,
    description: 'Start with our signature dough and tomato sauce base. Add your favorite toppings!',
    image: 'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  // PIZZAS
  {
    id: 'p1',
    name: 'Pizza Damac',
    basePrice: 380,
    description: 'Our signature pizza with premium toppings and secret sauce.',
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  {
    id: 'p2',
    name: 'Pizza Truffle',
    basePrice: 380,
    description: 'Aromatic truffle cream sauce with mushrooms and cheese.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  {
    id: 'p3',
    name: 'Pizza Parmaham',
    basePrice: 450,
    description: 'Classic Italian Parma ham with rocket and parmesan.',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  {
    id: 'p4',
    name: 'Pizza Pepperoni',
    basePrice: 380,
    description: 'Loaded with spicy pepperoni slices and mozzarella.',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  {
    id: 'p5',
    name: 'Pizza 4 Cheese',
    basePrice: 380,
    description: 'Mozzarella, Gorgonzola, Parmesan, and Fontina.',
    image: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  {
    id: 'p6',
    name: 'Pizza Margarita',
    basePrice: 279,
    description: 'Classic tomato, mozzarella, and fresh basil.',
    image: 'https://images.unsplash.com/photo-1595854341653-bd3419714781?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  {
    id: 'p7',
    name: 'Pizza Marinara',
    basePrice: 350,
    description: 'Tomato sauce, garlic, oregano, and extra virgin olive oil.',
    image: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  // APPETIZERS / SNACKS
  {
    id: 's1',
    name: 'Garlic Bread',
    basePrice: 120,
    description: 'Toasted baguette with garlic butter and herbs.',
    image: 'https://images.unsplash.com/photo-1619535860434-7f0863384d41?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'appetizer'
  },
  {
    id: 's2',
    name: 'French Fries',
    basePrice: 90,
    description: 'Crispy golden fries served with ketchup.',
    image: 'https://images.unsplash.com/photo-1573080496987-a199f8cd75ec?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'appetizer'
  },
  // SALADS
  {
    id: 'sl1',
    name: 'Caesar Salad',
    basePrice: 220,
    description: 'Romaine lettuce, croutons, parmesan, and caesar dressing.',
    image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'salad'
  },
  // PASTA
  {
    id: 'pt1',
    name: 'Spaghetti Carbonara',
    basePrice: 280,
    description: 'Authentic creamy sauce with egg yolk, pancetta, and pecorino.',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pasta'
  },
  // CAKES
  {
    id: 'c1',
    name: 'Homemade Cheesecake',
    basePrice: 150,
    description: 'Rich and creamy cheesecake with blueberry topping.',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'cake'
  },
  {
    id: 'c2',
    name: 'Dark Chocolate Fudge',
    basePrice: 160,
    description: 'Decadent dark chocolate cake made by our expert friend.',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'cake'
  },
  // DRINKS
  {
    id: 'd1',
    name: 'Cola',
    basePrice: 40,
    description: 'Ice cold refreshing cola.',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'drink'
  },
  {
    id: 'd2',
    name: 'Italian Soda',
    basePrice: 80,
    description: 'Sparkling soda with fruit syrup.',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'drink'
  }
];

export const CATEGORIES: {id: ProductCategory; label: string}[] = [
  { id: 'promotion', label: 'Pro & Combo' },
  { id: 'pizza', label: 'Pizza' },
  { id: 'cake', label: 'Cakes' },
  { id: 'pasta', label: 'Pasta' },
  { id: 'appetizer', label: 'Snacks' },
  { id: 'salad', label: 'Salads' },
  { id: 'drink', label: 'Drinks' },
];

export const INITIAL_TOPPINGS: Topping[] = [
  { id: 't1', name: 'Extra Cheese', price: 50 },
  { id: 't2', name: 'Mushrooms', price: 30 },
  { id: 't3', name: 'Black Olives', price: 30 },
  { id: 't4', name: 'Onions', price: 20 },
  { id: 't5', name: 'Bacon', price: 40 },
  { id: 't6', name: 'Ham', price: 40 },
  { id: 't7', name: 'Pineapple', price: 30 },
  { id: 't8', name: 'Bell Peppers', price: 25 },
  { id: 't9', name: 'Pepperoni', price: 50 },
  { id: 't10', name: 'Parma Ham', price: 80 },
];

export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: 'z1', name: 'Zone A: Nearby (< 2km)', fee: 20 },
  { id: 'z2', name: 'Zone B: Nonthaburi Center (2-5km)', fee: 40 },
  { id: 'z3', name: 'Zone C: Outer Ring (5-10km)', fee: 80 },
  { id: 'z4', name: 'Zone D: Long Distance (> 10km)', fee: 150 },
];
