
import { Pizza, Topping, DeliveryZone, ProductCategory, OrderSource, ExpenseCategory } from './types';

// Restaurant Location (Lat/Lng for Distance Calc)
export const RESTAURANT_LOCATION = {
  lat: 13.8856, // Approx Nonthaburi coordinates
  lng: 100.5222,
  address: "Pizza Damac, Nonthaburi",
  googleMapsUrl: "https://maps.app.goo.gl/b6QHKHpAhtFbiUbX6"
};

// Operating Hours (24h format)
export const OPERATING_HOURS = {
  open: 11.0, // 11:00 AM
  close: 20.5 // 8:30 PM
};

// GP Rates (The % the app takes)
export const GP_RATES: Record<OrderSource, number> = {
  store: 0,
  grab: 0.32,      // 32%
  lineman: 0.32,   // 32%
  robinhood: 0.25, // 25%
  foodpanda: 0.35  // 35%
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'COGS', 'Labor', 'Rent', 'Utilities', 'Marketing', 'Maintenance', 'Other'
];

// TRANSLATIONS DICTIONARY
export const TRANSLATIONS = {
    en: {
        // General
        login: "Login",
        logout: "Logout",
        username: "Username",
        password: "Password",
        backToHome: "Back to Home",
        staffAccess: "Staff Access",
        kitchen: "Kitchen",
        pos: "POS System",
        kitchenDisplay: "Kitchen Display System",
        realtimeTracking: "Real-time Order Tracking",
        active: "Active",
        
        // Customer View
        welcome: "Welcome",
        loginRegister: "Login / Register",
        myProfile: "My Profile",
        points: "Points",
        toFreePizza: "to Free Pizza",
        claimReward: "Claim Free Pizza",
        savedFavorites: "Saved Favorites",
        recentOrders: "Recent Orders",
        reorder: "Reorder",
        buyAgain: "Buy Again",
        comboMonth: "Combo of the Month",
        orderNow: "Order Now",
        feelingLucky: "Feeling Lucky?",
        fateDecide: "Let fate decide your toppings!",
        addToOrder: "Add to Order",
        customizeToppings: "Customize Toppings",
        soldOut: "SOLD OUT",
        cartEmpty: "Cart is empty",
        yourOrder: "Your Order",
        subtotal: "Subtotal",
        total: "Total",
        deliveryFee: "Delivery Fee",
        placeOrder: "Place Order",
        confirmDelivery: "Confirm Delivery",
        paymentMethod: "Payment Method",
        cash: "Cash",
        qrTransfer: "QR / Transfer",
        pickupTime: "Pickup Time",
        asap: "ASAP (approx 20 mins)",
        later: "Later today",
        deliveryZone: "Delivery Zone",
        deliveryAddress: "Delivery Address",
        savedAddresses: "Saved Addresses",
        selectAddress: "Select a saved address...",
        checkDistance: "Check Distance",
        calculating: "Calculating...",
        distanceFromShop: "You are approx {dist} from Pizza Damac",
        nameCreation: "Name your creation",
        saveFavorite: "Save to Favorites",
        joinDamac: "Join Pizza Damac",
        registerDesc: "Register to earn points and save favorites!",
        startEarning: "Start Earning Points",
        cancel: "Cancel",
        orderReceived: "Order Received!",
        thankYouOrder: "Thank you for your order. Tracking is available in your profile.",
        trackOrder: "Track Order Status",
        reviewGoogle: "Review on Google Maps",
        askChef: "Ask Chef",
        chefRec: "Chef's Recommendation",
        whatMood: "What are you in the mood for?",
        thinking: "Thinking...",
        storeClosed: "Store Closed",
        storeClosedMsg: "We are currently closed. Open 11:00 - 20:30. See you tomorrow.",
        
        // Errors & Validation
        mustRegister: "Please Login or Register to place an order.",
        addressMissing: "Please enter your full delivery address.",
        pdpaLabel: "I accept the Terms & Conditions and consent to data collection under PDPA.",
        pdpaRequired: "You must accept the PDPA terms to register.",

        // Delivery Specific
        deliveryTBD: "Calculated Later",
        deliveryNoticeTitle: "Delivery Fee Notice",
        deliveryNoticeDesc: "We use Lineman/Lalamove. Staff will calculate the exact fee and inform you shortly.",

        // POS
        tableService: "Table Service",
        managerMode: "Manager Mode",
        addItem: "Add Item",
        manageToppings: "Manage Toppings",
        uploadLogo: "Logo",
        edit: "Edit",
        delete: "Delete",
        updateItem: "Update Item",
        saveItem: "Save Item",
        category: "Category",
        name: "Name",
        price: "Price",
        description: "Description",
        imageSource: "Image Source",
        salesReport: "Sales Report",
        accountantReport: "Accountant Report (P&L)",
        grossSales: "Gross Sales",
        netRevenue: "Net Revenue",
        expenses: "Expenses",
        netProfit: "Net Profit",
        transactionHistory: "Transaction History",
        date: "Date",
        type: "Type",
        amount: "Amount",
        recordExpense: "Record New Expense",
        addExpense: "Add Expense",
        note: "Note",
        storeStatus: "Store Status",
        holidayMsg: "Holiday Message",
        
        // Kitchen
        pending: "Pending",
        confirmed: "Confirmed",
        acknowledged: "Prep",
        cooking: "Cooking",
        ready: "Ready",
        completed: "Completed",
        reject: "Reject",
        confirm: "Confirm",
        markReady: "Mark Ready",
        completeOrder: "Complete Order",
        startCooking: "Start Cooking",
        
        // Categories
        cat_promotion: "Pro & Combo",
        cat_pizza: "Pizza",
        cat_cake: "Cakes",
        cat_pasta: "Pasta",
        cat_appetizer: "Snacks",
        cat_salad: "Salads",
        cat_drink: "Drinks",
    },
    th: {
        // General
        login: "เข้าสู่ระบบ",
        logout: "ออกจากระบบ",
        username: "ชื่อผู้ใช้",
        password: "รหัสผ่าน",
        backToHome: "กลับหน้าหลัก",
        staffAccess: "สำหรับพนักงาน",
        kitchen: "ครัว",
        pos: "ระบบขายหน้าร้าน",
        kitchenDisplay: "จอแสดงผลในครัว",
        realtimeTracking: "ติดตามออเดอร์เรียลไทม์",
        active: "ออเดอร์ที่รอ",
        
        // Customer View
        welcome: "ยินดีต้อนรับ",
        loginRegister: "เข้าสู่ระบบ / สมัครสมาชิก",
        myProfile: "ข้อมูลส่วนตัว",
        points: "คะแนน",
        toFreePizza: "จะได้รับพิซซ่าฟรี",
        claimReward: "แลกรับพิซซ่าฟรี",
        savedFavorites: "เมนูโปรดที่บันทึกไว้",
        recentOrders: "ออเดอร์ล่าสุด",
        reorder: "สั่งซ้ำ",
        buyAgain: "สั่งอีกครั้ง",
        comboMonth: "โปรโมชั่นประจำเดือน",
        orderNow: "สั่งเลย",
        feelingLucky: "สุ่มเมนูไหม?",
        fateDecide: "ให้โชคชะตาเลือกหน้าพิซซ่าให้คุณ!",
        addToOrder: "เพิ่มลงตะกร้า",
        customizeToppings: "เลือกท็อปปิ้งเพิ่มเติม",
        soldOut: "หมด",
        cartEmpty: "ตะกร้าว่างเปล่า",
        yourOrder: "ออเดอร์ของคุณ",
        subtotal: "ยอดรวมสินค้า",
        total: "ยอดสุทธิ",
        deliveryFee: "ค่าส่ง",
        placeOrder: "ยืนยันการสั่งซื้อ",
        confirmDelivery: "ยืนยันการจัดส่ง",
        paymentMethod: "วิธีการชำระเงิน",
        cash: "เงินสด",
        qrTransfer: "โอนเงิน / สแกนจ่าย",
        pickupTime: "เวลารับสินค้า",
        asap: "รับทันที (ประมาณ 20 นาที)",
        later: "ระบุเวลาภายหลัง",
        deliveryZone: "โซนจัดส่ง",
        deliveryAddress: "ที่อยู่จัดส่ง",
        savedAddresses: "ที่อยู่ที่บันทึกไว้",
        selectAddress: "เลือกที่อยู่...",
        checkDistance: "เช็คระยะทาง",
        calculating: "กำลังคำนวณ...",
        distanceFromShop: "คุณอยู่ห่างจากร้านประมาณ {dist}",
        nameCreation: "ตั้งชื่อเมนูของคุณ",
        saveFavorite: "บันทึกเป็นเมนูโปรด",
        joinDamac: "สมัครสมาชิก Pizza Damac",
        registerDesc: "สมัครสมาชิกเพื่อสะสมแต้มและบันทึกเมนูโปรด",
        startEarning: "เริ่มสะสมแต้ม",
        cancel: "ยกเลิก",
        orderReceived: "ได้รับออเดอร์แล้ว!",
        thankYouOrder: "ขอบคุณสำหรับการสั่งซื้อ คุณสามารถติดตามสถานะได้ที่เมนูข้อมูลส่วนตัว",
        trackOrder: "ติดตามสถานะออเดอร์",
        reviewGoogle: "รีวิวร้านบน Google Maps",
        askChef: "ถามเชฟ AI",
        chefRec: "เมนูแนะนำจากเชฟ",
        whatMood: "วันนี้อยากทานรสชาติแบบไหน? (เช่น เผ็ด, ชีสเยอะ, มังสวิรัติ)",
        thinking: "กำลังคิด...",
        storeClosed: "ร้านปิด",
        storeClosedMsg: "ขณะนี้ร้านปิดให้บริการ เปิด 11:00 - 20:30 น. เจอกันพรุ่งนี้ครับ",

        // Errors & Validation
        mustRegister: "กรุณาเข้าสู่ระบบ หรือ สมัครสมาชิก ก่อนสั่งซื้อ",
        addressMissing: "กรุณาระบุที่อยู่จัดส่งให้ครบถ้วน",
        pdpaLabel: "ข้าพเจ้ายอมรับเงื่อนไขและยินยอมให้เก็บข้อมูลส่วนบุคคลตาม PDPA",
        pdpaRequired: "กรุณายอมรับเงื่อนไข PDPA เพื่อสมัครสมาชิก",

        // Delivery Specific
        deliveryTBD: "แจ้งภายหลัง",
        deliveryNoticeTitle: "แจ้งเรื่องค่าจัดส่ง",
        deliveryNoticeDesc: "ทางร้านเรียก Lineman/Lalamove ให้ครับ จะแจ้งยอดค่าส่งตามจริงให้ทราบอีกครั้ง",

        // POS
        tableService: "บริการที่โต๊ะ",
        managerMode: "โหมดผู้จัดการ",
        addItem: "เพิ่มเมนู",
        manageToppings: "จัดการท็อปปิ้ง",
        uploadLogo: "โลโก้",
        edit: "แก้ไข",
        delete: "ลบ",
        updateItem: "อัพเดทข้อมูล",
        saveItem: "บันทึกข้อมูล",
        category: "หมวดหมู่",
        name: "ชื่อเมนู",
        price: "ราคา",
        description: "รายละเอียด",
        imageSource: "ลิงก์รูปภาพ",
        salesReport: "รายงานยอดขาย",
        accountantReport: "รายงานบัญชี (กำไร/ขาดทุน)",
        grossSales: "ยอดขายรวม",
        netRevenue: "รายรับสุทธิ",
        expenses: "ค่าใช้จ่าย",
        netProfit: "กำไรสุทธิ",
        transactionHistory: "ประวัติรายการ",
        date: "วันที่",
        type: "ประเภท",
        amount: "จำนวนเงิน",
        recordExpense: "บันทึกค่าใช้จ่ายใหม่",
        addExpense: "เพิ่มค่าใช้จ่าย",
        note: "หมายเหตุ",
        storeStatus: "สถานะร้าน",
        holidayMsg: "ข้อความวันหยุด",

        // Kitchen
        pending: "รอรับออเดอร์",
        confirmed: "รับออเดอร์แล้ว",
        acknowledged: "กำลังเตรียม",
        cooking: "กำลังอบ",
        ready: "เสร็จแล้ว",
        completed: "ปิดออเดอร์",
        reject: "ปฏิเสธ",
        confirm: "รับออเดอร์",
        markReady: "แจ้งว่าเสร็จ",
        completeOrder: "จบงาน",
        startCooking: "เริ่มอบ",

        // Categories
        cat_promotion: "โปรโมชั่น",
        cat_pizza: "พิซซ่า",
        cat_cake: "เค้ก & ของหวาน",
        cat_pasta: "พาสต้า",
        cat_appetizer: "ทานเล่น",
        cat_salad: "สลัด",
        cat_drink: "เครื่องดื่ม",
    }
};

