
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
    const [receiptData, setReceiptData] = useState<{table: string, items: any[], total: number, date: string} | null>(null);

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
        
        // CRITICAL FIX: Aggressively reset ALL state to prevent "Wrong Pizza" issues
        // Force a deep copy of the selected pizza object to avoid reference issues
        setSelectedPizza({...pizza}); 
        
        // Reset Toppings
        setSelectedToppings([]);
        
        // Reset Edit Mode
        setEditingCartItem(null);
        
        // Reset Combo State (Vital for combo/non-combo switching)
        setComboSelections([]);
        setActiveComboSlot(null);

        // Check if it's a combo and initialize properly
        if (pizza.category === 'promotion' && (pizza.comboCount || 0) > 0) {
            setComboSelections(new Array(pizza.comboCount).fill(null));
        }
    };

    const handleEditCartItem = (item: CartItem) => {
        const pizza = menu.find(p => p.id === item.pizzaId);
        if (pizza) {
            setSelectedPizza({...pizza}); // Deep copy for safety
            setSelectedToppings(item.selectedToppings);
            setEditingCartItem(item);
            
            // If it's a combo, restore selections
            if (item.subItems) {
                 setComboSelections(item.subItems);
            }
            
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
            // Ensure status is definitely completed
            await completeOrder(orderId, { paymentMethod: 'cash' }); // Default note/method if just closing
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
    
    // Event Gallery Upload
    const handleEventImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const res = reader.result as string;
                const newGallery = [...(mediaForm.eventGalleryUrls || []), res];
                setMediaForm(prev => ({ ...prev, eventGalleryUrls: newGallery }));
                alert("Image added! Don't forget to click 'Save Media Settings'.");
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
        // Event Gallery
        const cleanEvents = (mediaForm.eventGalleryUrls || []).filter(l => l && l.trim() !== '');

        updateStoreSettings({
            promoBannerUrl: mediaForm.promoBannerUrl,
            reviewLinks: cleanReviews,
            vibeLinks: cleanVibes,
            eventGalleryUrls: cleanEvents
        });
        
        // Update local state to reflect cleaned arrays (removes empty slots from UI)
        setMediaForm(prev => ({
            ...prev,
            reviewLinks: cleanReviews,
            vibeLinks: cleanVibes,
            eventGalleryUrls: cleanEvents
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
            
            {/* ... [Receipt Printer] ... */}
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
                            <img src={shopLogo} alt="Logo" className="w-12 h-12 rounded-full object-cover border-2 border-brand-500" />
                        ) : (
                            <div className="bg-brand-600 p-2 rounded-xl text-white shadow-lg shadow-brand-500/50"><DollarSign size={24} /></div>
                        )}
                         <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLogoUpload}/>
                    </div>

                    <button 
                        onClick={() => setActiveTab('order')} 
                        className={`p-3 rounded-xl transition ${activeTab === 'order' ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-gray-800'}`} 
                        title="New Order"
                    >
                        <ShoppingBag size={24} />
                    </button>
                    
                    <button 
                        onClick={() => setActiveTab('tables')} 
                        className={`p-3 rounded-xl transition relative ${activeTab === 'tables' ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-gray-800'}`} 
                        title="Active Tables"
                    >
                        <Layers size={24} />
                        {activeTables.length > 0 && <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
                    </button>
                    
                    <button 
                        onClick={() => setActiveTab('sales')} 
                        className={`p-3 rounded-xl transition ${activeTab === 'sales' ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-gray-800'}`} 
                        title="Reports"
                    >
                        <PieChart size={24} />
                    </button>

                     <button 
                        onClick={() => setActiveTab('manage')} 
                        className={`p-3 rounded-xl transition ${activeTab === 'manage' ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-gray-800'}`} 
                        title="Store Settings"
                    >
                        <Settings size={24} />
                    </button>
                    
                     <button 
                        onClick={() => setActiveTab('qr_gen')} 
                        className={`p-3 rounded-xl transition ${activeTab === 'qr_gen' ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-gray-800'}`} 
                        title="QR Table Codes"
                    >
                        <QrCode size={24} />
                    </button>
                </div>

                <div className="flex flex-col items-center gap-4 w-full">
                    <button onClick={toggleLanguage} className="text-xs font-bold bg-gray-800 text-gray-300 w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-700">{language.toUpperCase()}</button>
                    <button onClick={adminLogout} className="p-3 text-red-400 hover:bg-gray-800 rounded-xl transition" title="Logout">
                        <LogOut size={24} />
                    </button>
                </div>
            </aside>
            
            {/* --- MOBILE BOTTOM NAV --- */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-gray-900 border-t border-gray-800 flex justify-around items-center z-50 px-2 print:hidden">
                <button onClick={() => { setActiveTab('order'); setShowMobileCart(false); }} className={`flex flex-col items-center gap-1 ${activeTab === 'order' && !showMobileCart ? 'text-brand-500' : 'text-gray-400'}`}>
                    <ShoppingBag size={20}/>
                    <span className="text-[10px] font-bold">Order</span>
                </button>
                 <button onClick={() => { setActiveTab('tables'); setShowMobileCart(false); }} className={`flex flex-col items-center gap-1 relative ${activeTab === 'tables' ? 'text-brand-500' : 'text-gray-400'}`}>
                    <Layers size={20}/>
                     {activeTables.length > 0 && <span className="absolute top-0 right-3 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}
                    <span className="text-[10px] font-bold">Tables</span>
                </button>
                <div className="relative -top-5">
                    <button onClick={() => setShowMobileCart(!showMobileCart)} className="bg-brand-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center border-4 border-gray-900">
                         {showMobileCart ? <X size={24}/> : (
                             <>
                                 <ShoppingBag size={24}/>
                                 {cart.length > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cart.reduce((s,i)=>s+i.quantity,0)}</span>}
                             </>
                         )}
                    </button>
                </div>
                <button onClick={() => { setActiveTab('sales'); setShowMobileCart(false); }} className={`flex flex-col items-center gap-1 ${activeTab === 'sales' ? 'text-brand-500' : 'text-gray-400'}`}>
                    <PieChart size={20}/>
                    <span className="text-[10px] font-bold">Sales</span>
                </button>
                <button onClick={() => { setActiveTab('manage'); setShowMobileCart(false); }} className={`flex flex-col items-center gap-1 ${activeTab === 'manage' ? 'text-brand-500' : 'text-gray-400'}`}>
                    <Settings size={20}/>
                    <span className="text-[10px] font-bold">Settings</span>
                </button>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="flex-1 flex overflow-hidden relative print:hidden">
                
                {/* 1. ORDER TAB */}
                {activeTab === 'order' && (
                    <>
                        <div className={`flex-1 flex flex-col h-full bg-gray-100 relative ${showMobileCart ? 'hidden md:flex' : 'flex'}`}>
                            {/* Header / Categories */}
                            <div className="bg-white px-4 py-3 shadow-sm border-b shrink-0 overflow-x-auto no-scrollbar flex items-center gap-2">
                                {/* Edit Mode Toggle */}
                                <button 
                                    onClick={() => setIsEditMode(!isEditMode)} 
                                    className={`hidden md:flex p-2 rounded-lg items-center gap-2 mr-2 transition ${isEditMode ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                >
                                    <Edit2 size={16}/> <span className="text-sm font-bold">{isEditMode ? 'Editing Mode' : 'Order Mode'}</span>
                                </button>
                                
                                {CATEGORIES.map(cat => (
                                    <button 
                                        key={cat.id} 
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition ${activeCategory === cat.id ? 'bg-brand-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        {language === 'th' ? cat.labelTh : cat.label}
                                    </button>
                                ))}
                                {isEditMode && (
                                     <button onClick={handleOpenAddModal} className="whitespace-nowrap px-3 py-2 rounded-full text-sm font-bold bg-green-500 text-white flex items-center gap-1 shadow hover:bg-green-600 ml-auto">
                                         <Plus size={16}/> New Item
                                     </button>
                                )}
                            </div>
                            
                            {/* Grid */}
                            <div className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {filteredMenu.map(item => {
                                        const localized = getLocalizedItem(item);
                                        return (
                                            <div key={item.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col transition h-full group ${!item.available ? 'opacity-60 grayscale' : ''} ${isEditMode ? 'hover:border-blue-400' : 'hover:border-brand-400 cursor-pointer'}`}>
                                                <div className="relative aspect-square overflow-hidden" onClick={() => !isEditMode && handleCustomize(item)}>
                                                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-500"/>
                                                    {!item.available && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-sm">SOLD OUT</div>}
                                                    {isEditMode && (
                                                        <div className="absolute top-2 right-2 flex gap-1">
                                                            <button onClick={(e) => { e.stopPropagation(); handleEditMenuItem(item); }} className="bg-blue-500 text-white p-1.5 rounded-md shadow hover:bg-blue-600"><Edit2 size={12}/></button>
                                                            <button onClick={(e) => { e.stopPropagation(); togglePizzaAvailability(item.id); }} className={`p-1.5 rounded-md shadow text-white ${item.available ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                                                                <Power size={12}/>
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); toggleBestSeller(item.id); }} className={`p-1.5 rounded-md shadow text-white ${item.isBestSeller ? 'bg-yellow-400' : 'bg-gray-400'}`}>
                                                                <Star size={12} fill="currentColor"/>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-3 flex flex-col flex-1" onClick={() => !isEditMode && handleCustomize(item)}>
                                                    <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1">{localized.name}</h3>
                                                    <div className="mt-auto flex justify-between items-center pt-2">
                                                        <span className="font-bold text-brand-600">฿{item.basePrice}</span>
                                                        {!isEditMode && <div className="bg-brand-50 text-brand-600 p-1 rounded-md"><Plus size={14}/></div>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* --- CART SIDEBAR (Desktop) / Mobile Modal --- */}
                        <div className={`w-full md:w-96 bg-white border-l shadow-xl flex flex-col z-40 fixed md:relative inset-0 md:inset-auto transition-transform duration-300 ${showMobileCart ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}`}>
                            {/* Mobile Header */}
                            <div className="md:hidden p-4 bg-gray-900 text-white flex justify-between items-center">
                                <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingBag/> Current Order</h2>
                                <button onClick={() => setShowMobileCart(false)} className="bg-white/20 p-2 rounded-full"><X size={20}/></button>
                            </div>

                            {/* Cart Content */}
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                                        <ShoppingBag size={48} className="mb-2"/>
                                        <p className="font-medium">No items yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {cart.map(item => (
                                            <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 relative group">
                                                <div className="flex justify-between items-start mb-1 cursor-pointer" onClick={() => handleEditCartItem(item)}>
                                                    <div className="pr-6">
                                                        <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                                                        <p className="text-xs text-gray-500 leading-tight mt-0.5">
                                                            {item.selectedToppings.map(t => t.name).join(', ')}
                                                            {item.subItems?.map(s => `+ ${s.name}`).join(', ')}
                                                        </p>
                                                    </div>
                                                    <div className="font-bold text-gray-900 text-sm">฿{item.totalPrice}</div>
                                                </div>
                                                
                                                <div className="flex items-center justify-between mt-3">
                                                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                                                        <button onClick={() => item.quantity > 1 ? updateCartItemQuantity(item.id, -1) : removeFromCart(item.id)} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-white rounded-md shadow-sm transition"><Minus size={14}/></button>
                                                        <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                                        <button onClick={() => updateCartItemQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-white rounded-md shadow-sm transition"><Plus size={14}/></button>
                                                    </div>
                                                    <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Cart Footer */}
                            <div className="p-4 bg-white border-t space-y-3">
                                {/* Order Settings */}
                                <div className="grid grid-cols-2 gap-2">
                                     <input 
                                        type="text" 
                                        placeholder="Table No. / Name" 
                                        className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none w-full"
                                        value={tableNumber}
                                        onChange={e => setTableNumber(e.target.value)}
                                     />
                                     <select 
                                        className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none w-full"
                                        value={orderSource}
                                        onChange={e => setOrderSource(e.target.value as OrderSource)}
                                     >
                                         <option value="store">In-Store</option>
                                         <option value="grab">Grab</option>
                                         <option value="lineman">Lineman</option>
                                         <option value="robinhood">Robinhood</option>
                                         <option value="foodpanda">Foodpanda</option>
                                     </select>
                                </div>
                                
                                <div className="flex justify-between items-center text-xl font-bold text-gray-900 mt-2">
                                    <span>Total</span>
                                    <span>฿{cartTotal}</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={handleSendToKitchen}
                                        disabled={cart.length === 0}
                                        className="py-3 rounded-xl font-bold bg-yellow-400 text-yellow-900 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow"
                                    >
                                        Send Kitchen
                                    </button>
                                    <button 
                                        onClick={handleCheckBill}
                                        disabled={cart.length === 0}
                                        className="py-3 rounded-xl font-bold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow"
                                    >
                                        Pay Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* 2. ACTIVE TABLES TAB (IMPROVED) */}
                {activeTab === 'tables' && (
                    <div className="flex-1 bg-gray-100 p-6 overflow-y-auto pb-24 md:pb-6">
                        <div className="max-w-7xl mx-auto">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Layers className="text-brand-600"/> Active Tables
                            </h2>
                            
                            {activeTables.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                    <Layers size={64} className="mb-4 opacity-20"/>
                                    <p className="text-xl font-bold">No active tables</p>
                                    <button onClick={() => setActiveTab('order')} className="mt-4 text-brand-600 hover:underline font-bold">Start New Order</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {activeTables.map(order => (
                                        <div key={order.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
                                            {/* Header */}
                                            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                                                <div>
                                                    <div className="text-xs text-gray-500 font-bold uppercase mb-1">Order #{order.id.slice(-4)}</div>
                                                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                                        {order.tableNumber ? (
                                                            <span className="bg-gray-800 text-white px-2 py-0.5 rounded text-sm">Table {order.tableNumber}</span>
                                                        ) : (
                                                            <span className="text-gray-600">{order.customerName}</span>
                                                        )}
                                                        {order.source !== 'store' && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full uppercase">{order.source}</span>}
                                                    </h3>
                                                </div>
                                                <div className="text-right">
                                                     <div className="text-xl font-bold text-brand-600">฿{order.totalAmount}</div>
                                                     <div className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded mt-1 inline-block">UNPAID</div>
                                                </div>
                                            </div>
                                            
                                            {/* Item Summary (Short) */}
                                            <div className="p-4 flex-1">
                                                <div className="text-sm text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                                                    {order.items.map((item, i) => (
                                                        <div key={i} className="flex justify-between">
                                                            <span>{item.quantity}x {item.name}</span>
                                                            <span className="font-bold text-gray-800">฿{item.totalPrice}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            {/* Actions */}
                                            <div className="p-4 border-t bg-gray-50 grid grid-cols-2 gap-3">
                                                 <button 
                                                    onClick={() => handleCheckTableBill(order)} 
                                                    className="bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition"
                                                 >
                                                    <Receipt size={18}/> Check Bill
                                                 </button>
                                                 <div className="grid grid-cols-2 gap-2">
                                                     <button onClick={() => handleCloseTable(order.id)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold text-xs" title="Force Complete">
                                                         Clear
                                                     </button>
                                                     <button onClick={() => handleCancelTable(order.id)} className="bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold text-xs" title="Cancel Order">
                                                         Cancel
                                                     </button>
                                                 </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. SALES REPORT TAB */}
                {activeTab === 'sales' && (
                    <div className="flex-1 bg-gray-100 p-6 overflow-y-auto pb-24 md:pb-6">
                        <div className="max-w-7xl mx-auto space-y-8">
                             {/* Stats Cards */}
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                 <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-100">
                                     <div className="text-gray-500 text-xs font-bold uppercase mb-1">Gross Sales</div>
                                     <div className="text-2xl font-bold text-brand-600">฿{totalGrossSales.toLocaleString()}</div>
                                 </div>
                                 <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                                     <div className="text-gray-500 text-xs font-bold uppercase mb-1">Expenses</div>
                                     <div className="text-2xl font-bold text-red-600">฿{totalExpenses.toLocaleString()}</div>
                                 </div>
                                 <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
                                     <div className="text-gray-500 text-xs font-bold uppercase mb-1">Net Profit</div>
                                     <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>฿{netProfit.toLocaleString()}</div>
                                 </div>
                                 <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                                     <div className="text-gray-500 text-xs font-bold uppercase mb-1">Orders</div>
                                     <div className="text-2xl font-bold text-blue-600">{filteredOrders.length}</div>
                                 </div>
                             </div>

                             {/* Sales Table */}
                             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                 <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                     <h3 className="font-bold flex items-center gap-2"><List size={18}/> Transaction History</h3>
                                     <div className="flex gap-2">
                                         <div className="flex bg-white rounded-lg border p-1">
                                             {['day','month','year','all'].map(f => (
                                                 <button 
                                                    key={f}
                                                    onClick={() => setSalesFilter(f as any)} 
                                                    className={`px-3 py-1 rounded text-xs font-bold capitalize ${salesFilter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                                 >
                                                     {f}
                                                 </button>
                                             ))}
                                         </div>
                                         <button onClick={handleExportSales} className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200"><FileSpreadsheet size={18}/></button>
                                     </div>
                                 </div>
                                 <div className="overflow-x-auto">
                                     <table className="w-full text-sm text-left">
                                         <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                             <tr>
                                                 <th className="p-3">Time</th>
                                                 <th className="p-3">Source</th>
                                                 <th className="p-3">Items</th>
                                                 <th className="p-3">Total</th>
                                                 <th className="p-3">Pay</th>
                                                 <th className="p-3 text-center">Action</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y">
                                             {filteredOrders.map(order => (
                                                 <tr key={order.id} className="hover:bg-gray-50">
                                                     <td className="p-3 whitespace-nowrap">
                                                         <div className="font-bold">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                                         <div className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</div>
                                                     </td>
                                                     <td className="p-3">
                                                         <span className="uppercase text-xs font-bold bg-gray-100 px-2 py-1 rounded">{order.source}</span>
                                                         {order.tableNumber && <div className="text-xs mt-1 text-gray-500">T-{order.tableNumber}</div>}
                                                     </td>
                                                     <td className="p-3 max-w-xs truncate text-gray-600">
                                                         {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                                     </td>
                                                     <td className="p-3 font-bold text-gray-900">฿{order.totalAmount}</td>
                                                     <td className="p-3">
                                                         <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${order.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                             {order.paymentMethod || '-'}
                                                         </span>
                                                     </td>
                                                     <td className="p-3 text-center">
                                                         <button onClick={() => handleDeleteOrder(order.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                                     </td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>
                             </div>

                             {/* Expenses Section */}
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                 {/* Add Expense Form */}
                                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full">
                                     <h3 className="font-bold mb-4 flex items-center gap-2"><Calculator size={18}/> Record Expense</h3>
                                     
                                     {/* Quick Add Presets */}
                                     <div className="mb-4 flex flex-wrap gap-2">
                                         {PRESET_EXPENSES.map((preset, idx) => (
                                             <button 
                                                key={idx}
                                                onClick={() => setExpenseForm({...expenseForm, description: preset.label, category: preset.category as ExpenseCategory})}
                                                className="text-xs border border-gray-200 bg-gray-50 px-2 py-1 rounded hover:bg-gray-100 transition"
                                             >
                                                 {preset.label}
                                             </button>
                                         ))}
                                     </div>

                                     <form onSubmit={handleAddExpense} className="space-y-3">
                                         <input 
                                            type="text" 
                                            placeholder="Description (e.g. Ice)" 
                                            className="w-full border rounded-lg p-2 text-sm"
                                            value={expenseForm.description}
                                            onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                                            required
                                         />
                                         <div className="flex gap-2">
                                             <input 
                                                type="number" 
                                                placeholder="Amount" 
                                                className="w-1/2 border rounded-lg p-2 text-sm"
                                                value={expenseForm.amount}
                                                onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                                                required
                                             />
                                             <select 
                                                className="w-1/2 border rounded-lg p-2 text-sm bg-white"
                                                value={expenseForm.category}
                                                onChange={e => setExpenseForm({...expenseForm, category: e.target.value as ExpenseCategory})}
                                             >
                                                 {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                             </select>
                                         </div>
                                         <input 
                                            type="text" 
                                            placeholder="Note (Optional)" 
                                            className="w-full border rounded-lg p-2 text-sm"
                                            value={expenseForm.note}
                                            onChange={e => setExpenseForm({...expenseForm, note: e.target.value})}
                                         />
                                         <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg transition">Add Expense</button>
                                     </form>
                                 </div>

                                 {/* Recent Expenses List */}
                                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full max-h-[500px]">
                                     <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
                                         <h3 className="font-bold text-gray-700 text-sm uppercase">Recent Expenses</h3>
                                         <button onClick={handleExportExpenses} className="text-gray-500 hover:text-green-600"><FileSpreadsheet size={16}/></button>
                                     </div>
                                     <div className="flex-1 overflow-y-auto">
                                         {filteredExpenses.slice().reverse().map(exp => (
                                             <div key={exp.id} className="p-3 border-b flex justify-between items-center hover:bg-gray-50 group">
                                                 <div>
                                                     <div className="font-bold text-gray-800 text-sm">{exp.description}</div>
                                                     <div className="text-xs text-gray-500">{new Date(exp.date).toLocaleDateString()} • {exp.category}</div>
                                                 </div>
                                                 <div className="flex items-center gap-3">
                                                     <span className="font-bold text-red-600">฿{exp.amount}</span>
                                                     <button onClick={() => deleteExpense(exp.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><X size={14}/></button>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                )}
                
                {/* 4. SETTINGS TAB */}
                {activeTab === 'manage' && (
                    <div className="flex-1 bg-gray-100 p-6 overflow-y-auto pb-24 md:pb-6">
                        <div className="max-w-4xl mx-auto space-y-6">
                            {/* Store Status Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Store/> Store Status</h3>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`text-sm font-bold px-3 py-1 rounded-full flex items-center gap-2 ${isStoreOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        <div className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        {isStoreOpen ? 'OPEN FOR ORDERS' : 'CLOSED'}
                                    </div>
                                    <button 
                                        onClick={() => toggleStoreStatus(!isStoreOpen)} 
                                        className={`px-4 py-2 rounded-lg font-bold text-white transition ${isStoreOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                                    >
                                        {isStoreOpen ? 'Close Store' : 'Open Store'}
                                    </button>
                                </div>
                                
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Closed Message (Displayed to customers)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        className="flex-1 border rounded-lg p-2"
                                        value={tempClosedMsg} 
                                        onChange={e => setTempClosedMsg(e.target.value)}
                                    />
                                    <button onClick={() => toggleStoreStatus(isStoreOpen, tempClosedMsg)} className="bg-gray-900 text-white px-4 rounded-lg font-bold text-sm">Save Msg</button>
                                </div>
                            </div>
                            
                            {/* Media Manager */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ImageIcon/> Media & Links</h3>
                                
                                {/* Banner */}
                                <div className="mb-6">
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Promo Banner (Image or Video URL)</label>
                                    <div className="flex gap-2 mb-2">
                                        <input type="text" className="flex-1 border rounded-lg p-2 text-sm" placeholder="https://..." value={mediaForm.promoBannerUrl} onChange={e => setMediaForm({...mediaForm, promoBannerUrl: e.target.value})} />
                                        <label className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2">
                                            <Upload size={16}/> <span className="text-xs font-bold">Upload</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload}/>
                                        </label>
                                    </div>
                                    {mediaForm.promoBannerUrl && (
                                        <div className="h-32 w-full bg-gray-100 rounded-lg overflow-hidden relative">
                                            <img src={mediaForm.promoBannerUrl} className="w-full h-full object-cover opacity-80" />
                                            <div className="absolute inset-0 flex items-center justify-center font-bold text-gray-600">Preview</div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Reviews Links */}
                                <div className="mb-6">
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Review Video Links (TikTok/Reels/YouTube)</label>
                                    <div className="space-y-2">
                                        {[0,1,2].map(i => (
                                            <input 
                                                key={i}
                                                type="text" 
                                                className="w-full border rounded-lg p-2 text-sm" 
                                                placeholder={`Review Link #${i+1}`}
                                                value={mediaForm.reviewLinks?.[i] || ''}
                                                onChange={e => updateLocalMediaLink('review', i, e.target.value)}
                                            />
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Event Gallery */}
                                <div className="mb-6">
                                     <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Event Gallery Images</label>
                                     <div className="flex flex-wrap gap-2 mb-2">
                                         {mediaForm.eventGalleryUrls?.map((url, i) => (
                                             <div key={i} className="w-20 h-20 relative group rounded-lg overflow-hidden border">
                                                 <img src={url} className="w-full h-full object-cover"/>
                                                 <button 
                                                     onClick={() => {
                                                         const newArr = mediaForm.eventGalleryUrls.filter((_, idx) => idx !== i);
                                                         setMediaForm(prev => ({...prev, eventGalleryUrls: newArr}));
                                                     }}
                                                     className="absolute top-0 right-0 bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition"
                                                 ><X size={12}/></button>
                                             </div>
                                         ))}
                                         <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-gray-400">
                                             <Plus size={24}/>
                                             <span className="text-[10px]">Add</span>
                                             <input type="file" accept="image/*" className="hidden" onChange={handleEventImageUpload}/>
                                         </label>
                                     </div>
                                </div>
                                
                                <button onClick={handleSaveMediaSettings} className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition">Save Media Settings</button>
                            </div>
                            
                            {/* Contact & Payment */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Phone/> Contact & Payment</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                     <div>
                                         <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Contact Phone</label>
                                         <input type="text" className="w-full border rounded-lg p-2" value={contactForm.contactPhone} onChange={e => setContactForm({...contactForm, contactPhone: e.target.value})}/>
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold text-gray-500 uppercase block mb-1">PromptPay Number (Mobile/TaxID)</label>
                                         <input type="text" className="w-full border rounded-lg p-2" value={contactForm.promptPayNumber} onChange={e => setContactForm({...contactForm, promptPayNumber: e.target.value})}/>
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Google Maps Link</label>
                                         <input type="text" className="w-full border rounded-lg p-2" value={contactForm.mapUrl} onChange={e => setContactForm({...contactForm, mapUrl: e.target.value})}/>
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Facebook Link</label>
                                         <input type="text" className="w-full border rounded-lg p-2" value={contactForm.facebookUrl} onChange={e => setContactForm({...contactForm, facebookUrl: e.target.value})}/>
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Line Link</label>
                                         <input type="text" className="w-full border rounded-lg p-2" value={contactForm.lineUrl} onChange={e => setContactForm({...contactForm, lineUrl: e.target.value})}/>
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Review URL</label>
                                         <input type="text" className="w-full border rounded-lg p-2" value={contactForm.reviewUrl} onChange={e => setContactForm({...contactForm, reviewUrl: e.target.value})}/>
                                     </div>
                                </div>
                                <button onClick={handleSaveContactSettings} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition">Save Contact & Payment</button>
                            </div>
                            
                            {/* News Manager */}
                             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Newspaper/> News & Events</h3>
                                <form onSubmit={handleAddNews} className="space-y-3 mb-6">
                                     <input type="text" placeholder="Title" className="w-full border rounded-lg p-2" value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} required/>
                                     <textarea placeholder="Summary" className="w-full border rounded-lg p-2" rows={2} value={newsForm.summary} onChange={e => setNewsForm({...newsForm, summary: e.target.value})} required/>
                                     <div className="flex gap-2">
                                         <input type="text" placeholder="Image URL (Optional)" className="w-1/2 border rounded-lg p-2" value={newsForm.imageUrl} onChange={e => setNewsForm({...newsForm, imageUrl: e.target.value})} />
                                         <input type="text" placeholder="Link URL (Optional)" className="w-1/2 border rounded-lg p-2" value={newsForm.linkUrl} onChange={e => setNewsForm({...newsForm, linkUrl: e.target.value})} />
                                     </div>
                                     <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700">Add News</button>
                                </form>
                                <div className="space-y-2">
                                    {storeSettings.newsItems?.map(news => (
                                        <div key={news.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                                            <div className="text-sm font-bold">{news.title}</div>
                                            <button onClick={() => deleteNewsItem(news.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                             </div>

                            {/* Database Tools */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Database/> Data Management</h3>
                                <div className="flex flex-wrap gap-4">
                                     <button onClick={handleExportCustomers} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-3 rounded-lg font-bold shadow flex items-center gap-2">
                                         <User size={18}/> Export Customers
                                     </button>
                                     <button onClick={seedDatabase} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-bold shadow flex items-center gap-2">
                                         <Upload size={18}/> Push Menu to Database
                                     </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">* Push Menu overwrites database items with code constants.</p>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* 5. QR CODE GENERATOR TAB */}
                {activeTab === 'qr_gen' && (
                    <div className="flex-1 bg-gray-100 p-6 overflow-y-auto pb-24 md:pb-6 flex items-center justify-center">
                        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                            <h2 className="text-2xl font-bold mb-6 flex items-center justify-center gap-2"><QrCode/> Table QR Generator</h2>
                            
                            <div className="mb-6">
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Base URL</label>
                                <input 
                                    type="text" 
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-center font-mono text-sm focus:border-brand-500 outline-none"
                                    value={qrBaseUrl}
                                    onChange={e => setQrBaseUrl(e.target.value)}
                                />
                            </div>
                            
                            <div className="mb-8">
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Table Number</label>
                                <div className="flex items-center justify-center gap-4">
                                    <button onClick={() => setQrTableNum(String(Math.max(1, parseInt(qrTableNum)-1)))} className="bg-gray-100 p-3 rounded-full hover:bg-gray-200"><Minus size={20}/></button>
                                    <input 
                                        type="number" 
                                        className="w-24 text-center text-3xl font-bold border-b-2 border-brand-500 outline-none"
                                        value={qrTableNum}
                                        onChange={e => setQrTableNum(e.target.value)}
                                    />
                                    <button onClick={() => setQrTableNum(String(parseInt(qrTableNum)+1))} className="bg-gray-100 p-3 rounded-full hover:bg-gray-200"><Plus size={20}/></button>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-300 mb-6 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-brand-500 transition" onClick={() => setShowQrFullScreen(true)}>
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getCleanQrUrl() + '?table=' + qrTableNum)}`} 
                                    className="w-48 h-48 mb-2"
                                />
                                <div className="text-xs text-gray-400 font-mono break-all">{getCleanQrUrl() + '?table=' + qrTableNum}</div>
                                <div className="text-xs text-brand-600 font-bold mt-2 flex items-center gap-1"><Maximize2 size={12}/> Click to Enlarge</div>
                            </div>
                            
                            <button 
                                onClick={handlePrintQrCard} 
                                className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-black flex items-center justify-center gap-2"
                            >
                                <Printer size={20}/> Print Table Card
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* --- MODALS --- */}
            
            {/* FULL SCREEN QR MODAL */}
            {showQrFullScreen && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-8 cursor-pointer" onClick={() => setShowQrFullScreen(false)}>
                    <h1 className="text-6xl font-bold mb-4">Table {qrTableNum}</h1>
                    <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(getCleanQrUrl() + '?table=' + qrTableNum)}`} 
                        className="w-[80vmin] h-[80vmin] shadow-2xl border-4 border-black rounded-3xl"
                    />
                    <p className="mt-8 text-2xl font-bold text-gray-500 animate-pulse">Scan to Order</p>
                </div>
            )}

            {/* PAYMENT MODAL (IMPROVED) */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex overflow-hidden flex-col md:flex-row h-[80vh]">
                        
                        {/* LEFT: ORDER SUMMARY */}
                        <div className="md:w-1/2 bg-gray-50 border-r border-gray-200 p-6 flex flex-col">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                                <Receipt size={24}/> 
                                {selectedOrder ? `Bill for Table ${selectedOrder.tableNumber}` : 'Current Order'}
                            </h2>
                            
                            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                                {(selectedOrder ? selectedOrder.items : cart).map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                        <div>
                                            <div className="font-bold text-gray-800">{item.quantity}x {item.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {item.selectedToppings.map(t => t.name).join(', ')}
                                                {item.subItems?.map(s => `+ ${s.name}`).join(', ')}
                                            </div>
                                        </div>
                                        <div className="font-bold text-gray-700">฿{item.totalPrice}</div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex justify-between items-center text-2xl font-bold text-gray-900">
                                    <span>Total Amount</span>
                                    <span>฿{selectedOrder ? selectedOrder.totalAmount : cartTotal}</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: PAYMENT METHOD */}
                        <div className="md:w-1/2 p-6 flex flex-col bg-white">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-gray-500 uppercase">Payment Method</h3>
                                <button onClick={() => setShowPaymentModal(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"><X size={20}/></button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <button 
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition ${paymentMethod === 'cash' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-100 text-gray-400 hover:border-gray-300'}`}
                                >
                                    <Banknote size={32}/>
                                    <span className="font-bold text-lg">CASH</span>
                                </button>
                                <button 
                                    onClick={() => setPaymentMethod('qr_transfer')}
                                    className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition ${paymentMethod === 'qr_transfer' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-100 text-gray-400 hover:border-gray-300'}`}
                                >
                                    <QrCode size={32}/>
                                    <span className="font-bold text-lg">SCAN QR</span>
                                </button>
                            </div>
                            
                            <div className="flex-1 flex flex-col justify-center">
                                {paymentMethod === 'cash' ? (
                                    <div className="space-y-4 animate-fade-in">
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Cash Received</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">฿</span>
                                                <input 
                                                    type="number" 
                                                    autoFocus
                                                    className="w-full pl-10 pr-4 py-4 text-3xl font-bold border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none"
                                                    value={cashReceived}
                                                    onChange={e => setCashReceived(e.target.value)}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <span className="font-bold text-gray-500 uppercase text-sm">Change</span>
                                            <span className={`text-3xl font-bold ${change < 0 ? 'text-red-500' : 'text-green-600'}`}>฿{change >= 0 ? change.toLocaleString() : '0'}</span>
                                        </div>
                                        
                                        {/* Quick Cash Buttons */}
                                        <div className="grid grid-cols-4 gap-2">
                                            {[100, 500, 1000].map(amt => (
                                                <button key={amt} onClick={() => setCashReceived(String(amt))} className="py-2 bg-gray-100 rounded-lg font-bold text-gray-600 hover:bg-gray-200">
                                                    {amt}
                                                </button>
                                            ))}
                                            <button onClick={() => setCashReceived(String(selectedOrder ? selectedOrder.totalAmount : cartTotal))} className="py-2 bg-brand-100 rounded-lg font-bold text-brand-600 hover:bg-brand-200">
                                                Exact
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center animate-fade-in">
                                        <div className="bg-white p-4 rounded-xl border-2 border-brand-500 shadow-lg mb-4">
                                            <img src={promptPayQRUrl} className="w-48 h-48 md:w-56 md:h-56 mix-blend-multiply" />
                                        </div>
                                        <p className="text-center text-gray-500 text-sm font-bold">Scan with any Banking App</p>
                                        <div className="mt-2 text-2xl font-bold text-brand-600">฿{(selectedOrder ? selectedOrder.totalAmount : cartTotal).toLocaleString()}</div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-6 flex gap-3">
                                <button 
                                    onClick={handlePrintBill}
                                    className="px-4 py-4 rounded-xl font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                                >
                                    <Printer size={24}/>
                                </button>
                                <button 
                                    onClick={handleFinalizePayment}
                                    className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                                >
                                    {paymentMethod === 'cash' ? 'Confirm Payment' : 'Confirm Transfer'}
                                    <CheckCircle size={24}/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ADD/EDIT ITEM MODAL --- */}
            {showItemModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{itemForm.id ? 'Edit Item' : 'New Item'}</h2>
                        <div className="space-y-3">
                            <input type="text" placeholder="Name (English)" className="w-full border p-2 rounded" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} />
                            <input type="text" placeholder="Name (Thai)" className="w-full border p-2 rounded" value={itemForm.nameTh} onChange={e => setItemForm({...itemForm, nameTh: e.target.value})} />
                            <input type="number" placeholder="Price" className="w-full border p-2 rounded" value={itemForm.basePrice} onChange={e => setItemForm({...itemForm, basePrice: parseFloat(e.target.value)})} />
                            <textarea placeholder="Description" className="w-full border p-2 rounded" value={itemForm.description} onChange={e => setItemForm({...itemForm, description: e.target.value})} />
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                                <select className="w-full border p-2 rounded" value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value as any})}>
                                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            </div>

                            {/* Combo Settings */}
                            {itemForm.category === 'promotion' && (
                                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                    <label className="block text-xs font-bold text-orange-700 uppercase mb-1">Combo Settings</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">Number of pizzas selectable:</span>
                                        <input 
                                            type="number" 
                                            className="w-16 border p-1 rounded text-center font-bold"
                                            value={itemForm.comboCount || 0}
                                            onChange={e => setItemForm({...itemForm, comboCount: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <p className="text-xs text-orange-600 mt-1">Set to 0 if this is just a standard item, not a "Choose X items" combo.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image Source</label>
                                <div className="flex gap-2">
                                    <input type="text" placeholder="Image URL" className="flex-1 border p-2 rounded" value={itemForm.image} onChange={e => setItemForm({...itemForm, image: e.target.value})} />
                                    <label className="bg-gray-200 px-3 py-2 rounded cursor-pointer hover:bg-gray-300 flex items-center gap-2">
                                        <Upload size={16}/> <span className="text-xs font-bold">Upload</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
                                    </label>
                                </div>
                            </div>
                            
                            {itemForm.image && <img src={itemForm.image} className="w-full h-32 object-cover rounded-lg" />}

                            {itemForm.id && (
                                <button onClick={() => { if(confirm('Delete this item?')) { deletePizza(itemForm.id!); setShowItemModal(false); } }} className="w-full text-red-500 text-sm font-bold py-2 border border-red-200 rounded hover:bg-red-50">Delete Item</button>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowItemModal(false)} className="flex-1 py-3 bg-gray-200 rounded-lg font-bold text-gray-700">Cancel</button>
                                <button onClick={handleSaveItem} className="flex-1 py-3 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
