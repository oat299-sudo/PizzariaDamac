
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Pizza, Topping, CartItem, ProductCategory, OrderSource, ExpenseCategory, PaymentMethod, Order, SubItem } from '../types';
import { CATEGORIES, EXPENSE_CATEGORIES, PRESET_EXPENSES } from '../constants';
import { generatePromptPayPayload } from '../utils/promptpay';
import { Plus, Minus, Trash2, ShoppingBag, DollarSign, Settings, User, X, Edit2, Power, LogOut, Upload, Image as ImageIcon, Bike, Store, List, PieChart, Calculator, Globe, ToggleLeft, ToggleRight, Camera, ChevronUp, AlertCircle, Calendar, Link, Star, Layers, Database, MousePointerClick, MessageCircle, MapPin, Facebook, Phone, CheckCircle, Video, PlayCircle, Newspaper, Save, Download, QrCode, Printer, CheckCircle2, ChefHat, Banknote, CreditCard, Lock, Unlock, ArrowRight, Utensils, RefreshCw, Send, Check, ChevronRight, ArrowLeft, Filter, FileSpreadsheet, Maximize2, Sparkles, Receipt, Eye } from 'lucide-react';

export const POSView: React.FC = () => {
    const { 
        menu, addToCart, removeFromCart, cart, cartTotal, clearCart, placeOrder, orders, deleteOrder,
        updatePizzaPrice, togglePizzaAvailability, addPizza, deletePizza, updatePizza, toggleBestSeller,
        toppings, addTopping, updateTopping, deleteTopping, updateCartItemQuantity, updateCartItem,
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
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [quantity, setQuantity] = useState(1);
    
    // Combo Builder State
    const [comboSelections, setComboSelections] = useState<SubItem[]>([]);
    const [activeComboSlot, setActiveComboSlot] = useState<number | null>(null);

    // Admin / Edit features
    const [isEditMode, setIsEditMode] = useState(false);
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
    const [toppingForm, setToppingForm] = useState<Partial<Topping>>({
        name: '', nameTh: '', price: 0, category: 'other', available: true, image: ''
    });

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
        vibeLinks: [] as string[],
        eventGalleryUrls: [] as string[]
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
    const [receiptData, setReceiptData] = useState<{table: string, items: any[], total: number, date: string, orderId: string} | null>(null);

    // Sync local forms when storeSettings loads/updates
    useEffect(() => {
        if (storeSettings) {
            setMediaForm({
                promoBannerUrl: storeSettings.promoBannerUrl || '',
                reviewLinks: storeSettings.reviewLinks || [],
                vibeLinks: storeSettings.vibeLinks || [],
                eventGalleryUrls: storeSettings.eventGalleryUrls || []
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

    // PromptPay QR Payload Generator
    const promptPayQRUrl = useMemo(() => {
        if (paymentMethod !== 'qr_transfer') return '';
        const amount = selectedOrder ? selectedOrder.totalAmount : cartTotal;
        const ppNumber = storeSettings.promptPayNumber || '0994979199';
        const payload = generatePromptPayPayload(ppNumber, amount);
        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}&t=${Date.now()}`;
    }, [paymentMethod, selectedOrder, cartTotal, storeSettings.promptPayNumber]);

    // Helper Functions
    const filterByDate = (dateString: string, filter: 'day'|'month'|'year'|'all') => {
        if (filter === 'all') return true;
        const d = new Date(dateString);
        const now = new Date();
        if (filter === 'day') return d.toDateString() === now.toDateString();
        if (filter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (filter === 'year') return d.getFullYear() === now.getFullYear();
        return true;
    };

    const downloadCSV = (data: any[], filename: string) => {
        if (data.length === 0) { alert("No data"); return; }
        const headers = Object.keys(data[0]);
        const csvContent = [headers.join(','), ...data.map(row => headers.map(header => `"${('' + (row[header]??'')).replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const getCleanQrUrl = () => qrBaseUrl.replace(/\/$/, "");
    
    // Print Table Card
    const handlePrintQrCard = () => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(getCleanQrUrl() + '?table=' + qrTableNum)}`;
        const printWindow = window.open('', '', 'width=600,height=800');
        if (printWindow) {
            printWindow.document.write(`
                <html><head><title>Table ${qrTableNum}</title><style>body{font-family:sans-serif;text-align:center;padding:40px;}.card{border:3px solid black;padding:60px 40px;border-radius:20px;display:inline-block;}img.qr{width:300px;height:300px;}</style></head>
                <body><div class="card"><h1>Table ${qrTableNum}</h1><p>Scan to Order</p><img src="${qrUrl}" class="qr" /></div>
                <script>window.onload=function(){setTimeout(function(){window.print();},500);}</script></body></html>`);
            printWindow.document.close();
        }
    };

    // Cart Customization
    const handleCustomize = (pizza: Pizza) => {
        if (isEditMode && activeTab === 'order') return;
        setSelectedPizza({...pizza}); 
        setSelectedToppings([]);
        setEditingCartItem(null);
        setComboSelections([]);
        setActiveComboSlot(null);
        setSpecialInstructions('');
        setQuantity(1);
        if (pizza.category === 'promotion' && (pizza.comboCount || 0) > 0) {
            setComboSelections(new Array(pizza.comboCount).fill(null));
        }
    };

    const handleEditCartItem = (item: CartItem) => {
        const pizza = menu.find(p => p.id === item.pizzaId);
        if (pizza) {
            setSelectedPizza({...pizza});
            setSelectedToppings(item.selectedToppings);
            setEditingCartItem(item);
            setSpecialInstructions(item.specialInstructions || '');
            setQuantity(item.quantity);
            if (item.subItems) setComboSelections(item.subItems);
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

    const confirmAddToCart = () => {
        if (!selectedPizza) return;
        const toppingsPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
        const localized = getLocalizedItem(selectedPizza);
        const item: CartItem = {
            id: editingCartItem ? editingCartItem.id : Date.now().toString() + Math.random().toString(),
            pizzaId: selectedPizza.id,
            name: localized.name,
            nameTh: selectedPizza.nameTh,
            basePrice: selectedPizza.basePrice,
            selectedToppings: selectedToppings,
            quantity: quantity,
            totalPrice: (selectedPizza.basePrice + toppingsPrice) * quantity,
            specialInstructions: specialInstructions
        };
        if (editingCartItem) updateCartItem(item); else addToCart(item);
        
        setSelectedPizza(null); setSelectedToppings([]); setEditingCartItem(null); setSpecialInstructions(''); setQuantity(1);
        if (editingCartItem && window.innerWidth < 768) setShowMobileCart(true);
    };
    
    // Combo Logic
    const handleComboSlotClick = (index: number) => setActiveComboSlot(index);
    const handleComboPizzaSelect = (pizza: Pizza) => {
        if (activeComboSlot === null) return;
        const newSelections = [...comboSelections];
        newSelections[activeComboSlot] = {
            pizzaId: pizza.id, name: pizza.name, nameTh: pizza.nameTh, toppings: []
        };
        setComboSelections(newSelections); setActiveComboSlot(null);
    }
    const confirmAddComboToCart = () => {
        if (!selectedPizza) return;
        const localized = getLocalizedItem(selectedPizza);
        const item: CartItem = {
            id: Date.now().toString() + Math.random().toString(),
            pizzaId: selectedPizza.id, name: localized.name, nameTh: selectedPizza.nameTh,
            basePrice: selectedPizza.basePrice, selectedToppings: [], subItems: comboSelections,
            quantity: quantity, totalPrice: selectedPizza.basePrice * quantity, specialInstructions: specialInstructions
        };
        addToCart(item); setSelectedPizza(null); setComboSelections([]);
    }

    // POS Order Logic
    const handleSendToKitchen = async () => {
        if (!tableNumber && orderSource === 'store') { alert("Please enter a Table Number for store orders."); return; }
        const success = await placeOrder('dine-in', {
            tableNumber: tableNumber || (orderSource !== 'store' ? orderSource.toUpperCase() : 'Walk-in'),
            source: orderSource, paymentMethod: undefined, status: 'confirmed', 
            note: orderSource === 'store' ? 'Pay Later' : `${orderSource.toUpperCase()} Order`
        });
        if (success) { setTableNumber(''); setShowMobileCart(false); setOrderSource('store'); setActiveTab('tables'); }
    };

    const handleCheckBill = () => {
        if (cart.length === 0) return;
        setSelectedOrder(null); setCashReceived(''); setPaymentMethod('cash'); setShowPaymentModal(true);
    };
    
    const handleCheckTableBill = (order: Order) => {
        setSelectedOrder(order); setCashReceived(''); setPaymentMethod('cash'); setShowPaymentModal(true);
    }
    
    const handleCloseTable = async (orderId: string) => {
        if(confirm("Close this table? (Mark as completed)")) await completeOrder(orderId, { paymentMethod: 'cash' });
    }
    
    const handleCancelTable = async (orderId: string) => {
        if(confirm("Force Cancel/Delete this table order?")) await updateOrderStatus(orderId, 'cancelled');
    }

    const handleFinalizePayment = async () => {
        const currentTotal = selectedOrder ? selectedOrder.totalAmount : cartTotal;
        if (paymentMethod === 'cash' && parseFloat(cashReceived || '0') < currentTotal) { alert("Insufficient cash!"); return; }
        const note = paymentMethod === 'cash' ? `Cash: ${cashReceived}, Change: ${change}` : 'Paid via QR';
        
        if (selectedOrder) {
            await completeOrder(selectedOrder.id, { paymentMethod: paymentMethod, note: note });
             alert(paymentMethod === 'cash' ? `Paid! Change: ฿${change}` : "Order Paid via QR!");
        } else {
            const success = await placeOrder('dine-in', {
                tableNumber: tableNumber || 'Walk-in', source: orderSource, paymentMethod: paymentMethod, status: 'completed', note: note
            });
            if (success) { alert(paymentMethod === 'cash' ? `Paid! Change: ฿${change}` : "Paid via QR!"); setTableNumber(''); setOrderSource('store'); setShowMobileCart(false); }
        }
        setShowPaymentModal(false);
    };

    const handlePrintBill = () => {
        const currentItems = selectedOrder ? selectedOrder.items : cart;
        const currentTotal = selectedOrder ? selectedOrder.totalAmount : cartTotal;
        const currentTable = selectedOrder ? (selectedOrder.tableNumber || selectedOrder.customerName) : (tableNumber || 'Walk-in');
        setReceiptData({ table: currentTable, items: currentItems, total: currentTotal, date: new Date().toLocaleString(), orderId: selectedOrder ? selectedOrder.id.slice(-4) : 'NEW' });
        setTimeout(() => { window.print(); }, 100);
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (window.confirm("Delete record?")) await deleteOrder(orderId);
    };

    // --- ITEM & TOPPING MANAGEMENT ---
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
            if (itemForm.id) await updatePizza(itemForm as Pizza);
            else await addPizza({ ...itemForm as Pizza, id: 'p' + Date.now(), image: itemForm.image || 'https://via.placeholder.com/150' });
            if (itemForm.category) setActiveCategory(itemForm.category);
            setShowItemModal(false);
        }
    };
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { const reader = new FileReader(); reader.onloadend = () => setItemForm({ ...itemForm, image: reader.result as string }); reader.readAsDataURL(file); }
    };
    
    // Topping Handlers
    const handleOpenToppingModal = (topping?: Topping) => {
        if (topping) {
            setToppingForm({...topping});
        } else {
            setToppingForm({ name: '', nameTh: '', price: 0, category: 'other', available: true, image: '' });
        }
        setShowToppingsModal(true);
    };
    const handleSaveTopping = async () => {
        if (toppingForm.name && toppingForm.price !== undefined) {
            if (toppingForm.id) {
                await updateTopping(toppingForm as Topping);
            } else {
                await addTopping({ 
                    ...toppingForm as Topping, 
                    id: 't' + Date.now(),
                    category: toppingForm.category || 'other'
                });
            }
            setShowToppingsModal(false);
        }
    };
    const handleToppingImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { const reader = new FileReader(); reader.onloadend = () => setToppingForm({ ...toppingForm, image: reader.result as string }); reader.readAsDataURL(file); }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { const reader = new FileReader(); reader.onloadend = () => updateShopLogo(reader.result as string); reader.readAsDataURL(file); }
    };
    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { const reader = new FileReader(); reader.onloadend = () => { setMediaForm(p => ({ ...p, promoBannerUrl: reader.result as string })); updateStoreSettings({ promoBannerUrl: reader.result as string, promoContentType: 'image' }); }; reader.readAsDataURL(file); }
    };
    const handleEventImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { const reader = new FileReader(); reader.onloadend = () => { const res = reader.result as string; const newGallery = [...(mediaForm.eventGalleryUrls || []), res]; setMediaForm(p => ({ ...p, eventGalleryUrls: newGallery })); }; reader.readAsDataURL(file); }
    };

    // Expenses & News
    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault(); if (!expenseForm.description || !expenseForm.amount) return;
        addExpense({ id: 'exp-' + Date.now(), date: new Date().toISOString(), description: expenseForm.description, amount: parseFloat(expenseForm.amount), category: expenseForm.category, note: expenseForm.note });
        setExpenseForm({ description: '', amount: '', category: 'COGS', note: '' });
    };
    const handleAddNews = (e: React.FormEvent) => {
        e.preventDefault(); if (!newsForm.title || !newsForm.summary) return;
        addNewsItem({ id: 'news-' + Date.now(), title: newsForm.title, summary: newsForm.summary, imageUrl: newsForm.imageUrl || 'https://via.placeholder.com/150', linkUrl: newsForm.linkUrl, date: new Date().toISOString() });
        setNewsForm({ title: '', summary: '', imageUrl: '', linkUrl: '' });
    };

    // Save Settings
    const updateLocalMediaLink = (listType: 'review' | 'vibe', index: number, value: string) => {
        if (listType === 'review') { const newList = [...(mediaForm.reviewLinks || [])]; newList[index] = value; setMediaForm(prev => ({ ...prev, reviewLinks: newList })); } 
        else { const newList = [...(mediaForm.vibeLinks || [])]; newList[index] = value; setMediaForm(prev => ({ ...prev, vibeLinks: newList })); }
    };
    const handleSaveMediaSettings = () => {
        const cleanReviews = (mediaForm.reviewLinks || []).filter(l => l && l.trim() !== '');
        const cleanVibes = (mediaForm.vibeLinks || []).filter(l => l && l.trim() !== '');
        const cleanEvents = (mediaForm.eventGalleryUrls || []).filter(l => l && l.trim() !== '');
        updateStoreSettings({ promoBannerUrl: mediaForm.promoBannerUrl, reviewLinks: cleanReviews, vibeLinks: cleanVibes, eventGalleryUrls: cleanEvents });
        setMediaForm(prev => ({ ...prev, reviewLinks: cleanReviews, vibeLinks: cleanVibes, eventGalleryUrls: cleanEvents }));
        alert("Media Saved!");
    };
    const handleSaveContactSettings = () => {
        updateStoreSettings({ reviewUrl: contactForm.reviewUrl, mapUrl: contactForm.mapUrl, facebookUrl: contactForm.facebookUrl, lineUrl: contactForm.lineUrl, contactPhone: contactForm.contactPhone, promptPayNumber: contactForm.promptPayNumber });
        alert("Contact Saved!");
    };

    // Sales Calculations
    const activeOrders = orders.filter(o => o.status !== 'cancelled');
    const filteredOrders = activeOrders.filter(o => filterByDate(o.createdAt, salesFilter));
    const filteredExpenses = expenses.filter(e => filterByDate(e.date, salesFilter));
    const totalGrossSales = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = filteredOrders.reduce((sum, o) => sum + (o.netAmount || o.totalAmount), 0) - totalExpenses;
    const filteredMenu = menu.filter(item => { const cat = item.category || 'pizza'; return cat === activeCategory; });

    // Export Handlers
    const handleExportSales = () => {
        if (filteredOrders.length === 0) { alert("No sales data to export"); return; }
        const data = filteredOrders.map(o => ({
            ID: o.id,
            Date: new Date(o.createdAt).toLocaleString(),
            Customer: o.customerName,
            Type: o.type,
            Source: o.source,
            Status: o.status,
            Total: o.totalAmount,
            Payment: o.paymentMethod || '-',
            Items: o.items.map(i => `${i.quantity}x ${i.name}`).join('; ')
        }));
        downloadCSV(data, `sales_report_${salesFilter}.csv`);
    };

    const handleExportExpenses = () => {
        if (filteredExpenses.length === 0) { alert("No expense data to export"); return; }
        const data = filteredExpenses.map(e => ({
            Date: new Date(e.date).toLocaleDateString(),
            Description: e.description,
            Category: e.category,
            Amount: e.amount,
            Note: e.note || ''
        }));
        downloadCSV(data, `expenses_report.csv`);
    };

    const handleExportCustomers = async () => {
        try {
            const data = await getAllCustomers();
            if (data.length === 0) { 
                alert("No customer data found. If this is unexpected, check database connection."); 
                return; 
            }
            downloadCSV(data, 'customers_export.csv');
        } catch (error) {
            console.error("Export Error:", error);
            alert("Export failed. Check console for details.");
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden flex-col md:flex-row font-sans">
            
            {/* ... [Receipt Printer (Hidden)] ... */}
            <div className="hidden print:block print:w-[80mm] print:font-mono print:text-xs p-0 m-0 bg-white text-black">
                {receiptData && (
                    <div className="text-center" style={{ width: '80mm' }}>
                        <div className="font-bold text-xl mb-1">PIZZA DAMAC</div>
                        <div className="text-sm mb-2">Nonthaburi<br/>Tel: 099-497-9199</div>
                        <div className="border-b border-black border-dashed mb-2"></div>
                        <div className="text-left text-xs mb-2 flex justify-between"><span>#{receiptData.orderId}</span><span>{receiptData.date}</span></div>
                        <div className="text-left font-bold text-lg mb-2">Table: {receiptData.table}</div>
                        <div className="border-b border-black border-dashed mb-2"></div>
                        <table className="w-full text-left mb-2 text-xs">
                            <thead><tr><th className="w-8">Qty</th><th>Item</th><th className="text-right">Total</th></tr></thead>
                            <tbody>{receiptData.items.map((item: any, i: number) => (<tr key={i} className="align-top"><td>{item.quantity}</td><td>{item.name}</td><td className="text-right">{item.totalPrice.toLocaleString()}</td></tr>))}</tbody>
                        </table>
                        <div className="border-b border-black border-dashed mb-2"></div>
                        <div className="flex justify-between font-bold text-xl"><span>TOTAL</span><span>{receiptData.total.toLocaleString()}</span></div>
                        <div className="border-b border-black border-dashed mt-2 mb-4"></div><div className="text-center text-sm font-bold">Thank you!</div>
                    </div>
                )}
            </div>

            {/* --- MOBILE HEADER --- */}
            <div className="md:hidden bg-gray-900 text-white p-3 flex justify-between items-center z-30 shadow-md shrink-0 h-14 print:hidden">
                <div className="flex items-center gap-2">
                    {shopLogo ? <img src={shopLogo} alt="Logo" className="w-8 h-8 rounded-full object-cover" /> : <div className="bg-brand-600 p-1 rounded-lg"><DollarSign size={16} /></div>}
                    <span className="font-bold text-lg tracking-tight">POS v2.1</span>
                </div>
                 <div className="flex items-center gap-3">
                    {activeTab === 'order' && <button onClick={() => setIsEditMode(!isEditMode)} className={`p-1.5 rounded-full ${isEditMode ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-800 text-gray-400'}`}><Edit2 size={16}/></button>}
                    <div className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${isStoreOpen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}><div className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>{isStoreOpen ? 'OPEN' : 'CLOSED'}</div>
                 </div>
            </div>

            {/* --- DESKTOP SIDEBAR --- */}
            <aside className="hidden md:flex w-24 bg-gray-900 flex-col items-center py-6 text-gray-400 z-10 shadow-xl justify-between shrink-0 print:hidden">
                <div className="flex flex-col items-center gap-6 w-full">
                    <div className="mb-2 relative group cursor-pointer">
                        {shopLogo ? <img src={shopLogo} alt="Logo" className="w-14 h-14 rounded-full object-cover border-2 border-brand-500" /> : <div className="bg-brand-600 p-3 rounded-xl text-white shadow-lg shadow-brand-500/50"><DollarSign size={28} /></div>}
                         <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLogoUpload}/>
                    </div>
                    <button onClick={() => setActiveTab('order')} className={`p-4 rounded-2xl transition w-16 h-16 flex items-center justify-center ${activeTab === 'order' ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-gray-800'}`} title="New Order"><ShoppingBag size={28} /></button>
                    <button onClick={() => setActiveTab('tables')} className={`p-4 rounded-2xl transition relative w-16 h-16 flex items-center justify-center ${activeTab === 'tables' ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-gray-800'}`} title="Active Tables"><Layers size={28} />{activeTables.length > 0 && <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}</button>
                    <button onClick={() => setActiveTab('sales')} className={`p-4 rounded-2xl transition w-16 h-16 flex items-center justify-center ${activeTab === 'sales' ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-gray-800'}`} title="Reports"><PieChart size={28} /></button>
                    <button onClick={() => setActiveTab('qr_gen')} className={`p-4 rounded-2xl transition w-16 h-16 flex items-center justify-center ${activeTab === 'qr_gen' ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-gray-800'}`} title="QR Generator"><QrCode size={28} /></button>
                     <button onClick={() => setActiveTab('manage')} className={`p-4 rounded-2xl transition w-16 h-16 flex items-center justify-center ${activeTab === 'manage' ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-gray-800'}`} title="Store Settings"><Settings size={28} /></button>
                </div>
                <div className="flex flex-col items-center gap-4 w-full">
                    <button onClick={toggleLanguage} className="text-xs font-bold bg-gray-800 text-gray-300 w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-700">{language.toUpperCase()}</button>
                    <button onClick={adminLogout} className="p-4 text-red-400 hover:bg-gray-800 rounded-xl transition" title="Logout"><LogOut size={28} /></button>
                </div>
            </aside>
            
            {/* --- MOBILE BOTTOM NAV --- */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-gray-900 border-t border-gray-800 flex justify-around items-center z-50 px-2 print:hidden">
                <button onClick={() => { setActiveTab('order'); setShowMobileCart(false); }} className={`flex flex-col items-center gap-1 ${activeTab === 'order' && !showMobileCart ? 'text-brand-500' : 'text-gray-400'}`}><ShoppingBag size={20}/><span className="text-[10px] font-bold">Order</span></button>
                 <button onClick={() => { setActiveTab('tables'); setShowMobileCart(false); }} className={`flex flex-col items-center gap-1 relative ${activeTab === 'tables' ? 'text-brand-500' : 'text-gray-400'}`}><Layers size={20}/>{activeTables.length > 0 && <span className="absolute top-0 right-3 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}<span className="text-[10px] font-bold">Tables</span></button>
                <div className="relative -top-5"><button onClick={() => setShowMobileCart(!showMobileCart)} className="bg-brand-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center border-4 border-gray-900">{showMobileCart ? <X size={24}/> : (<><ShoppingBag size={24}/>{cart.length > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cart.reduce((s,i)=>s+i.quantity,0)}</span>}</>)}</button></div>
                <button onClick={() => { setActiveTab('qr_gen'); setShowMobileCart(false); }} className={`flex flex-col items-center gap-1 ${activeTab === 'qr_gen' ? 'text-brand-500' : 'text-gray-400'}`}><QrCode size={20}/><span className="text-[10px] font-bold">QR</span></button>
                <button onClick={() => { setActiveTab('manage'); setShowMobileCart(false); }} className={`flex flex-col items-center gap-1 ${activeTab === 'manage' ? 'text-brand-500' : 'text-gray-400'}`}><Settings size={20}/><span className="text-[10px] font-bold">Settings</span></button>
            </div>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex overflow-hidden relative print:hidden">
                {activeTab === 'order' && (
                    <>
                        <div className={`flex-1 flex flex-col h-full bg-gray-100 relative ${showMobileCart ? 'hidden md:flex' : 'flex'}`}>
                            <div className="bg-white px-4 py-3 shadow-sm border-b shrink-0 overflow-x-auto no-scrollbar flex items-center gap-2">
                                <button onClick={() => setIsEditMode(!isEditMode)} className={`hidden md:flex p-3 rounded-xl items-center gap-2 mr-2 transition ${isEditMode ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}><Edit2 size={20}/> <span className="text-sm font-bold">{isEditMode ? 'Editing' : 'Order'}</span></button>
                                {CATEGORIES.map(cat => (<button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`whitespace-nowrap px-6 py-3 rounded-xl text-base font-bold transition ${activeCategory === cat.id ? 'bg-brand-600 text-white shadow-md scale-105' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{language === 'th' ? cat.labelTh : cat.label}</button>))}
                                {isEditMode && <button onClick={handleOpenAddModal} className="whitespace-nowrap px-4 py-3 rounded-xl text-sm font-bold bg-green-500 text-white flex items-center gap-1 shadow hover:bg-green-600 ml-auto"><Plus size={18}/> New Item</button>}
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {filteredMenu.map(item => {
                                        const localized = getLocalizedItem(item);
                                        return (
                                            <div key={item.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col transition h-full group ${!item.available ? 'opacity-60 grayscale' : ''} ${isEditMode ? 'hover:border-blue-400' : 'hover:border-brand-400 cursor-pointer active:scale-95'}`}>
                                                <div className="relative aspect-square overflow-hidden" onClick={() => !isEditMode && handleCustomize(item)}>
                                                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-500"/>
                                                    {!item.available && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">SOLD OUT</div>}
                                                    {isEditMode && (<div className="absolute top-2 right-2 flex gap-1"><button onClick={(e) => { e.stopPropagation(); handleEditMenuItem(item); }} className="bg-blue-500 text-white p-2 rounded-lg shadow hover:bg-blue-600"><Edit2 size={16}/></button><button onClick={(e) => { e.stopPropagation(); togglePizzaAvailability(item.id); }} className={`p-2 rounded-lg shadow text-white ${item.available ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}><Power size={16}/></button><button onClick={(e) => { e.stopPropagation(); toggleBestSeller(item.id); }} className={`p-2 rounded-lg shadow text-white ${item.isBestSeller ? 'bg-yellow-400' : 'bg-gray-400'}`}><Star size={16} fill="currentColor"/></button></div>)}
                                                </div>
                                                <div className="p-4 flex flex-col flex-1" onClick={() => !isEditMode && handleCustomize(item)}>
                                                    <h3 className="font-bold text-gray-800 text-base md:text-lg leading-tight mb-1">{localized.name}</h3>
                                                    <div className="mt-auto flex justify-between items-center pt-2"><span className="font-bold text-brand-600 text-lg md:text-xl">฿{item.basePrice}</span>{!isEditMode && <div className="bg-brand-50 text-brand-600 p-2 rounded-lg"><Plus size={24}/></div>}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className={`w-full md:w-80 lg:w-96 bg-white border-l shadow-xl flex flex-col z-40 fixed md:relative inset-0 md:inset-auto transition-transform duration-300 ${showMobileCart ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}`}>
                            <div className="md:hidden p-4 bg-gray-900 text-white flex justify-between items-center"><h2 className="font-bold text-lg flex items-center gap-2"><ShoppingBag/> Current Order</h2><button onClick={() => setShowMobileCart(false)} className="bg-white/20 p-2 rounded-full"><X size={20}/></button></div>
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                                {cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50"><ShoppingBag size={64} className="mb-4"/><p className="font-bold text-xl">No items yet</p></div> : <div className="space-y-3">{cart.map(item => (<div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group active:bg-gray-50"><div className="flex justify-between items-start mb-2 cursor-pointer" onClick={() => handleEditCartItem(item)}><div className="pr-6"><h4 className="font-bold text-gray-800 text-base">{item.name}</h4>{item.specialInstructions && <div className="text-xs text-red-500 font-bold mt-1 bg-red-50 inline-block px-1 rounded">Note: {item.specialInstructions}</div>}<p className="text-xs text-gray-500 leading-tight mt-1">{item.selectedToppings.map(t => t.name).join(', ')}{item.subItems?.map(s => `+ ${s.name}`).join(', ')}</p></div><div className="font-bold text-gray-900 text-base">฿{item.totalPrice}</div></div><div className="flex items-center justify-between mt-3"><div className="flex items-center bg-gray-100 rounded-lg p-1"><button onClick={() => item.quantity > 1 ? updateCartItemQuantity(item.id, -1) : removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white rounded-md shadow-sm transition"><Minus size={16}/></button><span className="w-10 text-center font-bold text-base">{item.quantity}</span><button onClick={() => updateCartItemQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white rounded-md shadow-sm transition"><Plus size={16}/></button></div><button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={20}/></button></div></div>))}</div>}
                            </div>
                            <div className="p-4 bg-white border-t space-y-3">
                                <div className="grid grid-cols-2 gap-2"><input type="text" placeholder="Table No. / Name" className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base font-bold focus:border-brand-500 outline-none w-full" value={tableNumber} onChange={e => setTableNumber(e.target.value)}/><select className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base font-bold focus:border-brand-500 outline-none w-full" value={orderSource} onChange={e => setOrderSource(e.target.value as OrderSource)}><option value="store">In-Store</option><option value="grab">Grab</option><option value="lineman">Lineman</option><option value="robinhood">Robinhood</option><option value="foodpanda">Foodpanda</option></select></div>
                                <div className="flex justify-between items-center text-2xl font-bold text-gray-900 mt-2"><span>Total</span><span>฿{cartTotal}</span></div>
                                <div className="grid grid-cols-2 gap-3"><button onClick={handleSendToKitchen} disabled={cart.length === 0} className="py-4 rounded-xl font-bold text-lg bg-yellow-400 text-yellow-900 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow">Kitchen</button><button onClick={handleCheckBill} disabled={cart.length === 0} className="py-4 rounded-xl font-bold text-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow">Pay Now</button></div>
                            </div>
                        </div>
                    </>
                )}
