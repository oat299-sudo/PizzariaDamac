
import { Pizza, Topping, DeliveryZone, ProductCategory, OrderSource, ExpenseCategory, StoreSettings } from './types';

// Restaurant Location (Lat/Lng for Distance Calc)
export const RESTAURANT_LOCATION = {
  lat: 13.8856, // Approx Nonthaburi coordinates
  lng: 100.5222,
  address: "Pizza Damac, Nonthaburi",
  googleMapsUrl: "https://share.google/AQcDarbUgO7xteLV3"
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
    isOpen: true,
    closedMessage: '',
    reviewUrl: "https://maps.app.goo.gl/RrpaW1Z5APoz3ucHA", // Updated Link
    facebookUrl: "https://www.facebook.com/p/PIZZA-DAMAC-100076365540304/",
    lineUrl: "https://lin.ee/KlsHunE",
    mapUrl: "https://share.google/AQcDarbUgO7xteLV3",
    contactPhone: "0994979199",
    promptPayNumber: "0994979199", // DEFAULT PROMPTPAY
    promoContentType: 'image',
    promoBannerUrl: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1200&q=80',
    reviewLinks: [
        "https://www.tiktok.com/@yaktautakdakkabbeer/video/7278988315607584006"
    ],
    vibeLinks: [
        "https://www.lemon8-app.com/@midniqhtblues/7241589478358303233?region=th"
    ],
    newsItems: []
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

// Specific Expense Presets requested by User
export const PRESET_EXPENSES = [
    { label: 'ค่าเห็ด (Mushroom)', category: 'COGS' },
    { label: 'ค่าเช่าที่ มีเมฆ (Rent)', category: 'Rent' },
    { label: 'ค่าน้ำ (Water)', category: 'Utilities' },
    { label: 'ค่าไฟ (Electricity)', category: 'Utilities' },
    { label: 'ค่าไส้กรอก Thaisaugesage', category: 'COGS' },
    { label: 'ค่าของ Zaino', category: 'COGS' },
    { label: 'ค่าของ Makro', category: 'COGS' },
    { label: 'ค่าแรง (Labor)', category: 'Labor' },
    { label: 'ค่าน้ำแข็ง (Ice)', category: 'COGS' },
    { label: 'ค่ากล่อง (Boxes)', category: 'COGS' },
    { label: 'ค่าที่รองพิซซ่า (Pizza Support)', category: 'COGS' },
    { label: 'ค่าแผ่นรอง Pizza (Paper)', category: 'COGS' },
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
        vibeReviews: "Highlights & Reviews", // Renamed
        customerReviews: "Highlights & Reviews", // Renamed
        vibeCheck: "Vibe Check",
        newsEvents: "News & Events",
        contactUs: "Contact Us",
        findUs: "Find Us",
        
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
        quickExpense: "Quick Expense",
        mediaManager: "Media Manager",
        
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
        vibeReviews: "ไฮไลท์ & รีวิว", // Renamed
        customerReviews: "ไฮไลท์ & รีวิว", // Renamed
        vibeCheck: "บรรยากาศร้าน",
        newsEvents: "ข่าวสาร & กิจกรรม",
        contactUs: "ติดต่อเรา",
        findUs: "แผนที่ & ติดต่อ",

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
        quickExpense: "เลือกรายการค่าใช้จ่ายด่วน",
        mediaManager: "จัดการสื่อ & แบนเนอร์",

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
  // --- PROMOTIONS & COMBOS (Updated) ---
  {
      id: 'promo_combo_a',
      name: 'Duo Delight (2 Pizzas)',
      nameTh: 'ชุดดูโอ้ (พิซซ่า 2 ถาด)',
      basePrice: 699,
      description: 'Choose any 2 Pizzas. Great for couples!',
      descriptionTh: 'เลือกพิซซ่าหน้าใดก็ได้ 2 ถาด เหมาะสำหรับทาน 2 ท่าน',
      image: 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?auto=format&fit=crop&w=800&q=80',
      available: true,
      category: 'promotion',
      comboCount: 2,
      isBestSeller: true
  },
  {
      id: 'promo_party',
      name: 'Party Feast (3 Pizzas)',
      nameTh: 'ชุดปาร์ตี้ (พิซซ่า 3 ถาด)',
      basePrice: 999,
      description: 'Select 3 Pizzas for the ultimate party.',
      descriptionTh: 'เลือกพิซซ่าหน้าใดก็ได้ 3 ถาด สำหรับปาร์ตี้สุดคุ้ม',
      image: 'https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?auto=format&fit=crop&w=800&q=80',
      available: true,
      category: 'promotion',
      comboCount: 3
  },

  // --- CUSTOM PIZZA ---
  {
    id: 'p_custom',
    name: 'Create Your Own Pizza',
    nameTh: 'พิซซ่าตามใจคุณ (เลือกหน้าเอง)',
    basePrice: 200,
    description: 'Start with a base and add your favorite toppings.',
    descriptionTh: 'เลือกซอส ชีส และท็อปปิ้งได้ตามใจชอบ',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  // --- PIZZAS ---
  {
    id: 'p_damac',
    name: 'Pizza Damac',
    nameTh: 'พิซซ่า ดาแมค',
    basePrice: 380,
    description: 'Signature pizza with premium ingredients.',
    descriptionTh: 'พิซซ่าซิกเนเจอร์ของร้าน วัตถุดิบพรีเมียม',
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza',
    isBestSeller: true
  },
  {
    id: 'p_truffle',
    name: 'Pizza Truffle',
    nameTh: 'พิซซ่า ทรัฟเฟิล',
    basePrice: 480,
    description: 'Aromatic truffle cream sauce with mushrooms.',
    descriptionTh: 'หอมกลิ่นทรัฟเฟิล ซอสครีมเห็ด',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  {
    id: 'p_parma',
    name: 'Pizza Parmaham',
    nameTh: 'พิซซ่า พาร์มาแฮม',
    basePrice: 520,
    description: 'Classic Italian Parma ham with rocket.',
    descriptionTh: 'พาร์มาแฮมอิตาเลียนแท้ และผักร็อกเก็ต',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  {
    id: 'p_4cheese',
    name: 'Pizza 4 Cheeses',
    nameTh: 'พิซซ่า 4 ชีส',
    basePrice: 380,
    description: 'Mozzarella, Gorgonzola, Parmesan, and Fontina.',
    descriptionTh: 'รวมชีส 4 ชนิด หอมมันเข้มข้น',
    image: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  {
    id: 'p_pep',
    name: 'Pizza Pepperoni',
    nameTh: 'พิซซ่า เปปเปอโรนี',
    basePrice: 380,
    description: 'Loaded with spicy pepperoni slices.',
    descriptionTh: 'หน้าเปปเปอโรนีเต็มคำ',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  {
    id: 'p_marg',
    name: 'Pizza Margherita',
    nameTh: 'พิซซ่า มาร์เกริต้า',
    basePrice: 300,
    description: 'Tomato sauce, mozzarella, and fresh basil.',
    descriptionTh: 'ซอสมะเขือเทศ มอสซาเรลล่า และใบโหระพา',
    image: 'https://images.unsplash.com/photo-1595854341653-bd3419714781?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  {
    id: 'p_mari',
    name: 'Pizza Marinara',
    nameTh: 'พิซซ่า มารินาร่า',
    basePrice: 300,
    description: 'Tomato sauce, garlic, oregano (No Cheese).',
    descriptionTh: 'ซอสมะเขือเทศ กระเทียม ออริกาโน (เจ)',
    image: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pizza'
  },
  
  // --- PASTA ---
  {
    id: 'pas_carb',
    name: 'Carbonara',
    nameTh: 'สปาเก็ตตี้ คาโบนาร่า',
    basePrice: 220,
    description: 'Creamy sauce with bacon and parmesan.',
    descriptionTh: 'ซอสครีมเข้มข้น เบคอน และพาร์เมซานชีส',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pasta'
  },
  {
    id: 'pas_bol',
    name: 'Bolognese',
    nameTh: 'สปาเก็ตตี้ ซอสเนื้อ',
    basePrice: 240,
    description: 'Rich tomato meat sauce.',
    descriptionTh: 'ซอสมะเขือเทศเนื้อสับรสกลมกล่อม',
    image: 'https://images.unsplash.com/photo-1622973536968-3ead9e780960?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pasta'
  },
  {
    id: 'pas_truf',
    name: 'Truffle Cream Pasta',
    nameTh: 'พาสต้าครีมทรัฟเฟิล',
    basePrice: 290,
    description: 'Fettuccine with aromatic truffle sauce.',
    descriptionTh: 'เส้นเฟตตูชินีในซอสครีมทรัฟเฟิลหอมกรุ่น',
    image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'pasta'
  },

  // --- SALADS ---
  {
    id: 'sal_caesar',
    name: 'Caesar Salad',
    nameTh: 'ซีซาร์สลัด',
    basePrice: 180,
    description: 'Romaine lettuce, croutons, parmesan, caesar dressing.',
    descriptionTh: 'ผักกาดโรเมน เบคอนกรอบ และน้ำสลัดซีซาร์',
    image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'salad'
  },
  {
    id: 'sal_burrata',
    name: 'Burrata Salad',
    nameTh: 'สลัดบูราต้าชีส',
    basePrice: 350,
    description: 'Fresh Burrata cheese with tomatoes and balsamic.',
    descriptionTh: 'ชีสบูราต้าสด มะเขือเทศ และบัลซามิก',
    image: 'https://images.unsplash.com/photo-1529312266912-b33cf6227e2f?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'salad'
  },

  // --- APPETIZERS ---
  {
    id: 'app_garlic',
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
    id: 'app_fries',
    name: 'French Fries',
    nameTh: 'เฟรนช์ฟรายส์',
    basePrice: 90,
    description: 'Golden crispy fries.',
    descriptionTh: 'มันฝรั่งทอดกรอบ',
    image: 'https://images.unsplash.com/photo-1573080496987-a199f8cd75ec?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'appetizer'
  },

  // --- CAKES ---
  {
    id: 'cake_tira',
    name: 'Tiramisu',
    nameTh: 'ทีรามิสุ',
    basePrice: 160,
    description: 'Classic Italian coffee dessert.',
    descriptionTh: 'เค้กกาแฟสไตล์อิตาเลียน',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'cake'
  },

  // --- DRINKS ---
  {
    id: 'drk_coke',
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
    id: 'drk_water',
    name: 'Mineral Water',
    nameTh: 'น้ำแร่',
    basePrice: 30,
    description: 'Fresh mineral water.',
    descriptionTh: 'น้ำแร่ธรรมชาติ',
    image: 'https://images.unsplash.com/photo-1564414297441-112e3743527d?auto=format&fit=crop&w=800&q=80',
    available: true,
    category: 'drink'
  }
];

export const CATEGORIES: {id: ProductCategory; label: string; labelTh: string}[] = [
  { id: 'promotion', label: 'Pro & Combo', labelTh: 'โปรโมชั่น' },
  { id: 'pizza', label: 'Pizza', labelTh: 'พิซซ่า' },
  { id: 'pasta', label: 'Pasta', labelTh: 'พาสต้า' },
  { id: 'appetizer', label: 'Snacks', labelTh: 'ทานเล่น' },
  { id: 'salad', label: 'Salads', labelTh: 'สลัด' },
  { id: 'cake', label: 'Cakes', labelTh: 'เค้ก' },
  { id: 'drink', label: 'Drinks', labelTh: 'เครื่องดื่ม' },
];

export const INITIAL_TOPPINGS: Topping[] = [
  // 1. SAUCES (Free Choice)
  { id: 'sauce_tomato', name: 'Tomato Sauce', nameTh: 'ซอสมะเขือเทศ', price: 0, category: 'sauce' },
  { id: 'sauce_white', name: 'Béchamel (White Sauce)', nameTh: 'ซอสขาว (เบชาเมล)', price: 0, category: 'sauce' },
  
  // 2. CHEESES
  { id: 'ch_moz', name: 'Mozzarella', nameTh: 'มอสซาเรลล่า', price: 50, category: 'cheese' },
  { id: 'ch_fresh', name: 'Fresh Mozzarella', nameTh: 'เฟรช มอสซาเรลล่า', price: 80, category: 'cheese' },
  { id: 'ch_parm', name: 'Parmesan', nameTh: 'พาร์เมซาน', price: 60, category: 'cheese' },

  // 3. SEASONING
  { id: 'sea_ore', name: 'Oregano', nameTh: 'ออริกาโน่', price: 0, category: 'seasoning' },

  // 4. MEAT
  { id: 't_pep', name: 'Pepperoni', nameTh: 'เปปเปอโรนี', price: 50, category: 'meat' },
  { id: 't_ham', name: 'Ham', nameTh: 'แฮม', price: 40, category: 'meat' },
  { id: 't_bacon', name: 'Bacon', nameTh: 'เบคอน', price: 40, category: 'meat' },
  { id: 't_parma', name: 'Parma Ham', nameTh: 'พาร์มาแฮม', price: 80, category: 'meat' },

  // 5. VEGETABLES
  { id: 't_mush', name: 'Mushrooms', nameTh: 'เห็ด', price: 30, category: 'vegetable' },
  { id: 't_olive', name: 'Black Olives', nameTh: 'มะกอกดำ', price: 30, category: 'vegetable' },
  { id: 't_onion', name: 'Onions', 'nameTh': 'หอมใหญ่', price: 20, category: 'vegetable' },
  { id: 't_bell', name: 'Bell Peppers', nameTh: 'พริกหวาน', price: 25, category: 'vegetable' },
  { id: 't_pine', name: 'Pineapple', nameTh: 'สับปะรด', price: 30, category: 'vegetable' },
];

export const DELIVERY_ZONES: DeliveryZone[] = [];