export const INITIAL_MENU: Pizza[] = [
  // PROMOTIONS
  {
    id: 'promo1',
    name: 'Family Combo Set',
    nameTh: 'ชุดครอบครัวสุดคุ้ม',
    basePrice: 899,
    description: '2 Large Pizzas + 1 Caesar Salad + 1 Garlic Bread + 2 Colas',
    descriptionTh: 'พิซซ่าถาดใหญ่ 2 ถาด + ซีซาร์สลัด 1 + ขนมปังกระเทียม 1 + โค้ก 2',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'promotion'
  },
  {
    id: 'promo2',
    name: 'Duo Delight',
    nameTh: 'ชุดดูโอ้ อร่อยคู่',
    basePrice: 599,
    description: '1 Pizza Damac + 1 Spaghetti Carbonara + 2 Drinks',
    descriptionTh: 'พิซซ่าดาแมค 1 ถาด + สปาเก็ตตี้คาโบนาร่า 1 + เครื่องดื่ม 2',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'promotion'
  },
  // CUSTOM
  {
    id: 'custom_base',
    name: 'Create Your Own Pizza',
    nameTh: 'พิซซ่าตามใจคุณ',
    basePrice: 250,
    description: 'Start with our signature dough and tomato sauce base. Add your favorite toppings!',
    descriptionTh: 'เริ่มต้นด้วยแป้งสูตรพิเศษและซอสมะเขือเทศ เลือกท็อปปิ้งได้ตามใจ!',
    image: 'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  // PIZZAS
  {
    id: 'p1',
    name: 'Pizza Damac',
    nameTh: 'พิซซ่า ดาแมค (แนะนำ)',
    basePrice: 380,
    description: 'Our signature pizza with premium toppings and secret sauce.',
    descriptionTh: 'พิซซ่าซิกเนเจอร์ของร้าน มาพร้อมท็อปปิ้งพรีเมียมและซอสสูตรลับ',
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  {
    id: 'p2',
    name: 'Pizza Truffle',
    nameTh: 'พิซซ่า ทรัฟเฟิล',
    basePrice: 380,
    description: 'Aromatic truffle cream sauce with mushrooms and cheese.',
    descriptionTh: 'ซอสครีมเห็ดทรัฟเฟิลหอมกรุ่น พร้อมเห็ดและชีส',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  {
    id: 'p3',
    name: 'Pizza Parmaham',
    nameTh: 'พิซซ่า พาร์มาแฮม',
    basePrice: 450,
    description: 'Classic Italian Parma ham with rocket and parmesan.',
    descriptionTh: 'พาร์มาแฮมอิตาเลียนแท้ เสิร์ฟพร้อมผักร็อกเก็ตและพาร์เมซานชีส',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  {
    id: 'p4',
    name: 'Pizza Pepperoni',
    nameTh: 'พิซซ่า เปปเปอโรนี',
    basePrice: 380,
    description: 'Loaded with spicy pepperoni slices and mozzarella.',
    descriptionTh: 'จัดเต็มด้วยเปปเปอโรนีรสเผ็ดและมอสซาเรลล่าชีส',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  {
    id: 'p5',
    name: 'Pizza 4 Cheese',
    nameTh: 'พิซซ่า 4 ชีส',
    basePrice: 380,
    description: 'Mozzarella, Gorgonzola, Parmesan, and Fontina.',
    descriptionTh: 'คนรักชีสต้องลอง: มอสซาเรลล่า, กอร์กอนโซล่า, พาร์เมซาน และฟอนติน่า',
    image: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  {
    id: 'p6',
    name: 'Pizza Margarita',
    nameTh: 'พิซซ่า มาร์เกริต้า',
    basePrice: 279,
    description: 'Classic tomato, mozzarella, and fresh basil.',
    descriptionTh: 'คลาสสิกด้วยซอสมะเขือเทศ มอสซาเรลล่า และใบโหระพา',
    image: 'https://images.unsplash.com/photo-1595854341653-bd3419714781?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  {
    id: 'p7',
    name: 'Pizza Marinara',
    nameTh: 'พิซซ่า มารินาร่า',
    basePrice: 350,
    description: 'Tomato sauce, garlic, oregano, and extra virgin olive oil.',
    descriptionTh: 'ซอสมะเขือเทศ กระเทียม ออริกาโน และน้ำมันมะกอก (เจ)',
    image: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  // APPETIZERS / SNACKS
  {
    id: 's1',
    name: 'Garlic Bread',
    nameTh: 'ขนมปังกระเทียม',
    basePrice: 120,
    description: 'Toasted baguette with garlic butter and herbs.',
    descriptionTh: 'ขนมปังฝรั่งเศสอบกรอบหน้าเนยกระเทียม',
    image: 'https://images.unsplash.com/photo-1619535860434-7f0863384d41?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'appetizer'
  },
  {
    id: 's2',
    name: 'French Fries',
    nameTh: 'เฟรนช์ฟรายส์',
    basePrice: 90,
    description: 'Crispy golden fries served with ketchup.',
    descriptionTh: 'มันฝรั่งทอดกรอบ เสิร์ฟพร้อมซอสมะเขือเทศ',
    image: 'https://images.unsplash.com/photo-1573080496987-a199f8cd75ec?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'appetizer'
  },
  // SALADS
  {
    id: 'sl1',
    name: 'Caesar Salad',
    nameTh: 'ซีซาร์สลัด',
    basePrice: 220,
    description: 'Romaine lettuce, croutons, parmesan, and caesar dressing.',
    descriptionTh: 'ผักกาดหอม ครูตองซ์ พาร์เมซานชีส และน้ำสลัดซีซาร์',
    image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'salad'
  },
  // PASTA
  {
    id: 'pt1',
    name: 'Spaghetti Carbonara',
    nameTh: 'สปาเก็ตตี้ คาโบนาร่า',
    basePrice: 280,
    description: 'Authentic creamy sauce with egg yolk, pancetta, and pecorino.',
    descriptionTh: 'ซอสครีมเข้มข้น ไข่แดง เบคอน และชีส',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pasta'
  },
  // CAKES
  {
    id: 'c1',
    name: 'Homemade Cheesecake',
    nameTh: 'โฮมเมด ชีสเค้ก',
    basePrice: 150,
    description: 'Rich and creamy cheesecake with blueberry topping.',
    descriptionTh: 'ชีสเค้กเนื้อเนียนนุ่ม ราดซอสบลูเบอร์รี่',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'cake'
  },
  {
    id: 'c2',
    name: 'Dark Chocolate Fudge',
    nameTh: 'เค้กช็อกโกแลตหน้านิ่ม',
    basePrice: 160,
    description: 'Decadent dark chocolate cake made by our expert friend.',
    descriptionTh: 'เค้กช็อกโกแลตเข้มข้น หวานกำลังดี',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'cake'
  },
  // DRINKS
  {
    id: 'd1',
    name: 'Cola',
    nameTh: 'โค้ก',
    basePrice: 40,
    description: 'Ice cold refreshing cola.',
    descriptionTh: 'เย็นซ่า ชื่นใจ',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'drink'
  },
  {
    id: 'd2',
    name: 'Italian Soda',
    nameTh: 'อิตาเลี่ยนโซดา',
    basePrice: 80,
    description: 'Sparkling soda with fruit syrup.',
    descriptionTh: 'น้ำผลไม้โซดา รสชาติเปรี้ยวหวานสดชื่น',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'drink'
  }
];

export const CATEGORIES: {id: ProductCategory; label: string; labelTh: string}[] = [
  { id: 'promotion', label: 'Pro & Combo', labelTh: 'โปรโมชั่น' },
  { id: 'pizza', label: 'Pizza', labelTh: 'พิซซ่า' },
  { id: 'cake', label: 'Cakes', labelTh: 'เค้ก' },
  { id: 'pasta', label: 'Pasta', labelTh: 'พาสต้า' },
  { id: 'appetizer', label: 'Snacks', labelTh: 'ทานเล่น' },
  { id: 'salad', label: 'Salads', labelTh: 'สลัด' },
  { id: 'drink', label: 'Drinks', labelTh: 'เครื่องดื่ม' },
];

export const INITIAL_TOPPINGS: Topping[] = [
  { id: 't1', name: 'Extra Cheese', nameTh: 'เพิ่มชีส', price: 50 },
  { id: 't2', name: 'Mushrooms', nameTh: 'เห็ด', price: 30 },
  { id: 't3', name: 'Black Olives', nameTh: 'มะกอกดำ', price: 30 },
  { id: 't4', name: 'Onions', nameTh: 'หอมใหญ่', price: 20 },
  { id: 't5', name: 'Bacon', nameTh: 'เบคอน', price: 40 },
  { id: 't6', name: 'Ham', nameTh: 'แฮม', price: 40 },
  { id: 't7', name: 'Pineapple', nameTh: 'สับปะรด', price: 30 },
  { id: 't8', name: 'Bell Peppers', nameTh: 'พริกหวาน', price: 25 },
  { id: 't9', name: 'Pepperoni', nameTh: 'เปปเปอโรนี', price: 50 },
  { id: 't10', name: 'Parma Ham', nameTh: 'พาร์มาแฮม', price: 80 },
];

// Delivery Zones (Removed from active logic but kept if needed for reference, 
// though the new requirement handles delivery via Lineman/Lalamove)
export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: 'z1', name: 'Zone A: Nearby (< 2km)', nameTh: 'โซน A: ใกล้ร้าน (< 2กม.)', fee: 20 },
  { id: 'z2', name: 'Zone B: Nonthaburi Center (2-5km)', nameTh: 'โซน B: กลางเมืองนนท์ (2-5กม.)', fee: 40 },
  { id: 'z3', name: 'Zone C: Outer Ring (5-10km)', nameTh: 'โซน C: รอบนอก (5-10กม.)', fee: 80 },
  { id: 'z4', name: 'Zone D: Long Distance (> 10km)', nameTh: 'โซน D: ระยะไกล (> 10กม.)', fee: 150 },
];
