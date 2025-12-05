
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Pizza, Topping, CartItem, ProductCategory, OrderSource, ExpenseCategory, PaymentMethod, Order, SubItem } from '../types';
import { CATEGORIES, EXPENSE_CATEGORIES, PRESET_EXPENSES } from '../constants';
import { generatePromptPayPayload } from '../utils/promptpay';
import { Plus, Minus, Trash2, ShoppingBag, DollarSign, Settings, User, X, Edit2, Power, LogOut, Upload, Image as ImageIcon, Bike, Store, List, PieChart, Calculator, Globe, ToggleLeft, ToggleRight, Camera, ChevronUp, AlertCircle, Calendar, Link, Star, Layers, Database, MousePointerClick, MessageCircle, MapPin, Facebook, Phone, CheckCircle, Video, PlayCircle, Newspaper, Save, Download, QrCode, Printer, CheckCircle2, ChefHat, Banknote, CreditCard, Lock, Unlock, ArrowRight, Utensils, RefreshCw, Send, Check, ChevronRight, ArrowLeft, Filter, FileSpreadsheet, Maximize2 } from 'lucide-react';

export const POSView: React.FC = () => {
    const { 
        menu, addToCart, removeFromCart, cart, cartTotal, clearCart, placeOrder, orders, deleteOrder,
        updatePizzaPrice, togglePizzaAvailability, addPizza, deletePizza, updatePizza, toggleBestSeller,
        toppings, addTopping, deleteTopping, updateCartItemQuantity, updateCartItem,
        adminLogout, shopLogo, updateShopLogo,
        expenses, addExpense, deleteExpense,
        t, toggleLanguage, language, getLocalizedItem,
        isStoreOpen, toggleStoreStatus, storeSettings, updateStoreSettings, seedDatabase,
        addNewsItem, deleteNewsItem, getAllCustomers, completeOrder, updateOrderStatus
    } = useStore();
    
    // Unified Tab State
    const [activeTab, setActiveTab] = useState<string>('order');
    const [selectedPizza, setSelectedPizza] = useState<Pizza | null>(null);
    const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
    const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
    const [activeCategory, setActiveCategory] = useState<ProductCategory>('pizza');
    const [showMobileCart, setShowMobileCart] = useState(false);
    
    // Combo Builder State
    const [comboSelections, setComboSelections] = useState<SubItem[]>([]);
    const [activeComboSlot, setActiveComboSlot] = useState<number | null>(null);

    // Admin / Edit features
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSalesEditMode, setIsSalesEditMode] = useState(false);
    const [tableNumber, setTableNumber] = useState('');
    const [tempClosedMsg, setTempClosedMsg] = useState(storeSettings.closedMessage);
    const [orderSource, setOrderSource] = useState<OrderSource>('store');
    
    // Reporting State
    const [salesFilter, setSalesFilter] = useState<'day' | 'month' | 'year' | 'all'>('day');
    const [expensesFilter, setExpensesFilter] = useState<'day' | 'month' | 'year' | 'all'>('day');

    // Add/Edit Item State
    const [showItemModal, setShowItemModal] = useState(false);
    const [itemForm, setItemForm] = useState<Partial<Pizza>>({
        name: '', nameTh: '', description: '', descriptionTh: '', basePrice: 0, image: '', available: true, category: 'pizza', comboCount: 0, allowedPromotions: []
    });
    
    // Manage Toppings State
    const [showToppingsModal, setShowToppingsModal] = useState(false);
    const [newToppingName, setNewToppingName] = useState('');
    const [newToppingPrice, setNewToppingPrice] = useState('');

    // Expense Form State
    const [expenseForm, setExpenseForm] = useState({
        description: '',
        amount: '',
        category: 'COGS' as ExpenseCategory,
        note: ''
    });

    // News Form State
    const [newsForm, setNewsForm] = useState({
        title: '',
        summary: '',
        imageUrl: '',
        linkUrl: ''
    });
    
    // Table QR State
    const [qrTableNum, setQrTableNum] = useState('1');
    const [qrBaseUrl, setQrBaseUrl] = useState(() => (typeof window !== 'undefined' ? window.location.origin : ''));
    const [showQrFullScreen, setShowQrFullScreen] = useState(false);

    // --- PAYMENT MODAL STATE ---
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [cashReceived, setCashReceived] = useState<string>('');
    const [change, setChange] = useState<number>(0);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // --- LOCAL STATE FOR SETTINGS FORMS ---
    const [mediaForm, setMediaForm] = useState({
        promoBannerUrl: '',
        reviewLinks: [] as string[],
        vibeLinks: [] as string[]
    });

    const [contactForm, setContactForm] = useState({
        reviewUrl: '',
        mapUrl: '',
        facebookUrl: '',
        lineUrl: '',
        contactPhone: '',
        promptPayNumber: '' 
    });
    
    // Receipt Data for Printing
    const [receiptData, setReceiptData] = useState<{table: string, items: any[], total: number, date: string} | null>(null);

    // Sync local forms when storeSettings loads/updates
    useEffect(() => {
        if (storeSettings) {
            setMediaForm({
                promoBannerUrl: storeSettings.promoBannerUrl || '',
                reviewLinks: storeSettings.reviewLinks || [],
                vibeLinks: storeSettings.vibeLinks || []
            });
            setContactForm({
                reviewUrl: storeSettings.reviewUrl || '',
                mapUrl: storeSettings.mapUrl || '',
                facebookUrl: storeSettings.facebookUrl || '',
                lineUrl: storeSettings.lineUrl || '',
                contactPhone: storeSettings.contactPhone || '',
                promptPayNumber: storeSettings.promptPayNumber || ''
            });
            setTempClosedMsg(storeSettings.closedMessage);
        }
    }, [storeSettings]);

    // Active Tables Logic - Show active or unpaid orders
    const activeTables = orders.filter(o => o.tableNumber && o.status !== 'completed' && o.status !== 'cancelled');

    // Calculate Change
    useEffect(() => {
        const total = selectedOrder ? selectedOrder.totalAmount : cartTotal;
        if (paymentMethod === 'cash' && cashReceived) {
            const received = parseFloat(cashReceived);
            setChange(received - total);
        } else {
            setChange(0);
        }
    }, [cashReceived, cartTotal, paymentMethod, selectedOrder]);

    // PromptPay QR Payload Generator (Memoized to prevent flickering)
    const promptPayQRUrl = useMemo(() => {
        if (paymentMethod !== 'qr_transfer') return '';
        
        const amount = selectedOrder ? selectedOrder.totalAmount : cartTotal;
        const ppNumber = storeSettings.promptPayNumber || '0994979199'; // Default Fallback
        const payload = generatePromptPayPayload(ppNumber, amount);
        
        // Add timestamp to force image refresh if details change
        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}&t=${Date.now()}`;
    }, [paymentMethod, selectedOrder, cartTotal, storeSettings.promptPayNumber]);

    // Helper: Filter by Date Range
    const filterByDate = (dateString: string, filter: 'day'|'month'|'year'|'all') => {
        if (filter === 'all') return true;
        const d = new Date(dateString);
        const now = new Date();
        if (filter === 'day') return d.toDateString() === now.toDateString();
        if (filter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (filter === 'year') return d.getFullYear() === now.getFullYear();
        return true;
    };

    // Helper: Download CSV
    const downloadCSV = (data: any[], filename: string) => {
        if (data.length === 0) {
            alert("No data to export");
            return;
        }
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const val = row[header];
                const escaped = ('' + (val ?? '')).replace(/"/g, '""'); 
                return `"${escaped}"`;
            }).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    // Helper to clean URL for QR
    const getCleanQrUrl = () => {
        // Remove trailing slash if present to avoid //?table=
        return qrBaseUrl.replace(/\/$/, "");
    };
    
    // Print Table Card Helper
    const handlePrintQrCard = () => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(getCleanQrUrl() + '?table=' + qrTableNum)}`;
        const printWindow = window.open('', '', 'width=600,height=800');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Table ${qrTableNum} - QR Code</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; text-align: center; padding: 40px; background: #f9f9f9; }
                        .card { 
                            background: white;
                            border: 3px solid #000; 
                            padding: 60px 40px; 
                            border-radius: 20px; 
                            display: inline-block; 
                            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                            max-width: 400px;
                            width: 100%;
                        }
                        h1 { font-size: 48px; margin: 0 0 10px 0; color: #000; font-weight: 800; }
                        h2 { font-size: 24px; color: #666; margin: 0 0 30px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
                        img.qr { width: 300px; height: 300px; margin-bottom: 20px; }
                        .logo { width: 100px; height: 100px; border-radius: 50%; margin-bottom: 20px; object-fit: cover; border: 4px solid #000; }
                        .footer { margin-top: 30px; font-size: 16px; color: #000; font-weight: bold; }
                        .scan-text { font-size: 18px; margin-bottom: 20px; color: #444; }
                        @media print {
                            body { background: white; padding: 0; }
                            .card { box-shadow: none; border: 3px solid black; }
                        }
                    </style>
                </head>
                <body>
                    <div class="card">
                        ${shopLogo ? `<img src="${shopLogo}" class="logo" />` : ''}
                        <h1>Table ${qrTableNum}</h1>
                        <h2>Pizza Damac</h2>
                        <p class="scan-text">Scan to View Menu & Order</p>
                        <img src="${qrUrl}" class="qr" />
                        <div class="footer">Thank you for dining with us!</div>
                    </div>
                    <script>
                        // Wait for images to load before printing
                        window.onload = function() { 
                            setTimeout(function() {
                                window.print();
                                // window.close(); // Optional: Close after print
                            }, 500);
                        }
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    // Cart customization
    const handleCustomize = (pizza: Pizza) => {
        if (isEditMode && activeTab === 'order') return; 
        setSelectedPizza(pizza);
        setSelectedToppings([]);
        setEditingCartItem(null);
        
        // Reset Combo State
        if (pizza.category === 'promotion' && (pizza.comboCount || 0) > 0) {
            setComboSelections(new Array(pizza.comboCount).fill(null));
            setActiveComboSlot(null);
        }
    };

    const handleEditCartItem = (item: CartItem) => {
        const pizza = menu.find(p => p.id === item.pizzaId);
        if (pizza) {
            setSelectedPizza(pizza);
            setSelectedToppings(item.selectedToppings);
            setEditingCartItem(item);
            if (window.innerWidth < 768) setShowMobileCart(false);
        }
    };

    const toggleTopping = (topping: Topping) => {
        if (selectedToppings.find(t => t.id === topping.id)) {
            setSelectedToppings(prev => prev.filter(t => t.id !== topping.id));
        } else {
            setSelectedToppings(prev => [...prev, topping]);
        }
    };

    // Confirm Standard Add
    const confirmAddToCart = () => {
        if (!selectedPizza) return;
        const toppingsPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
        const localized = getLocalizedItem(selectedPizza);

        if (editingCartItem) {
            updateCartItem({
                ...editingCartItem,
                selectedToppings: selectedToppings,
            });
        } else {
            const item: CartItem = {
                id: Date.now().toString() + Math.random().toString(),
                pizzaId: selectedPizza.id,
                name: localized.name,
                nameTh: selectedPizza.nameTh,
                basePrice: selectedPizza.basePrice,
                selectedToppings: selectedToppings,
                quantity: 1,
                totalPrice: selectedPizza.basePrice + toppingsPrice
            };
            addToCart(item);
        }
        
        setSelectedPizza(null);
        setSelectedToppings([]);
        setEditingCartItem(null);
        if (editingCartItem && window.innerWidth < 768) setShowMobileCart(true);
    };
    
    // Combo Logic Handlers
    const handleComboSlotClick = (index: number) => {
        setActiveComboSlot(index);
    }
    
    const handleComboPizzaSelect = (pizza: Pizza) => {
        if (activeComboSlot === null) return;
        
        const newSelections = [...comboSelections];
        newSelections[activeComboSlot] = {
            pizzaId: pizza.id,
            name: pizza.name,
            nameTh: pizza.nameTh,
            toppings: [] // No extra toppings in POS for speed
        };
        setComboSelections(newSelections);
        setActiveComboSlot(null); // Return to builder
    }
    
    const confirmAddComboToCart = () => {
        if (!selectedPizza) return;
        
        const localized = getLocalizedItem(selectedPizza);
        const item: CartItem = {
            id: Date.now().toString() + Math.random().toString(),
            pizzaId: selectedPizza.id,
            name: localized.name,
            nameTh: selectedPizza.nameTh,
            basePrice: selectedPizza.basePrice,
            selectedToppings: [], 
            subItems: comboSelections,
            quantity: 1,
            totalPrice: selectedPizza.basePrice // Assuming no extra toppings charge for basic combo selection in POS
        };
        addToCart(item);
        setSelectedPizza(null);
        setComboSelections([]);
    }

    // Handler: Send to Kitchen (Pay Later)
    const handleSendToKitchen = async () => {
        if (!tableNumber && orderSource === 'store') {
            alert("Please enter a Table Number for store orders.");
            return;
        }
        
        const success = await placeOrder('dine-in', {
            tableNumber: tableNumber || (orderSource !== 'store' ? orderSource.toUpperCase() : 'Walk-in'),
            source: orderSource,
            paymentMethod: undefined, // Explicitly undefined = Unpaid
            status: 'confirmed', // Kitchen sees it
            note: orderSource === 'store' ? 'Pay Later' : `${orderSource.toUpperCase()} Order`
        });
        
        if (success) {
            setTableNumber('');
            setShowMobileCart(false);
            setOrderSource('store'); // Reset
            setActiveTab('tables'); // Switch view
        }
    };

    // Handler: Pay Now (Cash/QR)
    const handleCheckBill = () => {
        if (cart.length === 0) return;
        setSelectedOrder(null); // Clear selected order implies New Cart Payment
        setCashReceived(''); // Reset
        setPaymentMethod('cash');
        setShowPaymentModal(true);
    };
    
    // Open payment modal for EXISTING table order
    const handleCheckTableBill = (order: Order) => {
        setSelectedOrder(order);
        setCashReceived('');
        setPaymentMethod('cash');
        setShowPaymentModal(true);
    }
    
    // Handler: Complete existing table (Just mark as done/paid/gone)
    const handleCloseTable = async (orderId: string) => {
        if(confirm("Close this table? (Mark as completed)")) {
            await completeOrder(orderId, { paymentMethod: 'cash' }); // Default to cash if closing without paying flow, or assume paid
        }
    }
    
    // Force Cancel Table (Ghost Table Fix)
    const handleCancelTable = async (orderId: string) => {
        if(confirm("Force Cancel/Delete this table order? It will be removed from Active Tables.")) {
            await updateOrderStatus(orderId, 'cancelled');
        }
    }

    const handleFinalizePayment = async () => {
        const currentTotal = selectedOrder ? selectedOrder.totalAmount : cartTotal;
        
        // Validation for Cash
        if (paymentMethod === 'cash') {
            if (parseFloat(cashReceived || '0') < currentTotal) {
                alert("Insufficient cash received!");
                return;
            }
        }
    
        const note = paymentMethod === 'cash' 
            ? `Cash: ${cashReceived}, Change: ${change}` 
            : 'Paid via QR';
        
        if (selectedOrder) {
            // Updating EXISTING order -> Mark COMPLETED (Removed from Active Tables)
            await completeOrder(selectedOrder.id, {
                paymentMethod: paymentMethod,
                note: note
            });
             alert(paymentMethod === 'cash' ? `Table ${selectedOrder.tableNumber || 'Unknown'} Paid! Change: ฿${change}` : "Order Paid via QR!");
        } else {
            // Creating NEW order (Walk-in/Pay Now) -> Mark COMPLETED IMMEDIATELY
            const success = await placeOrder('dine-in', {
                tableNumber: tableNumber || 'Walk-in',
                source: orderSource,
                paymentMethod: paymentMethod,
                status: 'completed', // IMPORTANT: Mark as completed so it doesn't show in Active Tables again
                note: note
            });
            if (success) {
                 alert(paymentMethod === 'cash' ? `Order Paid! Change: ฿${change}` : "Order Paid via QR!");
                 setTableNumber('');
                 setOrderSource('store');
                 setShowMobileCart(false);
            }
        }
        setShowPaymentModal(false);
    };

    const handlePrintBill = () => {
        // Set receipt data
        const currentItems = selectedOrder ? selectedOrder.items : cart;
        const currentTotal = selectedOrder ? selectedOrder.totalAmount : cartTotal;
        const currentTable = selectedOrder ? (selectedOrder.tableNumber || selectedOrder.customerName) : (tableNumber || 'Walk-in');
        
        setReceiptData({
            table: currentTable,
            items: currentItems,
            total: currentTotal,
            date: new Date().toLocaleString()
        });
        
        // Allow state to update then print
        setTimeout(() => {
             window.print();
        }, 100);
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (window.confirm("Are you sure you want to PERMANENTLY delete this order record? This will affect your sales report.")) {
            await deleteOrder(orderId);
        }
    };

    const handleOpenAddModal = () => {
        setItemForm({ name: '', nameTh: '', description: '', descriptionTh: '', basePrice: 0, image: '', available: true, category: 'pizza', comboCount: 0, allowedPromotions: [] });
        setShowItemModal(true);
    };

    const handleEditMenuItem = (item: Pizza) => {
        setItemForm({ ...item, comboCount: item.comboCount || 0, allowedPromotions: item.allowedPromotions || [] });
        setShowItemModal(true);
    };

    const handleSaveItem = async () => {
        if (itemForm.name && itemForm.basePrice !== undefined) {
            if (itemForm.id) {
                await updatePizza(itemForm as Pizza);
            } else {
                await addPizza({
                    ...itemForm as Pizza,
                    id: 'p' + Date.now(),
                    image: itemForm.image || 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?auto=format&fit=crop&w=800&q=80'
                });
            }
            
            // Fix: Switch view to the new item's category so user sees it
            if (itemForm.category) {
                setActiveCategory(itemForm.category);
            }
            
            setShowItemModal(false);
            setItemForm({ name: '', nameTh: '', description: '', descriptionTh: '', basePrice: 0, image: '', available: true, category: 'pizza' });
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setItemForm({ ...itemForm, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateShopLogo(reader.result as string);
                alert("Shop Logo Updated!");
            };
            reader.readAsDataURL(file);
        }
    };
    
    // Banner Upload saves immediately for convenience, but also updates local form
    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const res = reader.result as string;
                // Update local
                setMediaForm(prev => ({ ...prev, promoBannerUrl: res }));
                // Trigger save immediately for file
                updateStoreSettings({ promoBannerUrl: res, promoContentType: 'image' });
                alert("Banner Image Uploaded & Saved!");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddTopping = () => {
        if (newToppingName && newToppingPrice) {
            addTopping({
                id: 't' + Date.now(),
                name: newToppingName,
                nameTh: newToppingName,
                price: parseFloat(newToppingPrice)
            });
            setNewToppingName('');
            setNewToppingPrice('');
        }
    };

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        if (!expenseForm.description || !expenseForm.amount) return;

        addExpense({
            id: 'exp-' + Date.now(),
            date: new Date().toISOString(),
            description: expenseForm.description,
            amount: parseFloat(expenseForm.amount),
            category: expenseForm.category,
            note: expenseForm.note
        });

        setExpenseForm({
            description: '',
            amount: '',
            category: 'COGS',
            note: ''
        });
        alert("Expense Recorded.");
    };
    
    const handleAddNews = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newsForm.title || !newsForm.summary) return;

        addNewsItem({
            id: 'news-' + Date.now(),
            title: newsForm.title,
            summary: newsForm.summary,
            imageUrl: newsForm.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
            linkUrl: newsForm.linkUrl,
            date: new Date().toISOString()
        });
        
        setNewsForm({ title: '', summary: '', imageUrl: '', linkUrl: '' });
        alert("News Item Added!");
    };

    const handleExportCustomers = async () => {
        const data = await getAllCustomers();
        downloadCSV(data, 'pizza_damac_customers.csv');
    };
    
    // EXPORT FUNCTIONS
    const handleExportSales = () => {
        const filteredSales = activeOrders.filter(o => filterByDate(o.createdAt, salesFilter));
        const csvData = filteredSales.map(o => ({
            ID: o.id,
            Date: new Date(o.createdAt).toLocaleDateString(),
            Time: new Date(o.createdAt).toLocaleTimeString(),
            Source: o.source,
            Type: o.type,
            Table: o.tableNumber || '',
            Total: o.totalAmount,
            Net: o.netAmount,
            Payment: o.paymentMethod || 'Unpaid',
            Status: o.status
        }));
        downloadCSV(csvData, `sales_report_${salesFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleExportExpenses = () => {
        const filteredExp = expenses.filter(e => filterByDate(e.date, expensesFilter));
        const csvData = filteredExp.map(e => ({
            Date: new Date(e.date).toLocaleDateString(),
            Category: e.category,
            Description: e.description,
            Amount: e.amount,
            Note: e.note || ''
        }));
        downloadCSV(csvData, `expenses_report_${expensesFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    };
    
    // --- MANUAL SAVE HANDLERS ---
    
    const updateLocalMediaLink = (listType: 'review' | 'vibe', index: number, value: string) => {
        if (listType === 'review') {
            const newList = [...(mediaForm.reviewLinks || [])];
            newList[index] = value;
            setMediaForm(prev => ({ ...prev, reviewLinks: newList }));
        } else {
            const newList = [...(mediaForm.vibeLinks || [])];
            newList[index] = value;
            setMediaForm(prev => ({ ...prev, vibeLinks: newList }));
        }
    };

    const handleSaveMediaSettings = () => {
        // Filter empty links to keep DB clean
        const cleanReviews = (mediaForm.reviewLinks || []).filter(l => l && l.trim() !== '');
        const cleanVibes = (mediaForm.vibeLinks || []).filter(l => l && l.trim() !== '');

        updateStoreSettings({
            promoBannerUrl: mediaForm.promoBannerUrl,
            reviewLinks: cleanReviews,
            vibeLinks: cleanVibes
        });
        
        // Update local state to reflect cleaned arrays (removes empty slots from UI)
        setMediaForm(prev => ({
            ...prev,
            reviewLinks: cleanReviews,
            vibeLinks: cleanVibes
        }));

        alert("Media Settings Saved Successfully!");
    };

    const handleSaveContactSettings = () => {
        updateStoreSettings({
            reviewUrl: contactForm.reviewUrl,
            mapUrl: contactForm.mapUrl,
            facebookUrl: contactForm.facebookUrl,
            lineUrl: contactForm.lineUrl,
            contactPhone: contactForm.contactPhone,
            promptPayNumber: contactForm.promptPayNumber
        });
        alert("Contact & Payment Settings Saved Successfully!");
    };

    // Filter Menu
    const filteredMenu = menu.filter(item => {
        const cat = item.category || 'pizza';
        return cat === activeCategory;
    });

    // --- SALES CALCULATIONS (Filtered) ---
    const activeOrders = orders.filter(o => o.status !== 'cancelled');
    const filteredOrders = activeOrders.filter(o => filterByDate(o.createdAt, salesFilter));
    const filteredExpenses = expenses.filter(e => filterByDate(e.date, salesFilter));

    const totalGrossSales = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = filteredOrders.reduce((sum, o) => sum + (o.netAmount || o.totalAmount), 0) - totalExpenses;
    
    // Robust Cash vs Online breakdown
    const cashSales = filteredOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.totalAmount, 0);
    const onlineSales = filteredOrders.filter(o => o.paymentMethod !== 'cash').reduce((sum, o) => sum + o.totalAmount, 0);


    // Helper to group toppings
    const groupedToppings = {
        sauce: toppings.filter(t => t.category === 'sauce'),
        cheese: toppings.filter(t => t.category === 'cheese'),
        seasoning: toppings.filter(t => t.category === 'seasoning'),
        meat: toppings.filter(t => t.category === 'meat'),
        vegetable: toppings.filter(t => t.category === 'vegetable'),
        other: toppings.filter(t => !t.category || t.category === 'other'),
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden flex-col md:flex-row font-sans">
            
            {/* --- RECEIPT PRINTER (HIDDEN) --- */}
            <div className="hidden print:block print:w-[80mm] print:font-mono print:text-xs p-2 bg-white text-black">
                {receiptData && (
                    <div className="text-center">
                        <div className="font-bold text-lg mb-2">PIZZA DAMAC</div>
                        <div className="mb-4">Nonthaburi<br/>Tel: 099-497-9199</div>
                        <div className="border-b border-black border-dashed mb-2"></div>
                        <div className="text-left mb-2">
                            <div>Table: {receiptData.table}</div>
                            <div>Date: {receiptData.date}</div>
                        </div>
                        <div className="border-b border-black border-dashed mb-2"></div>
                        <table className="w-full text-left mb-2">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th className="text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {receiptData.items.map((item: any, i: number) => (
                                    <tr key={i}>
                                        <td>{item.quantity}x {item.name}</td>
                                        <td className="text-right">{item.totalPrice.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="border-b border-black border-dashed mb-2"></div>
                        <div className="flex justify-between font-bold text-lg">
                            <span>TOTAL</span>
                            <span>{receiptData.total.toLocaleString()}</span>
                        </div>
                        <div className="border-b border-black border-dashed mt-2 mb-4"></div>
                        <div className="text-center">Thank you!</div>
                    </div>
                )}
            </div>

            {/* --- MOBILE LAYOUT HEADER --- */}
            <div className="md:hidden bg-gray-900 text-white p-3 flex justify-between items-center z-30 shadow-md shrink-0 h-14 print:hidden">
                <div className="flex items-center gap-2">
                    {shopLogo ? (
                        <img src={shopLogo} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <div className="bg-brand-600 p-1 rounded-lg"><DollarSign size={16} /></div>
                    )}
                    <span className="font-bold text-lg tracking-tight">POS v2.1</span>
                </div>
                 <div className="flex items-center gap-3">
                    {activeTab === 'order' && (
                       <button 
                         onClick={() => setIsEditMode(!isEditMode)} 
                         className={`p-1.5 rounded-full ${isEditMode ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-800 text-gray-400'}`}
                       >
                         <Edit2 size={16}/>
                       </button>
                    )}
                    <div className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${isStoreOpen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        {isStoreOpen ? 'OPEN' : 'CLOSED'}
                    </div>
                 </div>
            </div>

            {/* --- DESKTOP SIDEBAR --- */}
            <aside className="hidden md:flex w-20 bg-gray-900 flex-col items-center py-6 text-gray-400 z-10 shadow-xl justify-between shrink-0 print:hidden">
                <div className="flex flex-col items-center gap-6 w-full">
                    <div className="mb-2 relative group cursor-pointer">
                        {shopLogo ? (
                            <img src={shopLogo} alt="Logo" className="w-12 h-12 rounded-xl object-cover border-2 border-brand-500" />
                        ) : (
                            <div className="p-3 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-900/50">
                                <DollarSign size={24} strokeWidth={3} />
                            </div>
                        )}
                        <div className="absolute -bottom-2 w-full text-center text-[8px] text-gray-500 font-mono">v2.1</div>
                    </div>
                    
                    <nav className="flex flex-col gap-4 w-full px-2">
                        <button onClick={() => {setActiveTab('order'); setIsEditMode(false)}} className={`group p-3 w-full flex justify-center rounded-xl transition-all ${activeTab === 'order' ? 'bg-gray-800 text-brand-500 shadow-inner' : 'hover:bg-gray-800'}`}>
                            <ShoppingBag size={24} />
                        </button>
                        <button onClick={() => setActiveTab('tables')} className={`relative group p-3 w-full flex justify-center rounded-xl transition-all ${activeTab === 'tables' ? 'bg-gray-800 text-green-500 shadow-inner' : 'hover:bg-gray-800'}`}>
                            <Utensils size={24} />
                            {activeTables.length > 0 && <span className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">{activeTables.length}</span>}
                        </button>
                        <button onClick={() => setActiveTab('sales')} className={`group p-3 w-full flex justify-center rounded-xl transition-all ${activeTab === 'sales' ? 'bg-gray-800 text-blue-500 shadow-inner' : 'hover:bg-gray-800'}`}>
                            <PieChart size={24} />
                        </button>
                        <button onClick={() => setActiveTab('expenses')} className={`group p-3 w-full flex justify-center rounded-xl transition-all ${activeTab === 'expenses' ? 'bg-gray-800 text-yellow-500 shadow-inner' : 'hover:bg-gray-800'}`}>
                            <Calculator size={24} />
                        </button>
                        <button onClick={() => setActiveTab('qr')} className={`group p-3 w-full flex justify-center rounded-xl transition-all ${activeTab === 'qr' ? 'bg-gray-800 text-purple-500 shadow-inner' : 'hover:bg-gray-800'}`}>
                            <QrCode size={24} />
                        </button>
                         <button onClick={() => setActiveTab('manage')} className={`relative group p-3 w-full flex justify-center rounded-xl transition-all ${activeTab === 'manage' ? 'bg-gray-800 text-red-500 shadow-inner' : 'hover:bg-gray-800'}`}>
                            <Settings size={24} />
                            {activeTab !== 'manage' && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                        </button>
                        <div className="h-px bg-gray-800 w-full my-2"></div>
                        <button 
                            onClick={() => { setActiveTab('order'); setIsEditMode(!isEditMode); }} 
                            className={`p-3 w-full flex justify-center rounded-xl transition-all ${isEditMode ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-gray-800 hover:text-white'}`}
                        >
                            <Edit2 size={24} className={isEditMode ? 'animate-spin-slow' : ''} />
                        </button>
                    </nav>
                </div>
                
                <div className="flex flex-col gap-3 w-full items-center">
                    <button onClick={toggleLanguage} className="bg-gray-800 text-white p-2 rounded-full flex items-center justify-center text-xs font-bold w-10 h-10">{language.toUpperCase()}</button>
                    <button onClick={adminLogout} className="p-3 w-full flex justify-center hover:text-white hover:bg-gray-800 rounded-xl transition"><LogOut size={24} /></button>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex overflow-hidden relative flex-col md:flex-row pb-16 md:pb-0 h-full print:hidden">
                
                {/* VIEW: ORDER */}
                {activeTab === 'order' && (
                    <>
                        <div className="flex-1 flex flex-col overflow-hidden relative h-full pb-0 md:pb-0">
                            {/* Categories Bar */}
                            <div className="bg-white/95 backdrop-blur z-10 sticky top-0 shadow-sm md:shadow-none p-2 md:p-6 md:pt-6 shrink-0">
                                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat.id ? 'bg-gray-900 text-white shadow-md transform scale-105' : 'bg-white text-gray-600 border border-gray-200'}`}
                                        >
                                            {language === 'th' ? cat.labelTh : cat.label}
                                        </button>
                                    ))}
                                    {/* Add Item Button */}
                                    {isEditMode && (
                                        <button 
                                            onClick={handleOpenAddModal}
                                            className="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap bg-brand-600 text-white shadow-md flex items-center gap-1"
                                        >
                                            <Plus size={14}/> Add New
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Menu Grid */}
                            <div className="flex-1 overflow-y-auto p-2 md:p-6 pt-0 pb-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                                    {filteredMenu.map(item => {
                                        const localized = getLocalizedItem(item);
                                        return (
                                        <div 
                                            key={item.id} 
                                            className={`relative bg-white p-2 md:p-3 rounded-xl shadow-sm border transition flex flex-col h-auto ${isEditMode ? 'border-dashed border-red-300 bg-red-50/20' : 'hover:shadow-md cursor-pointer'} ${!item.available ? 'opacity-75 bg-gray-50' : ''}`}
                                            onClick={() => !isEditMode && item.available && handleCustomize(item)}
                                        >
                                            {/* Image */}
                                            <div className="w-full aspect-square rounded-lg overflow-hidden flex-shrink-0 relative mb-2">
                                                <img src={item.image} className="w-full h-full object-cover" />
                                                {!item.available && (
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                        <span className="text-white text-[10px] md:text-xs font-bold bg-red-600 px-2 py-1 rounded">SOLD OUT</span>
                                                    </div>
                                                )}
                                                {item.isBestSeller && (
                                                    <div className="absolute top-1 right-1 bg-yellow-400 text-white p-1 rounded-full shadow-md">
                                                        <Star size={10} fill="white" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-gray-800 leading-tight text-xs md:text-sm line-clamp-2 min-h-[2.5em]">{localized.name}</h3>
                                                        {isEditMode && (
                                                            <div className="flex gap-1 absolute top-2 left-2">
                                                                <button onClick={(e)=>{e.stopPropagation(); handleEditMenuItem(item)}} className="bg-blue-100 text-blue-600 p-1 rounded"><Edit2 size={10}/></button>
                                                                <button onClick={(e)=>{e.stopPropagation(); togglePizzaAvailability(item.id)}} className={`p-1 rounded ${item.available ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}><Power size={10}/></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="font-bold text-brand-600 text-sm md:text-base">฿{item.basePrice}</span>
                                                    {!isEditMode && item.available && <div className="bg-brand-50 text-brand-600 p-1 rounded-full"><Plus size={14}/></div>}
                                                </div>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            </div>
                        </div>

                        {/* Order Summary / Cart */}
                        <div className={`bg-white border-l shadow-xl flex flex-col z-40 transition-transform duration-300 md:w-96 md:static ${showMobileCart ? 'fixed inset-0 w-full translate-y-0 z-50' : 'fixed inset-0 w-full translate-y-full md:translate-y-0 md:flex'}`}>
                             {/* ... Cart Header ... */}
                             <div className="p-4 border-b flex justify-between items-center bg-gray-50 shadow-sm shrink-0 md:p-6">
                                <h3 className="font-bold text-lg md:text-xl text-gray-800">{t('placeOrder')}</h3>
                                <button onClick={() => setShowMobileCart(false)} className="md:hidden p-2 bg-gray-200 rounded-full hover:bg-gray-300"><X size={20}/></button>
                             </div>

                             <div className="p-4 bg-gray-50 border-b shrink-0 space-y-3">
                                 {/* Source Selection */}
                                 <div className="flex items-center gap-2">
                                     <Bike size={18} className="text-gray-500"/>
                                     <select 
                                        className="bg-white border border-gray-300 rounded px-2 py-2 text-sm w-full outline-none font-bold"
                                        value={orderSource}
                                        onChange={e => setOrderSource(e.target.value as OrderSource)}
                                     >
                                         <option value="store">Store / Dine-in</option>
                                         <option value="lineman">Line Man</option>
                                         <option value="grab">Grab Food</option>
                                         <option value="foodpanda">Foodpanda</option>
                                         <option value="robinhood">Robinhood</option>
                                     </select>
                                 </div>
                                 <div className="flex items-center gap-2">
                                     <User size={18} className="text-gray-500"/>
                                     <input type="text" placeholder={orderSource === 'store' ? "Table No. (e.g. 1)" : "Order ID / Ref"} className="bg-white border border-gray-300 rounded px-2 py-2 text-base w-full outline-none" value={tableNumber} onChange={e => setTableNumber(e.target.value)}/>
                                 </div>
                             </div>

                             <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {cart.length === 0 ? (
                                    <div className="text-center text-gray-400 mt-20 flex flex-col items-center">
                                        <ShoppingBag size={48} className="mb-4 opacity-20" />
                                        <p>{t('cartEmpty')}</p>
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.id} className="flex flex-col border border-gray-100 rounded-lg p-3 shadow-sm bg-white">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1 cursor-pointer" onClick={() => handleEditCartItem(item)}>
                                                    <div className="font-bold text-gray-800 text-sm md:text-base flex items-center gap-2">
                                                        {item.name} <Edit2 size={12} className="text-gray-400"/>
                                                    </div>
                                                    <p className="text-xs text-gray-500 line-clamp-1">
                                                        {item.subItems ? item.subItems.map(s => s.name).join(', ') : item.selectedToppings.map(t => t.name).join(', ')}
                                                    </p>
                                                </div>
                                                <div className="font-bold text-gray-800">฿{item.totalPrice}</div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <button onClick={() => updateCartItemQuantity(item.id, -1)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600" disabled={item.quantity <= 1}><Minus size={16}/></button>
                                                    <span className="text-lg font-bold w-6 text-center">{item.quantity}</span>
                                                    <button onClick={() => updateCartItemQuantity(item.id, 1)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"><Plus size={16}/></button>
                                                </div>
                                                <button onClick={() => removeFromCart(item.id)} className="text-red-500 p-2"><Trash2 size={20} /></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                             </div>

                             <div className="p-4 bg-gray-50 border-t pb-safe shrink-0">
                                 <div className="flex justify-between items-center mb-6 text-2xl font-bold text-gray-900">
                                     <span>{t('total')}</span>
                                     <span>฿{cartTotal}</span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-3 mb-4">
                                     {/* Send to Kitchen (Unpaid) */}
                                     <button 
                                         onClick={handleSendToKitchen} 
                                         disabled={cart.length === 0} 
                                         className="px-4 py-3 rounded-xl border-2 border-blue-500 text-blue-600 font-bold hover:bg-blue-50 disabled:opacity-50 flex items-center justify-center gap-2"
                                     >
                                         <Send size={18} /> To Kitchen
                                     </button>
                                     {/* Pay Now (Paid & Completed) */}
                                     <button 
                                         onClick={handleCheckBill} 
                                         disabled={cart.length === 0} 
                                         className="px-4 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                     >
                                         <DollarSign size={18} /> Pay Now
                                     </button>
                                 </div>
                                 <button onClick={clearCart} className="w-full text-sm text-gray-400 hover:text-gray-600 underline">Clear Cart</button>
                             </div>
                        </div>
                    </>
                )}
                
                {/* VIEW: ACTIVE TABLES (CHECK BILL) */}
                {activeTab === 'tables' && (
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-100">
                         <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                             <Utensils className="text-green-600"/> Active Tables
                         </h2>
                         
                         {activeTables.length === 0 ? (
                             <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                 <Store size={64} className="mb-4 opacity-20"/>
                                 <p className="text-lg">No active dining tables.</p>
                             </div>
                         ) : (
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                 {activeTables.map(order => {
                                     const isPaid = order.paymentMethod !== undefined && order.paymentMethod !== null;
                                     return (
                                     <div 
                                        key={order.id} 
                                        onClick={() => !isPaid && handleCheckTableBill(order)}
                                        className={`bg-white rounded-xl shadow-md p-6 border-l-8 cursor-pointer hover:shadow-xl hover:translate-y-[-2px] transition relative overflow-hidden ${isPaid ? 'border-green-500' : 'border-red-500'}`}
                                     >
                                         {/* Delete Button (Top Right) */}
                                         <button 
                                             onClick={(e) => { e.stopPropagation(); handleCancelTable(order.id); }}
                                             className="absolute top-4 right-4 p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 z-10"
                                             title="Force Cancel / Delete Table"
                                         >
                                             <Trash2 size={16}/>
                                         </button>

                                         {/* Status Badge */}
                                         <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 ${isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                             {isPaid ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                                             {isPaid ? 'PAID' : 'UNPAID'}
                                         </div>

                                         <div className="flex justify-between items-start mt-8 mb-4">
                                             <div>
                                                 <div className="text-xs font-bold text-gray-500 uppercase mb-1">Table No.</div>
                                                 <div className="text-4xl font-bold text-gray-900">{order.tableNumber || '?'}</div>
                                             </div>
                                         </div>
                                         
                                         <div className="space-y-1 mb-4 border-t border-b py-3 border-dashed">
                                             <div className="flex justify-between text-sm">
                                                 <span className="text-gray-500">Items</span>
                                                 <span className="font-bold">{order.items.reduce((s,i)=>s+i.quantity,0)} pcs</span>
                                             </div>
                                             <div className="flex justify-between text-sm">
                                                 <span className="text-gray-500">Time</span>
                                                 <span className="font-bold">{new Date(order.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                             </div>
                                             <div className="flex justify-between text-sm">
                                                 <span className="text-gray-500">Status</span>
                                                 <span className="font-bold uppercase text-xs bg-gray-100 px-2 py-0.5 rounded">{order.status}</span>
                                             </div>
                                         </div>
                                         
                                         <div className="flex justify-between items-center">
                                             <span className="text-gray-400 text-sm">Total</span>
                                             <span className="text-2xl font-bold text-brand-600">฿{order.totalAmount}</span>
                                         </div>
                                         
                                         {isPaid ? (
                                             <button 
                                                 onClick={(e) => { e.stopPropagation(); handleCloseTable(order.id); }}
                                                 className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-2 rounded-lg text-center font-bold text-sm flex items-center justify-center gap-2"
                                             >
                                                 <Check size={16}/> Clear Table (Done)
                                             </button>
                                         ) : (
                                             <div className="mt-4 bg-red-50 text-red-700 py-2 rounded-lg text-center font-bold text-sm flex items-center justify-center gap-2">
                                                 <DollarSign size={16}/> Check Bill
                                             </div>
                                         )}
                                     </div>
                                 )})}
                             </div>
                         )}
                    </div>
                )}

                {/* VIEW: SALES REPORT */}
                {activeTab === 'sales' && (
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><PieChart className="text-blue-600"/> {t('salesReport')}</h2>
                            
                            <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                                {['day', 'month', 'year', 'all'].map(f => (
                                    <button 
                                        key={f} 
                                        onClick={() => setSalesFilter(f as any)}
                                        className={`px-3 py-1 text-xs font-bold rounded uppercase transition ${salesFilter === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        {f === 'day' ? 'Today' : f}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <button 
                                    onClick={handleExportSales}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs bg-green-100 text-green-700 hover:bg-green-200 transition"
                                >
                                    <FileSpreadsheet size={14}/> Export CSV
                                </button>
                                <button 
                                    onClick={() => setIsSalesEditMode(!isSalesEditMode)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs border ${isSalesEditMode ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {isSalesEditMode ? <Unlock size={14}/> : <Lock size={14}/>}
                                    {isSalesEditMode ? 'Edit Mode ON' : 'Manage Data'}
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                 <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                                     {t('grossSales')} ({salesFilter})
                                 </h3>
                                 <p className="text-3xl font-bold text-gray-900 mt-2">฿{totalGrossSales.toLocaleString()}</p>
                                 {/* CASH BREAKDOWN */}
                                 <div className="mt-4 pt-4 border-t flex justify-between text-xs">
                                     <div className="flex items-center gap-1 text-green-700 font-bold">
                                         <Banknote size={14}/> Cash: ฿{cashSales.toLocaleString()}
                                     </div>
                                     <div className="flex items-center gap-1 text-blue-700 font-bold">
                                         <CreditCard size={14}/> Online: ฿{onlineSales.toLocaleString()}
                                     </div>
                                 </div>
                             </div>
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                 <h3 className="text-sm font-bold text-gray-500 uppercase">{t('expenses')} ({salesFilter})</h3>
                                 <p className="text-3xl font-bold text-red-600 mt-2">฿{totalExpenses.toLocaleString()}</p>
                             </div>
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                 <h3 className="text-sm font-bold text-gray-500 uppercase">{t('netProfit')} ({salesFilter})</h3>
                                 <p className={`text-3xl font-bold mt-2 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>฿{netProfit.toLocaleString()}</p>
                             </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <h3 className="p-6 border-b font-bold text-lg">{t('transactionHistory')}</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                        <tr>
                                            <th className="p-4 text-left">Order ID</th>
                                            <th className="p-4 text-left">Date</th>
                                            <th className="p-4 text-left">Source</th>
                                            <th className="p-4 text-left">Payment</th>
                                            <th className="p-4 text-left">Status</th>
                                            <th className="p-4 text-right">Amount</th>
                                            <th className="p-4 text-right">Net</th>
                                            {isSalesEditMode && <th className="p-4 text-center">Action</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredOrders.slice(0, 50).map(order => (
                                            <tr key={order.id} className="text-sm hover:bg-gray-50 transition">
                                                <td className="p-4 font-mono font-bold text-gray-600">#{order.id.slice(-4)}</td>
                                                <td className="p-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded font-bold text-xs uppercase ${order.source === 'store' ? 'bg-gray-100' : 'bg-green-100 text-green-800'}`}>{order.source}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded font-bold text-xs uppercase ${order.paymentMethod === 'cash' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                                                        {order.paymentMethod === 'cash' ? <Banknote size={12}/> : <CreditCard size={12}/>}
                                                        {order.paymentMethod === 'cash' ? 'CASH' : 'ONLINE'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded font-bold text-xs uppercase ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right font-bold">฿{order.totalAmount}</td>
                                                <td className="p-4 text-right text-gray-500 text-xs">฿{order.netAmount}</td>
                                                {isSalesEditMode && (
                                                    <td className="p-4 text-center">
                                                        <button 
                                                            onClick={() => handleDeleteOrder(order.id)}
                                                            className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                                                            title="Delete Record"
                                                        >
                                                            <Trash2 size={16}/>
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: EXPENSES */}
                {activeTab === 'expenses' && (
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-100">
                         <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                             <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Calculator className="text-yellow-600"/> Expenses & Costs</h2>
                             
                             <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                                {['day', 'month', 'year', 'all'].map(f => (
                                    <button 
                                        key={f} 
                                        onClick={() => setExpensesFilter(f as any)}
                                        className={`px-3 py-1 text-xs font-bold rounded uppercase transition ${expensesFilter === f ? 'bg-yellow-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        {f === 'day' ? 'Today' : f}
                                    </button>
                                ))}
                            </div>
                            
                            <button 
                                onClick={handleExportExpenses}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs bg-green-100 text-green-700 hover:bg-green-200 transition"
                            >
                                <FileSpreadsheet size={14}/> Export CSV
                            </button>
                         </div>
                         
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             {/* Form */}
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                 <h3 className="font-bold text-lg mb-4">{t('recordExpense')}</h3>
                                 <form onSubmit={handleAddExpense} className="space-y-4">
                                     <div>
                                         <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                                         <input className="w-full bg-gray-50 border rounded p-3" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} required placeholder="e.g. Tomatoes"/>
                                     </div>
                                     <div className="grid grid-cols-2 gap-4">
                                         <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Amount (฿)</label>
                                            <input type="number" className="w-full bg-gray-50 border rounded p-3" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} required placeholder="0.00"/>
                                         </div>
                                         <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                                            <select className="w-full bg-gray-50 border rounded p-3" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value as any})}>
                                                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                         </div>
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold text-gray-500 uppercase">Note (Optional)</label>
                                         <input className="w-full bg-gray-50 border rounded p-3" value={expenseForm.note} onChange={e => setExpenseForm({...expenseForm, note: e.target.value})}/>
                                     </div>
                                     <button type="submit" className="w-full bg-yellow-500 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-yellow-600 transition">Record Expense</button>
                                 </form>
                                 
                                 {/* Quick Expense Buttons (Presets) */}
                                 <div className="mt-6 pt-6 border-t">
                                     <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">{t('quickExpense')}</h4>
                                     <div className="flex flex-wrap gap-2">
                                         {PRESET_EXPENSES.map((preset, idx) => (
                                             <button 
                                                key={idx}
                                                onClick={() => setExpenseForm({ ...expenseForm, description: preset.label, category: preset.category as any })}
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg border border-gray-200"
                                             >
                                                 {preset.label}
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                             </div>

                             {/* List */}
                             <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[500px]">
                                 <h3 className="p-4 border-b font-bold text-lg bg-gray-50">Recent Expenses ({expensesFilter})</h3>
                                 <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                     {filteredExpenses.length === 0 ? <p className="text-gray-400 text-center mt-10">No expenses recorded for this period.</p> : filteredExpenses.map(exp => (
                                         <div key={exp.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                                             <div>
                                                 <div className="font-bold text-gray-800">{exp.description}</div>
                                                 <div className="text-xs text-gray-500">{new Date(exp.date).toLocaleDateString()} • {exp.category}</div>
                                             </div>
                                             <div className="flex items-center gap-4">
                                                 <span className="font-bold text-red-600">-฿{exp.amount}</span>
                                                 <button onClick={() => deleteExpense(exp.id)} className="text-gray-400 hover:text-red-500"><X size={16}/></button>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         </div>
                    </div>
                )}
                
                {/* VIEW: QR GENERATOR (Dedicated) */}
                {activeTab === 'qr' && (
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-100 flex flex-col items-center justify-center relative">
                         <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-100 max-w-lg w-full text-center">
                             <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                 <QrCode size={32}/>
                             </div>
                             <h2 className="text-2xl font-bold text-gray-900 mb-2">Table QR Generator</h2>
                             <p className="text-gray-500 mb-8">Create specific ordering links for each table.</p>
                             
                             <div className="flex flex-col gap-4">
                                 <div className="text-left">
                                     <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Table Number</label>
                                     <div className="flex gap-2">
                                         <input 
                                            className="border-2 border-gray-200 rounded-xl p-3 text-xl font-bold text-center w-full focus:border-purple-500 outline-none transition" 
                                            value={qrTableNum} 
                                            onChange={e => setQrTableNum(e.target.value)}
                                            placeholder="1"
                                         />
                                     </div>
                                 </div>
                                 
                                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                     <img 
                                         src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getCleanQrUrl() + '?table=' + qrTableNum)}`}
                                         className="w-48 h-48 mx-auto mix-blend-multiply"
                                         alt="QR Code"
                                     />
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-3">
                                     <button 
                                         onClick={handlePrintQrCard}
                                         className="bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black shadow-lg flex items-center justify-center gap-2 transition"
                                     >
                                         <Printer size={20}/> Print Card
                                     </button>
                                     
                                     <a 
                                         href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(getCleanQrUrl() + '?table=' + qrTableNum)}`}
                                         target="_blank"
                                         download={`table-${qrTableNum}.png`}
                                         className="bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 shadow-lg flex items-center justify-center gap-2 transition"
                                     >
                                         <Download size={20}/> Save Image
                                     </a>
                                 </div>
                                 <button 
                                     onClick={() => setShowQrFullScreen(true)}
                                     className="bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 flex items-center justify-center gap-2 transition"
                                 >
                                     <Maximize2 size={20}/> Show on Screen
                                 </button>
                                 
                                 <div className="text-xs text-gray-400 break-all bg-gray-50 p-2 rounded border mt-2">
                                     {getCleanQrUrl()}?table={qrTableNum}
                                 </div>
                             </div>
                         </div>
                    </div>
                )}

                {/* VIEW: MANAGE (Unified Dashboard) */}
                {activeTab === 'manage' && (
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-100 space-y-6">
                         <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Settings className="text-red-600"/> Manager Dashboard</h2>
                         
                         {/* 1. Store Status & Holiday */}
                         <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                             <h3 className="font-bold text-gray-500 text-xs uppercase mb-3 flex items-center gap-2"><Store size={14}/> Store Operations</h3>
                             <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-lg">
                                 <span className="font-bold text-lg text-gray-800">{isStoreOpen ? 'Store is OPEN' : 'Store is CLOSED'}</span>
                                 <button onClick={() => toggleStoreStatus(!isStoreOpen)} className={`px-4 py-2 rounded-full font-bold text-sm ${isStoreOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                     {isStoreOpen ? 'Turn Off (Close Now)' : 'Turn On (Open Now)'}
                                 </button>
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div>
                                     <label className="text-xs text-gray-400 mb-1 block">Closed Message</label>
                                     <input className="w-full bg-gray-50 border rounded p-3 text-sm" placeholder="e.g. Closed for Maintenance" value={tempClosedMsg} onChange={(e) => setTempClosedMsg(e.target.value)} onBlur={() => toggleStoreStatus(isStoreOpen, tempClosedMsg)}/>
                                 </div>
                                 <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                     <label className="text-xs font-bold text-red-800 mb-2 block flex items-center gap-1"><Calendar size={12}/> Schedule Holiday (Auto-Close)</label>
                                     <div className="flex gap-2 items-center">
                                         <input type="date" className="bg-white border rounded p-2 text-xs" value={storeSettings.holidayStart || ''} onChange={e => updateStoreSettings({ holidayStart: e.target.value })}/>
                                         <span className="text-xs">to</span>
                                         <input type="date" className="bg-white border rounded p-2 text-xs" value={storeSettings.holidayEnd || ''} onChange={e => updateStoreSettings({ holidayEnd: e.target.value })}/>
                                     </div>
                                 </div>
                             </div>
                         </div>

                         {/* 3. Contact & Payment Settings */}
                         <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                             <h3 className="font-bold text-gray-500 text-xs uppercase mb-3 flex items-center gap-2"><Phone size={14}/> Contact & Payment</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                 <div>
                                     <label className="text-xs text-gray-400 mb-1 block">PromptPay Number / Tax ID</label>
                                     <input className="w-full border rounded p-2 bg-blue-50 border-blue-200 text-blue-900 font-bold" value={contactForm.promptPayNumber} onChange={e => setContactForm({...contactForm, promptPayNumber: e.target.value})}/>
                                 </div>
                                 <div>
                                     <label className="text-xs text-gray-400 mb-1 block">Shop Phone</label>
                                     <input className="w-full border rounded p-2" value={contactForm.contactPhone} onChange={e => setContactForm({...contactForm, contactPhone: e.target.value})}/>
                                 </div>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <input className="w-full border rounded p-2 text-xs" placeholder="Facebook URL" value={contactForm.facebookUrl} onChange={e => setContactForm({...contactForm, facebookUrl: e.target.value})}/>
                                 <input className="w-full border rounded p-2 text-xs" placeholder="LINE URL" value={contactForm.lineUrl} onChange={e => setContactForm({...contactForm, lineUrl: e.target.value})}/>
                                 <input className="w-full border rounded p-2 text-xs" placeholder="Google Maps URL" value={contactForm.mapUrl} onChange={e => setContactForm({...contactForm, mapUrl: e.target.value})}/>
                                 <input className="w-full border rounded p-2 text-xs" placeholder="Google Review URL" value={contactForm.reviewUrl} onChange={e => setContactForm({...contactForm, reviewUrl: e.target.value})}/>
                             </div>
                             <button onClick={handleSaveContactSettings} className="mt-4 bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-xs">Save Contact Info</button>
                         </div>

                         {/* 4. Media Manager */}
                         <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                             <h3 className="font-bold text-gray-500 text-xs uppercase mb-3 flex items-center gap-2"><ImageIcon size={14}/> {t('mediaManager')}</h3>
                             
                             <div className="mb-6">
                                 <label className="text-xs text-gray-400 mb-1 block">Promo Banner (Image/Video URL)</label>
                                 <div className="flex gap-2">
                                     <input className="flex-1 border rounded p-2 text-xs" value={mediaForm.promoBannerUrl} onChange={e => setMediaForm({...mediaForm, promoBannerUrl: e.target.value})}/>
                                     <label className="cursor-pointer bg-gray-200 px-3 py-2 rounded text-xs font-bold hover:bg-gray-300">
                                         Upload <input type="file" hidden accept="image/*,video/*" onChange={handleBannerUpload} />
                                     </label>
                                 </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div>
                                     <label className="text-xs text-gray-400 mb-2 block">Review Links (YouTube/TikTok)</label>
                                     {mediaForm.reviewLinks.map((link, i) => (
                                         <input key={i} className="w-full border rounded p-2 text-xs mb-2" value={link} onChange={e => updateLocalMediaLink('review', i, e.target.value)} placeholder={`Link #${i+1}`}/>
                                     ))}
                                     <button onClick={() => setMediaForm(p => ({...p, reviewLinks: [...p.reviewLinks, '']}))} className="text-xs text-brand-600 font-bold">+ Add Link</button>
                                 </div>
                                 <div>
                                     <label className="text-xs text-gray-400 mb-2 block">Vibe Links (Lemon8/Social)</label>
                                     {mediaForm.vibeLinks.map((link, i) => (
                                         <input key={i} className="w-full border rounded p-2 text-xs mb-2" value={link} onChange={e => updateLocalMediaLink('vibe', i, e.target.value)} placeholder={`Link #${i+1}`}/>
                                     ))}
                                     <button onClick={() => setMediaForm(p => ({...p, vibeLinks: [...p.vibeLinks, '']}))} className="text-xs text-brand-600 font-bold">+ Add Link</button>
                                 </div>
                             </div>
                             <button onClick={handleSaveMediaSettings} className="mt-4 bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-xs">Save Media Settings</button>
                         </div>

                         {/* 5. News & Events */}
                         <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                             <h3 className="font-bold text-gray-500 text-xs uppercase mb-3 flex items-center gap-2"><Newspaper size={14}/> News & Events</h3>
                             <form onSubmit={handleAddNews} className="flex flex-col gap-3 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                 <input className="border rounded p-2 text-sm" placeholder="Title" value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} required/>
                                 <input className="border rounded p-2 text-sm" placeholder="Summary" value={newsForm.summary} onChange={e => setNewsForm({...newsForm, summary: e.target.value})} required/>
                                 <div className="flex gap-2">
                                     <input className="flex-1 border rounded p-2 text-xs" placeholder="Image URL" value={newsForm.imageUrl} onChange={e => setNewsForm({...newsForm, imageUrl: e.target.value})}/>
                                     <input className="flex-1 border rounded p-2 text-xs" placeholder="Link URL (Optional)" value={newsForm.linkUrl} onChange={e => setNewsForm({...newsForm, linkUrl: e.target.value})}/>
                                 </div>
                                 <button type="submit" className="bg-brand-600 text-white py-2 rounded font-bold text-xs hover:bg-brand-700">Add News Item</button>
                             </form>
                             <div className="space-y-2">
                                 {storeSettings.newsItems?.map(item => (
                                     <div key={item.id} className="flex justify-between items-center p-2 border rounded bg-white">
                                         <span className="text-sm font-bold truncate flex-1">{item.title}</span>
                                         <button onClick={() => deleteNewsItem(item.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={14}/></button>
                                     </div>
                                 ))}
                             </div>
                         </div>

                         {/* 6. Database Tools */}
                         <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                             <h3 className="font-bold text-gray-500 text-xs uppercase mb-3 flex items-center gap-2"><Database size={14}/> Data Management</h3>
                             <div className="flex gap-3">
                                 <button onClick={handleExportCustomers} className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-bold text-xs hover:bg-blue-200">
                                     <Download size={14}/> Export Customer CSV
                                 </button>
                                 <button onClick={seedDatabase} className="flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-bold text-xs hover:bg-orange-200">
                                     <RefreshCw size={14}/> Sync/Seed Database
                                 </button>
                                 <label className="cursor-pointer flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold text-xs hover:bg-gray-200">
                                     <Upload size={14}/> Upload Shop Logo
                                     <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                                 </label>
                             </div>
                         </div>
                    </div>
                )}
            </main>

            {/* --- MOBILE BOTTOM NAV --- */}
            <div className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 w-full z-50 flex justify-around items-center h-16 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] print:hidden">
                <button onClick={() => setActiveTab('order')} className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'order' ? 'text-brand-600' : 'text-gray-400'}`}>
                    <ShoppingBag size={20}/>
                    <span className="text-[10px] font-bold">Order</span>
                </button>
                <button onClick={() => setActiveTab('tables')} className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'tables' ? 'text-green-600' : 'text-gray-400'}`}>
                    <Utensils size={20}/>
                    <span className="text-[10px] font-bold">Tables</span>
                </button>
                <button onClick={() => setActiveTab('sales')} className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'sales' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <PieChart size={20}/>
                    <span className="text-[10px] font-bold">Sales</span>
                </button>
                <button onClick={() => setActiveTab('manage')} className={`relative flex flex-col items-center gap-1 p-2 ${activeTab === 'manage' ? 'text-red-600' : 'text-gray-400'}`}>
                    <Settings size={20}/>
                    {activeTab !== 'manage' && <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                    <span className="text-[10px] font-bold">Manage</span>
                </button>
            </div>

            {/* Modal: Add/Edit Item */}
            {showItemModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white w-[95%] max-w-lg rounded-2xl p-6 shadow-2xl relative">
                        <h2 className="text-xl font-bold mb-4">{itemForm.id ? 'Edit Item' : 'Add New Item'}</h2>
                        <button onClick={() => setShowItemModal(false)} className="absolute top-4 right-4 text-gray-400"><X size={20}/></button>
                        
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('name')} (English)</label>
                                <input className="w-full border rounded p-2" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('name')} (Thai)</label>
                                <input className="w-full border rounded p-2" value={itemForm.nameTh || ''} onChange={e => setItemForm({...itemForm, nameTh: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">{t('price')}</label>
                                    <input type="number" className="w-full border rounded p-2" value={itemForm.basePrice} onChange={e => setItemForm({...itemForm, basePrice: parseFloat(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">{t('category')}</label>
                                    <select className="w-full border rounded p-2" value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value as any})}>
                                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            {/* Combo Settings */}
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                <label className="text-xs font-bold text-orange-800 uppercase flex items-center gap-1 mb-1">
                                    <Layers size={12}/> Combo & Promotion Settings
                                </label>
                                
                                {itemForm.category === 'promotion' ? (
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-600">Pizza Count (Items allowed in set)</span>
                                        <input 
                                            type="number" 
                                            className="w-20 border rounded p-1 text-center font-bold" 
                                            value={itemForm.comboCount} 
                                            onChange={e => setItemForm({...itemForm, comboCount: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="text-xs font-bold text-gray-600">Combo Eligibility (Check all that apply)</div>
                                        <p className="text-[10px] text-gray-500 mb-2">If none selected, item is allowed in ALL combos by default.</p>
                                        <div className="max-h-32 overflow-y-auto border rounded p-2 bg-white grid grid-cols-1 gap-2">
                                            {menu.filter(p => p.category === 'promotion').map(promo => {
                                                const isChecked = (itemForm.allowedPromotions || []).includes(promo.id);
                                                return (
                                                    <label key={promo.id} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                const current = itemForm.allowedPromotions || [];
                                                                if (e.target.checked) {
                                                                    setItemForm({...itemForm, allowedPromotions: [...current, promo.id]});
                                                                } else {
                                                                    setItemForm({...itemForm, allowedPromotions: current.filter(id => id !== promo.id)});
                                                                }
                                                            }}
                                                        />
                                                        {promo.name}
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('description')} (English)</label>
                                <textarea className="w-full border rounded p-2 h-20" value={itemForm.description} onChange={e => setItemForm({...itemForm, description: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('description')} (Thai)</label>
                                <textarea className="w-full border rounded p-2 h-20" value={itemForm.descriptionTh || ''} onChange={e => setItemForm({...itemForm, descriptionTh: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">{t('imageSource')}</label>
                                <div className="flex gap-2 items-center">
                                    {itemForm.image && <img src={itemForm.image} className="w-16 h-16 rounded object-cover border" />}
                                    <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200">
                                        Upload
                                        <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                    <span className="text-xs text-gray-400">or paste URL</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                             {itemForm.id && (
                                 <button onClick={() => { deletePizza(itemForm.id!); setShowItemModal(false); }} className="px-4 py-2 text-red-600 font-bold hover:bg-red-50 rounded-lg">{t('delete')}</button>
                             )}
                             <button onClick={handleSaveItem} className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-black shadow-lg">
                                 {itemForm.id ? t('updateItem') : t('saveItem')}
                             </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal: Full Screen QR */}
            {showQrFullScreen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
                    <button onClick={() => setShowQrFullScreen(false)} className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full"><X size={32}/></button>
                    <div className="bg-white p-8 rounded-3xl max-w-2xl w-full text-center">
                        <h1 className="text-4xl font-bold mb-2">Table {qrTableNum}</h1>
                        <p className="text-gray-500 text-lg mb-6">Scan to view menu & order</p>
                        <img 
                             src={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(getCleanQrUrl() + '?table=' + qrTableNum)}`}
                             className="w-full max-w-[500px] h-auto mx-auto border-4 border-gray-100 rounded-xl"
                             alt="QR Code"
                        />
                        <div className="mt-6 text-gray-400 text-sm">Pizza Damac Nonthaburi</div>
                    </div>
                </div>
            )}
            
            {/* Modal: Customize Item / Combo Builder (POS) */}
            {selectedPizza && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    {(selectedPizza.comboCount || 0) > 0 ? (
                        // COMBO BUILDER UI
                        <div className="bg-white w-[95%] max-w-2xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Layers className="text-brand-600"/> Build {getLocalizedItem(selectedPizza).name}
                                </h2>
                                <button onClick={() => setSelectedPizza(null)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
                                {activeComboSlot === null ? (
                                    // Slot List
                                    <div className="space-y-4">
                                        <p className="text-center text-gray-500 mb-4">Select {selectedPizza.comboCount} pizzas for the deal.</p>
                                        <div className="grid grid-cols-1 gap-3">
                                            {Array.from({length: selectedPizza.comboCount || 2}).map((_, idx) => (
                                                <button 
                                                    key={idx}
                                                    onClick={() => handleComboSlotClick(idx)}
                                                    className={`w-full p-4 rounded-xl border-2 border-dashed flex items-center justify-between transition ${comboSelections[idx] ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-300 bg-white'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${comboSelections[idx] ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                            {idx + 1}
                                                        </div>
                                                        <span className={`font-bold ${comboSelections[idx] ? 'text-gray-900' : 'text-gray-400'}`}>
                                                            {comboSelections[idx] ? comboSelections[idx].name : 'Select Pizza...'}
                                                        </span>
                                                    </div>
                                                    <ChevronRight size={20} className="text-gray-400"/>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    // Pizza Selector
                                    <div>
                                        <button onClick={() => setActiveComboSlot(null)} className="mb-4 text-sm font-bold text-gray-500 flex items-center gap-1 hover:text-gray-800"><ArrowLeft size={16}/> Back</button>
                                        <h3 className="font-bold text-lg mb-4">Choose Pizza #{activeComboSlot + 1}</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {/* FILTER OUT PROMOTIONS to avoid recursion */}
                                            {/* NEW: Filter by allowedPromotions */}
                                            {menu.filter(p => {
                                                if (p.category === 'promotion') return false;
                                                if ((p.comboCount || 0) > 0) return false;
                                                // Check eligibility
                                                if (p.allowedPromotions && p.allowedPromotions.length > 0) {
                                                    return p.allowedPromotions.includes(selectedPizza.id);
                                                }
                                                return true; // Allowed in all if empty
                                            }).map(pizza => (
                                                <button 
                                                    key={pizza.id} 
                                                    onClick={() => handleComboPizzaSelect(pizza)}
                                                    className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm border hover:border-brand-500 text-center transition"
                                                >
                                                    <img src={pizza.image} className="w-16 h-16 rounded-lg object-cover"/>
                                                    <div className="font-bold text-xs text-gray-800 line-clamp-2">{getLocalizedItem(pizza).name}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-4 border-t bg-white flex justify-between items-center rounded-b-2xl">
                                <div className="font-bold text-xl text-gray-900">Total: ฿{selectedPizza.basePrice}</div>
                                {activeComboSlot === null && (
                                    <button 
                                        disabled={comboSelections.filter(Boolean).length < (selectedPizza.comboCount || 0)}
                                        onClick={confirmAddComboToCart}
                                        className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                    >
                                        Add Bundle
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        // STANDARD UI
                        <div className="bg-white w-[95%] max-w-2xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{getLocalizedItem(selectedPizza).name}</h2>
                                    <p className="text-sm text-brand-600 font-bold">Base: ฿{selectedPizza.basePrice}</p>
                                </div>
                                <button onClick={() => setSelectedPizza(null)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"><X size={20}/></button>
                            </div>
                            
                            <div className="p-4 overflow-y-auto bg-white flex-1">
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1"><ChefHat size={14}/> Customize / Add Toppings</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {toppings.map(topping => {
                                        const isSelected = selectedToppings.some(t => t.id === topping.id);
                                        return (
                                            <button
                                                key={topping.id}
                                                onClick={() => toggleTopping(topping)}
                                                className={`p-3 rounded-xl border text-left transition relative overflow-hidden ${isSelected ? 'border-brand-500 bg-brand-50 text-brand-900' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                                            >
                                                <div className="flex justify-between items-center relative z-10">
                                                    <span className="font-bold text-sm">{language === 'th' ? topping.nameTh : topping.name}</span>
                                                    {isSelected && <CheckCircle2 size={16} className="text-brand-600"/>}
                                                </div>
                                                <div className="text-xs opacity-70 mt-1 relative z-10">{topping.price > 0 ? `+฿${topping.price}` : 'Free'}</div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex justify-between items-center">
                                <div className="font-bold text-xl">Total: ฿{selectedPizza.basePrice + selectedToppings.reduce((s,t)=>s+t.price,0)}</div>
                                <button onClick={confirmAddToCart} className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-brand-700">
                                    <Plus size={20}/> Add to Cart
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal: PAYMENT / CHECK BILL */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-[95%] max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h2 className="font-bold text-xl text-gray-800">Payment / Check Bill</h2>
                            <button onClick={() => setShowPaymentModal(false)}><X className="text-gray-500"/></button>
                        </div>
                        
                        <div className="p-6 space-y-6 overflow-y-auto">
                            {/* Total Display */}
                            <div className="text-center">
                                {selectedOrder ? (
                                    <div className="mb-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold inline-block">
                                        Checking Table {selectedOrder.tableNumber}
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500 uppercase font-bold">New Order</div>
                                )}
                                <div className="text-5xl font-bold text-brand-600">
                                    ฿{(selectedOrder ? selectedOrder.totalAmount : cartTotal).toLocaleString()}
                                </div>
                            </div>

                            {/* Method Selector */}
                            <div className="grid grid-cols-2 gap-4">
                                 <button 
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 font-bold transition ${paymentMethod === 'cash' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-400'}`}
                                 >
                                    <Banknote size={32}/> CASH
                                 </button>
                                 <button 
                                    onClick={() => setPaymentMethod('qr_transfer')}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 font-bold transition ${paymentMethod === 'qr_transfer' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-400'}`}
                                 >
                                    <QrCode size={32}/> QR SCAN
                                 </button>
                            </div>

                            {/* Cash Input */}
                            {paymentMethod === 'cash' && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Cash Received</label>
                                        <div className="relative mt-1">
                                             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">฿</div>
                                             <input 
                                                type="number" 
                                                autoFocus
                                                className="w-full p-3 pl-8 text-xl font-bold border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                                value={cashReceived}
                                                onChange={e => setCashReceived(e.target.value)}
                                                placeholder="0.00"
                                             />
                                        </div>
                                    </div>
                                    {/* Quick Amount Buttons */}
                                    <div className="flex gap-2">
                                        {[100, 500, 1000].map(amt => (
                                             <button key={amt} onClick={() => setCashReceived(amt.toString())} className="flex-1 bg-white border border-gray-300 rounded py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 shadow-sm">
                                                ฿{amt}
                                             </button>
                                        ))}
                                        <button onClick={() => setCashReceived((selectedOrder ? selectedOrder.totalAmount : cartTotal).toString())} className="flex-1 bg-brand-100 border border-brand-200 rounded py-2 text-sm font-bold text-brand-700 shadow-sm">Exact</button>
                                    </div>

                                    {/* Change Display */}
                                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                        <span className="font-bold text-gray-600">Change:</span>
                                        <span className={`text-2xl font-bold ${change < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                            ฿{Math.max(0, change).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                             {/* QR Display (DYNAMIC PROMPTPAY) */}
                            {paymentMethod === 'qr_transfer' && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center">
                                    <p className="font-bold text-blue-800 mb-2 flex items-center justify-center gap-2">
                                        <img src="https://promptpay.io/logo.png" className="h-5" alt=""/> Scan to Pay
                                    </p>
                                    <div className="bg-white p-2 inline-block rounded-lg shadow-sm border border-gray-200">
                                        {/* Use the Memoized URL to prevent flickering */}
                                        <img 
                                            src={promptPayQRUrl} 
                                            alt="PromptPay QR" 
                                            className="w-48 h-48 mx-auto"
                                        />
                                    </div>
                                    <div className="mt-3 text-xs text-blue-800 bg-blue-100 p-2 rounded-lg font-mono">
                                        <div><span className="font-bold">Pay to:</span> {storeSettings.promptPayNumber || '0994979199'}</div>
                                        <div><span className="font-bold">Amount:</span> ฿{(selectedOrder ? selectedOrder.totalAmount : cartTotal).toLocaleString()}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex gap-3">
                            <button onClick={handlePrintBill} className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 shadow-sm">
                                <Printer size={18}/> Print Bill
                            </button>
                            <button 
                                onClick={handleFinalizePayment}
                                disabled={paymentMethod === 'cash' && change < 0}
                                className="flex-[2] py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={18}/> {selectedOrder ? 'Complete & Pay' : 'Confirm Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal: Manage Toppings */}
             {showToppingsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white w-[95%] max-w-md rounded-2xl p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
                        <h2 className="text-xl font-bold mb-4">Manage Toppings</h2>
                        <button onClick={() => setShowToppingsModal(false)} className="absolute top-4 right-4 text-gray-400"><X size={20}/></button>
                        
                        <div className="flex gap-2 mb-4">
                            <input className="flex-1 border rounded p-2" placeholder="Topping Name" value={newToppingName} onChange={e => setNewToppingName(e.target.value)} />
                            <input className="w-20 border rounded p-2" type="number" placeholder="Price" value={newToppingPrice} onChange={e => setNewToppingPrice(e.target.value)} />
                            <button onClick={handleAddTopping} className="bg-brand-600 text-white p-2 rounded"><Plus size={20}/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-2 border-t pt-2">
                             {toppings.map(t => (
                                 <div key={t.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                                     <span className="font-medium">{t.name}</span>
                                     <div className="flex items-center gap-3">
                                         <span className="text-gray-500 text-sm">฿{t.price}</span>
                                         <button onClick={() => deleteTopping(t.id)} className="text-red-400 hover:text-red-600"><X size={16}/></button>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
