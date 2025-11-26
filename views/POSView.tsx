
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Pizza, Topping, CartItem, ProductCategory, OrderSource, ExpenseCategory } from '../types';
import { CATEGORIES, INITIAL_TOPPINGS, GP_RATES, EXPENSE_CATEGORIES } from '../constants';
import { Plus, Minus, Trash2, ShoppingBag, DollarSign, Clock, Settings, User, X, ChevronRight, Edit2, Power, LogOut, Upload, Image as ImageIcon, Bike, Store, PenTool, Menu, Camera, Calculator, PieChart, FileText, Globe, ToggleLeft, ToggleRight, MessageSquare } from 'lucide-react';

export const POSView: React.FC = () => {
    const { 
        menu, addToCart, removeFromCart, cart, cartTotal, clearCart, placeOrder, orders, 
        updatePizzaPrice, togglePizzaAvailability, addPizza, deletePizza, updatePizza,
        toppings, addTopping, deleteTopping, updateCartItemQuantity, updateCartItem,
        adminLogout, shopLogo, updateShopLogo,
        expenses, addExpense, deleteExpense,
        t, toggleLanguage, language, getLocalizedItem,
        isStoreOpen, toggleStoreStatus, closedMessage
    } = useStore();
    
    const [activeTab, setActiveTab] = useState<'order' | 'sales' | 'expenses'>('order');
    const [selectedPizza, setSelectedPizza] = useState<Pizza | null>(null);
    const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
    const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
    const [activeCategory, setActiveCategory] = useState<ProductCategory>('pizza');
    const [showMobileCart, setShowMobileCart] = useState(false);
    
    // Admin / Edit features
    const [isEditMode, setIsEditMode] = useState(false);
    const [priceEditId, setPriceEditId] = useState<string | null>(null);
    const [tempPrice, setTempPrice] = useState<string>('');
    const [tableNumber, setTableNumber] = useState('');
    
    // Store Status Msg
    const [tempClosedMsg, setTempClosedMsg] = useState(closedMessage);
    
    // Add/Edit Item State
    const [showItemModal, setShowItemModal] = useState(false);
    const [itemForm, setItemForm] = useState<Partial<Pizza>>({
        name: '', description: '', basePrice: 0, image: '', available: true, category: 'pizza'
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

    // Cart customization
    const handleCustomize = (pizza: Pizza) => {
        if (isEditMode) return; 
        setSelectedPizza(pizza);
        setSelectedToppings([]);
        setEditingCartItem(null);
    };

    const handleEditCartItem = (item: CartItem) => {
        const pizza = menu.find(p => p.id === item.pizzaId);
        if (pizza) {
            setSelectedPizza(pizza);
            setSelectedToppings(item.selectedToppings);
            setEditingCartItem(item);
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

        if (editingCartItem) {
            // Update existing cart item
            updateCartItem({
                ...editingCartItem,
                selectedToppings: selectedToppings,
                // Price recalculation is handled by StoreContext
            });
        } else {
            // Add new item
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
    };

    const handlePriceUpdate = () => {
        if (priceEditId && tempPrice) {
            updatePizzaPrice(priceEditId, parseFloat(tempPrice));
            setPriceEditId(null);
        }
    };

    const handlePlaceOrder = async (source: OrderSource) => {
        const success = await placeOrder('dine-in', { 
            tableNumber: source === 'store' ? tableNumber : `${source.toUpperCase()} Order`,
            source: source
        });
        if (success) {
            if (source !== 'store') alert(`Recorded ${source} order!`);
            else alert("Order sent to Kitchen!");
            setTableNumber('');
            setShowMobileCart(false);
        }
    };

    const handleOpenAddModal = () => {
        setItemForm({ name: '', description: '', basePrice: 0, image: '', available: true, category: 'pizza' });
        setShowItemModal(true);
    };

    const handleEditMenuItem = (item: Pizza) => {
        setItemForm({ ...item });
        setShowItemModal(true);
    };

    const handleSaveItem = async () => {
        if (itemForm.name && itemForm.basePrice) {
            if (itemForm.id) {
                await updatePizza(itemForm as Pizza);
            } else {
                await addPizza({
                    ...itemForm as Pizza,
                    id: 'p' + Date.now(),
                    image: itemForm.image || 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?auto=format&fit=crop&w=800&q=80'
                });
            }
            setShowItemModal(false);
            setItemForm({ name: '', description: '', basePrice: 0, image: '', available: true, category: 'pizza' });
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

    const handleDeletePizza = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this item?")) {
            deletePizza(id);
        }
    };

    const handleAddTopping = () => {
        if (newToppingName && newToppingPrice) {
            addTopping({
                id: 't' + Date.now(),
                name: newToppingName,
                nameTh: newToppingName, // Simple duplication if manually added
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

    // Filter Menu
    const filteredMenu = menu.filter(item => {
        const cat = item.category || 'pizza';
        return cat === activeCategory;
    });

    // Sales Calculation (For Accountant)
    const today = new Date().toDateString();
    const todaysOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today && o.status !== 'cancelled');
    
    // All Time Stats for Report
    const totalGrossSales = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0);
    const totalNetRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.netAmount || o.totalAmount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalNetRevenue - totalExpenses;

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden flex-col md:flex-row">
            
            {/* Mobile Top Bar */}
            <div className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center z-30 shadow-md">
                <div className="flex items-center gap-2">
                    {shopLogo ? (
                        <img src={shopLogo} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <div className="bg-brand-600 p-1 rounded-lg"><DollarSign size={16} /></div>
                    )}
                    <span className="font-bold text-lg">POS</span>
                </div>
                 <div className="flex items-center gap-3">
                    <button onClick={toggleLanguage} className="bg-gray-800 text-white p-2 rounded-full flex items-center gap-1 text-xs">
                        <Globe size={14} /> {language.toUpperCase()}
                    </button>
                    <button onClick={adminLogout} className="text-gray-400 hover:text-white"><LogOut size={20}/></button>
                 </div>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-20 bg-gray-900 flex-col items-center py-6 text-gray-400 z-10 shadow-xl justify-between">
                <div className="flex flex-col items-center gap-6 w-full">
                    {/* Logo / Branding Area */}
                    <div className="mb-2 relative group cursor-pointer">
                        {shopLogo ? (
                            <img src={shopLogo} alt="Logo" className="w-12 h-12 rounded-xl object-cover border-2 border-brand-500" />
                        ) : (
                            <div className="p-3 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-900/50">
                                <DollarSign size={24} strokeWidth={3} />
                            </div>
                        )}
                        {/* Hidden Upload on Hover */}
                        {isEditMode && (
                            <label className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white cursor-pointer">
                                <Camera size={16} />
                                <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                            </label>
                        )}
                    </div>
                    
                    <nav className="flex flex-col gap-4 w-full px-2">
                        <button 
                            onClick={() => setActiveTab('order')}
                            className={`group p-3 w-full flex justify-center rounded-xl transition-all duration-200 relative ${
                                activeTab === 'order' 
                                ? 'bg-gray-800 text-brand-500 shadow-inner' 
                                : 'hover:bg-gray-800 hover:text-gray-100'
                            }`}
                            title="Order Taking"
                        >
                            {activeTab === 'order' && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-500 rounded-r-full" />
                            )}
                            <ShoppingBag size={24} className={activeTab === 'order' ? 'drop-shadow-md' : ''} />
                        </button>

                        <button 
                             onClick={() => setActiveTab('sales')}
                             className={`group p-3 w-full flex justify-center rounded-xl transition-all duration-200 relative ${
                                activeTab === 'sales' 
                                ? 'bg-gray-800 text-blue-500 shadow-inner' 
                                : 'hover:bg-gray-800 hover:text-gray-100'
                            }`}
                             title="Accountant Report"
                        >
                            {activeTab === 'sales' && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
                            )}
                            <PieChart size={24} className={activeTab === 'sales' ? 'drop-shadow-md' : ''} />
                        </button>

                        <button 
                             onClick={() => setActiveTab('expenses')}
                             className={`group p-3 w-full flex justify-center rounded-xl transition-all duration-200 relative ${
                                activeTab === 'expenses' 
                                ? 'bg-gray-800 text-yellow-500 shadow-inner' 
                                : 'hover:bg-gray-800 hover:text-gray-100'
                            }`}
                             title="Expenses"
                        >
                            {activeTab === 'expenses' && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-yellow-500 rounded-r-full" />
                            )}
                            <Calculator size={24} className={activeTab === 'expenses' ? 'drop-shadow-md' : ''} />
                        </button>
                        
                        <div className="h-px bg-gray-800 w-full my-2"></div>

                        <button 
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`p-3 w-full flex justify-center rounded-xl transition-all duration-300 ${
                                isEditMode 
                                ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] scale-105' 
                                : 'hover:bg-gray-800 hover:text-white'
                            }`}
                            title={isEditMode ? "Exit Manager Mode" : "Enter Manager Mode"}
                        >
                            <Settings size={24} className={isEditMode ? 'animate-spin-slow' : ''} />
                        </button>
                    </nav>
                </div>
                
                <div className="flex flex-col gap-3 w-full items-center">
                    <button onClick={toggleLanguage} className="bg-gray-800 text-white p-2 rounded-full flex items-center justify-center gap-1 text-xs font-bold w-10 h-10">
                        {language.toUpperCase()}
                    </button>
                    <button 
                        onClick={adminLogout}
                        className="p-3 w-full flex justify-center hover:text-white hover:bg-gray-800 rounded-xl transition group"
                        title="Logout"
                    >
                        <LogOut size={24} className="group-hover:text-red-400" />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden relative flex-col md:flex-row">
                {activeTab === 'order' ? (
                    <>
                        {/* Menu Area */}
                        <div className="flex-1 flex flex-col overflow-hidden relative">
                            <div className="p-4 md:p-6 pb-2">
                                <div className="flex justify-between items-center mb-4 md:mb-6">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                                            {isEditMode ? (
                                                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                                                    <span className="flex items-center gap-2 text-red-600 text-sm md:text-base">
                                                        <Settings className="animate-spin-slow" size={20} /> {t('managerMode')}
                                                    </span>
                                                    <button onClick={handleOpenAddModal} className="bg-brand-600 text-white px-2 py-1.5 rounded text-xs md:text-sm font-bold flex items-center gap-1 hover:bg-brand-700 shadow-sm">
                                                        <Plus size={14} /> {t('addItem')}
                                                    </button>
                                                    <button onClick={() => setShowToppingsModal(true)} className="bg-blue-600 text-white px-2 py-1.5 rounded text-xs md:text-sm font-bold flex items-center gap-1 hover:bg-blue-700 shadow-sm">
                                                        <Edit2 size={14} /> {t('manageToppings')}
                                                    </button>
                                                    <label className="bg-gray-700 text-white px-2 py-1.5 rounded text-xs md:text-sm font-bold flex items-center gap-1 hover:bg-gray-800 shadow-sm cursor-pointer">
                                                        <Upload size={14} /> {t('uploadLogo')}
                                                        <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                                                    </label>
                                                </div>
                                            ) : (
                                                t('tableService')
                                            )}
                                        </h2>
                                        
                                        {/* Store Toggle */}
                                        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                                            <button 
                                                onClick={() => toggleStoreStatus(!isStoreOpen)} 
                                                className={`flex items-center gap-2 text-sm font-bold px-2 py-1 rounded transition ${isStoreOpen ? 'text-green-600' : 'text-red-500'}`}
                                            >
                                                {isStoreOpen ? <ToggleRight size={24} className="fill-current"/> : <ToggleLeft size={24} className="fill-current"/>}
                                                {isStoreOpen ? 'Store OPEN' : 'Store CLOSED'}
                                            </button>
                                            {!isStoreOpen && (
                                                <div className="flex items-center gap-1 border-l pl-2">
                                                    <MessageSquare size={14} className="text-gray-400"/>
                                                    <input 
                                                        className="text-xs border-none outline-none w-32 bg-transparent text-gray-600"
                                                        placeholder={t('holidayMsg')}
                                                        value={tempClosedMsg}
                                                        onChange={(e) => setTempClosedMsg(e.target.value)}
                                                        onBlur={() => toggleStoreStatus(false, tempClosedMsg)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <span className="text-gray-500 text-xs md:text-sm font-mono hidden md:inline">{new Date().toLocaleString()}</span>
                                </div>
                                
                                {/* Category Tabs */}
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                                                activeCategory === cat.id 
                                                ? 'bg-gray-900 text-white shadow' 
                                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            {language === 'th' ? cat.labelTh : cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-2 pb-24 md:pb-20">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                                    {filteredMenu.map(item => {
                                        const localized = getLocalizedItem(item);
                                        return (
                                        <div 
                                            key={item.id} 
                                            className={`relative bg-white p-3 md:p-4 rounded-xl shadow-sm border transition flex flex-col h-36 md:h-44 justify-between ${isEditMode ? 'border-2 border-dashed border-red-300 bg-red-50/30' : 'border-gray-200 hover:shadow-md cursor-pointer'} ${!item.available ? 'opacity-75 bg-gray-50' : ''}`}
                                            onClick={() => !isEditMode && item.available && handleCustomize(item)}
                                        >
                                            {isEditMode && (
                                                <div className="absolute -top-2 -right-2 flex gap-1 z-20">
                                                     <button 
                                                        onClick={(e) => { e.stopPropagation(); handleEditMenuItem(item); }}
                                                        className="bg-blue-500 text-white p-1 rounded-full shadow-md hover:bg-blue-600"
                                                        title="Edit Details"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDeletePizza(item.id, e)}
                                                        className="bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"
                                                        title="Delete Item"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )}
                                            {!item.available && !isEditMode && (
                                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                                                    <span className="font-bold text-red-600 border-2 border-red-600 px-2 py-1 transform -rotate-12 rounded text-xs md:text-base">OUT OF STOCK</span>
                                                </div>
                                            )}
                                            
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="font-bold text-base md:text-lg text-gray-800 leading-tight line-clamp-2">{localized.name}</div>
                                                <img src={item.image} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                                            </div>

                                            {isEditMode && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); togglePizzaAvailability(item.id); }}
                                                    className={`p-1.5 rounded-full shadow-sm transition-colors absolute top-4 right-16 ${item.available ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                                                    title={item.available ? "Mark Out of Stock" : "Mark In Stock"}
                                                >
                                                    <Power size={18} strokeWidth={3} />
                                                </button>
                                            )}

                                            <div className="flex justify-between items-end mt-2">
                                                {isEditMode && priceEditId === item.id ? (
                                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                        <input 
                                                            type="number" 
                                                            value={tempPrice} 
                                                            onChange={e => setTempPrice(e.target.value)}
                                                            className="w-16 border-2 border-blue-400 rounded p-1 text-xs focus:outline-none"
                                                            autoFocus
                                                        />
                                                        <button onClick={handlePriceUpdate} className="bg-green-500 text-white p-1 rounded hover:bg-green-600"><ChevronRight size={14} /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 w-full justify-between">
                                                        <span className={`font-bold text-lg md:text-xl ${isEditMode ? 'text-gray-600' : 'text-brand-600'}`}>฿{item.basePrice}</span>
                                                        {isEditMode && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setPriceEditId(item.id); setTempPrice(item.basePrice.toString()); }}
                                                                className="bg-gray-100 text-gray-500 p-1.5 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                                title="Quick Edit Price"
                                                            >
                                                                <DollarSign size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            </div>
                            
                            {/* Mobile Cart Floating Bar */}
                            {cart.length > 0 && (
                                <div className="md:hidden absolute bottom-4 left-4 right-4 z-20">
                                    <button 
                                        onClick={() => setShowMobileCart(true)}
                                        className="w-full bg-brand-600 text-white p-3 rounded-xl shadow-lg flex justify-between items-center font-bold animate-slide-up"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="bg-white text-brand-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                                {cart.reduce((a,c) => a+c.quantity, 0)}
                                            </span>
                                            <span>{t('yourOrder')}</span>
                                        </div>
                                        <span>฿{cartTotal}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Order Summary / Cart - Responsive Layout */}
                        <div className={`
                            bg-white border-l shadow-xl flex flex-col z-40 transition-transform duration-300
                            md:w-96 md:static md:translate-y-0
                            ${showMobileCart ? 'fixed inset-0 w-full translate-y-0' : 'fixed inset-0 w-full translate-y-full md:hidden'}
                        `}>
                             {/* Mobile Header for Cart */}
                             <div className="md:hidden p-4 border-b flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-lg">{t('yourOrder')}</h3>
                                <button onClick={() => setShowMobileCart(false)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"><X size={20}/></button>
                             </div>

                             {/* Desktop Header for Cart */}
                             <div className="hidden md:block p-6 border-b bg-gray-50">
                                 <h3 className="font-bold text-xl text-gray-800 mb-2">{t('placeOrder')}</h3>
                                 <div className="flex items-center gap-2">
                                     <User size={18} className="text-gray-500"/>
                                     <input 
                                        type="text" 
                                        placeholder="Table Number (e.g. T4)"
                                        className="bg-white border border-gray-300 rounded px-2 py-1 text-sm w-full font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                                        value={tableNumber}
                                        onChange={e => setTableNumber(e.target.value)}
                                     />
                                 </div>
                             </div>
                             
                             {/* Mobile Input for Table (Only shown when cart open) */}
                             <div className="md:hidden p-4 bg-gray-50 border-b">
                                 <div className="flex items-center gap-2">
                                     <User size={18} className="text-gray-500"/>
                                     <input 
                                        type="text" 
                                        placeholder="Table Number (e.g. T4)"
                                        className="bg-white border border-gray-300 rounded px-2 py-1 text-sm w-full font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                                        value={tableNumber}
                                        onChange={e => setTableNumber(e.target.value)}
                                     />
                                 </div>
                             </div>

                             <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                                {cart.length === 0 ? (
                                    <div className="text-center text-gray-400 mt-20 flex flex-col items-center">
                                        <ShoppingBag size={48} className="mb-4 opacity-20" />
                                        <p>{t('cartEmpty')}</p>
                                    </div>
                                ) : (
                                    cart.map(item => {
                                        const name = language === 'th' && item.nameTh ? item.nameTh : item.name;
                                        return (
                                        <div key={item.id} className="flex flex-col border-b border-dashed border-gray-200 pb-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1 cursor-pointer hover:text-brand-600 transition-colors" onClick={() => handleEditCartItem(item)} title="Edit Item">
                                                    <div className="font-bold text-gray-800 flex items-center gap-1">
                                                        {name}
                                                        <Edit2 size={12} className="opacity-40" />
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {item.selectedToppings.length > 0 && `+ ${item.selectedToppings.map(t => language === 'th' && t.nameTh ? t.nameTh : t.name).join(', ')}`}
                                                    </div>
                                                </div>
                                                <div className="font-bold">฿{item.totalPrice}</div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                                    <button 
                                                        onClick={() => updateCartItemQuantity(item.id, -1)} 
                                                        className="p-1 hover:bg-white rounded shadow-sm text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus size={14}/>
                                                    </button>
                                                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                                                    <button 
                                                        onClick={() => updateCartItemQuantity(item.id, 1)} 
                                                        className="p-1 hover:bg-white rounded shadow-sm text-gray-600"
                                                    >
                                                        <Plus size={14}/>
                                                    </button>
                                                </div>
                                                <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1 bg-red-50 hover:bg-red-100 rounded">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )})
                                )}
                             </div>

                             <div className="p-4 md:p-6 bg-gray-50 border-t">
                                 <div className="flex justify-between items-center mb-2 text-gray-600">
                                     <span>{t('subtotal')}</span>
                                     <span>฿{cartTotal}</span>
                                 </div>
                                 <div className="flex justify-between items-center mb-6 text-2xl font-bold text-gray-900">
                                     <span>{t('total')}</span>
                                     <span>฿{cartTotal}</span>
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-3 mb-4">
                                     <button onClick={clearCart} className="px-4 py-3 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-gray-100 transition">
                                         Clear
                                     </button>
                                     <button 
                                        onClick={() => handlePlaceOrder('store')}
                                        disabled={cart.length === 0}
                                        className={`px-4 py-3 rounded-lg font-bold text-white shadow-lg transition flex items-center justify-center gap-2 ${cart.length === 0 ? 'bg-gray-400' : 'bg-brand-600 hover:bg-brand-700'}`}
                                     >
                                         <Store size={18} /> {t('placeOrder')}
                                     </button>
                                 </div>
                                 
                                 {/* 3rd Party Apps */}
                                 <div className="pt-4 border-t border-gray-200">
                                     <p className="text-xs font-bold text-gray-400 uppercase mb-2">3rd Party App (Auto Deduct GP)</p>
                                     <div className="grid grid-cols-2 gap-2">
                                         <button onClick={() => handlePlaceOrder('grab')} disabled={cart.length === 0} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded flex flex-col items-center disabled:opacity-50">
                                             <Bike size={14} className="mb-1" /> Grab
                                         </button>
                                         <button onClick={() => handlePlaceOrder('lineman')} disabled={cart.length === 0} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 rounded flex flex-col items-center disabled:opacity-50">
                                             <Bike size={14} className="mb-1" /> Lineman
                                         </button>
                                          <button onClick={() => handlePlaceOrder('robinhood')} disabled={cart.length === 0} className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 rounded flex flex-col items-center disabled:opacity-50">
                                             <Bike size={14} className="mb-1" /> Robin
                                         </button>
                                         <button onClick={() => handlePlaceOrder('foodpanda')} disabled={cart.length === 0} className="bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold py-2 rounded flex flex-col items-center disabled:opacity-50">
                                             <Bike size={14} className="mb-1" /> Panda
                                         </button>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </>
                ) : activeTab === 'sales' ? (
                    /* Accountant Report Tab */
                    <div className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
                        <div className="flex justify-between items-center mb-6">
                             <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{t('accountantReport')}</h2>
                             <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded text-sm font-bold print:hidden">
                                 <FileText size={16}/> Print Report
                             </button>
                        </div>
                        
                        {/* P&L Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-gray-500 mb-2 text-sm uppercase font-bold">{t('grossSales')}</p>
                                <p className="text-2xl font-bold text-gray-800">฿{totalGrossSales.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-gray-500 mb-2 text-sm uppercase font-bold">{t('netRevenue')}</p>
                                <p className="text-2xl font-bold text-blue-600">฿{totalNetRevenue.toLocaleString()}</p>
                                <p className="text-xs text-gray-400 mt-1">After GP Deductions</p>
                            </div>
                            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-gray-500 mb-2 text-sm uppercase font-bold">{t('expenses')}</p>
                                <p className="text-2xl font-bold text-red-500">-฿{totalExpenses.toLocaleString()}</p>
                            </div>
                            <div className={`bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden`}>
                                <p className="text-gray-500 mb-2 text-sm uppercase font-bold">{t('netProfit')}</p>
                                <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ฿{netProfit.toLocaleString()}
                                </p>
                                <div className={`absolute right-0 top-0 bottom-0 w-2 ${netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            </div>
                        </div>

                        {/* Detailed Transaction Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                            <div className="p-4 border-b bg-gray-50">
                                <h3 className="font-bold text-gray-700">{t('transactionHistory')}</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[600px]">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="p-4 font-semibold text-gray-600">{t('date')}</th>
                                            <th className="p-4 font-semibold text-gray-600">{t('type')}</th>
                                            <th className="p-4 font-semibold text-gray-600">{t('description')}</th>
                                            <th className="p-4 font-semibold text-gray-600 text-right">{t('amount')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Combine orders and expenses for a timeline view */}
                                        {[
                                            ...orders.filter(o => o.status !== 'cancelled').map(o => ({
                                                id: o.id,
                                                date: o.createdAt,
                                                type: 'Income',
                                                description: `Order #${o.id.slice(-4)} (${o.source})`,
                                                amount: o.netAmount || o.totalAmount,
                                                isExpense: false
                                            })),
                                            ...expenses.map(e => ({
                                                id: e.id,
                                                date: e.date,
                                                type: 'Expense',
                                                description: `${e.category}: ${e.description}`,
                                                amount: e.amount,
                                                isExpense: true
                                            }))
                                        ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map((item) => (
                                            <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="p-4 text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.isExpense ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-800 font-medium">{item.description}</td>
                                                <td className={`p-4 text-right font-bold ${item.isExpense ? 'text-red-600' : 'text-green-600'}`}>
                                                    {item.isExpense ? '-' : '+'}฿{item.amount.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Expenses Tab */
                    <div className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">{t('expenses')}</h2>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Expense Form */}
                            <div className="lg:col-span-1">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <h3 className="font-bold text-lg mb-4 text-gray-800">{t('recordExpense')}</h3>
                                    <form onSubmit={handleAddExpense} className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">{t('category')}</label>
                                            <select 
                                                className="w-full border rounded p-2 mt-1 bg-white"
                                                value={expenseForm.category}
                                                onChange={e => setExpenseForm({...expenseForm, category: e.target.value as ExpenseCategory})}
                                            >
                                                {EXPENSE_CATEGORIES.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">{t('description')}</label>
                                            <input 
                                                type="text"
                                                required
                                                className="w-full border rounded p-2 mt-1"
                                                placeholder="e.g. Tomatoes, Staff Salary, Electricity"
                                                value={expenseForm.description}
                                                onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">{t('amount')} (THB)</label>
                                            <input 
                                                type="number"
                                                required
                                                className="w-full border rounded p-2 mt-1"
                                                placeholder="0.00"
                                                value={expenseForm.amount}
                                                onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">{t('note')} (Optional)</label>
                                            <textarea 
                                                className="w-full border rounded p-2 mt-1"
                                                rows={2}
                                                value={expenseForm.note}
                                                onChange={e => setExpenseForm({...expenseForm, note: e.target.value})}
                                            />
                                        </div>
                                        <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition">
                                            {t('addExpense')}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Expense List */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                     <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-700">{t('recentOrders')}</h3>
                                        <div className="text-sm text-gray-500">Total: <span className="font-bold text-red-600">฿{expenses.reduce((s,e) => s + e.amount, 0).toLocaleString()}</span></div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="p-3 text-sm font-semibold text-gray-600">{t('date')}</th>
                                                    <th className="p-3 text-sm font-semibold text-gray-600">{t('category')}</th>
                                                    <th className="p-3 text-sm font-semibold text-gray-600">{t('description')}</th>
                                                    <th className="p-3 text-sm font-semibold text-gray-600 text-right">{t('amount')}</th>
                                                    <th className="p-3 text-sm font-semibold text-gray-600 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {expenses.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="p-8 text-center text-gray-400">No expenses recorded yet.</td>
                                                    </tr>
                                                ) : (
                                                    expenses.map(expense => (
                                                        <tr key={expense.id} className="border-b last:border-0 hover:bg-gray-50">
                                                            <td className="p-3 text-sm text-gray-500">{new Date(expense.date).toLocaleDateString()}</td>
                                                            <td className="p-3">
                                                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold uppercase">{expense.category}</span>
                                                            </td>
                                                            <td className="p-3 text-gray-800">{expense.description}</td>
                                                            <td className="p-3 text-right font-bold text-red-600">฿{expense.amount.toLocaleString()}</td>
                                                            <td className="p-3 text-right">
                                                                <button onClick={() => deleteExpense(expense.id)} className="text-gray-400 hover:text-red-500">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden bg-white border-t border-gray-200 p-2 flex justify-around items-center z-50 pb-safe">
                <button onClick={() => { setActiveTab('order'); setShowMobileCart(false); }} className={`p-2 flex flex-col items-center ${activeTab === 'order' ? 'text-brand-600' : 'text-gray-400'}`}>
                    <ShoppingBag size={24} />
                    <span className="text-[10px] font-bold">Order</span>
                </button>
                <button onClick={() => { setActiveTab('sales'); setShowMobileCart(false); }} className={`p-2 flex flex-col items-center ${activeTab === 'sales' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <PieChart size={24} />
                    <span className="text-[10px] font-bold">Report</span>
                </button>
                <button onClick={() => { setActiveTab('expenses'); setShowMobileCart(false); }} className={`p-2 flex flex-col items-center ${activeTab === 'expenses' ? 'text-yellow-500' : 'text-gray-400'}`}>
                    <Calculator size={24} />
                    <span className="text-[10px] font-bold">Expense</span>
                </button>
                <button onClick={() => { setIsEditMode(!isEditMode); setActiveTab('order'); }} className={`p-2 flex flex-col items-center ${isEditMode ? 'text-red-600' : 'text-gray-400'}`}>
                    <Settings size={24} className={isEditMode ? 'animate-spin-slow' : ''} />
                    <span className="text-[10px] font-bold">Manage</span>
                </button>
            </div>

            {/* Add/Edit Item Modal */}
            {showItemModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-bold">{itemForm.id ? t('updateItem') : t('addItem')}</h3>
                            <button onClick={() => setShowItemModal(false)}><X size={20}/></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('category')}</label>
                                <select 
                                    className="w-full border rounded p-2 mt-1 capitalize bg-white"
                                    value={itemForm.category}
                                    onChange={e => setItemForm({...itemForm, category: e.target.value as ProductCategory})}
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.id}>{language === 'th' ? cat.labelTh : cat.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('name')}</label>
                                <input 
                                    className="w-full border rounded p-2 mt-1" 
                                    value={itemForm.name} 
                                    onChange={e => setItemForm({...itemForm, name: e.target.value})}
                                    placeholder="e.g. Carbonara, Cola, Fries"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('name')} (TH)</label>
                                <input 
                                    className="w-full border rounded p-2 mt-1" 
                                    value={itemForm.nameTh || ''} 
                                    onChange={e => setItemForm({...itemForm, nameTh: e.target.value})}
                                    placeholder="e.g. คาโบนาร่า"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('price')} (THB)</label>
                                <input 
                                    type="number" 
                                    className="w-full border rounded p-2 mt-1" 
                                    value={itemForm.basePrice || ''} 
                                    onChange={e => setItemForm({...itemForm, basePrice: parseFloat(e.target.value)})}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('description')}</label>
                                <textarea 
                                    className="w-full border rounded p-2 mt-1" 
                                    value={itemForm.description} 
                                    onChange={e => setItemForm({...itemForm, description: e.target.value})}
                                    placeholder="Short delicious description"
                                />
                            </div>
                             <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('description')} (TH)</label>
                                <textarea 
                                    className="w-full border rounded p-2 mt-1" 
                                    value={itemForm.descriptionTh || ''} 
                                    onChange={e => setItemForm({...itemForm, descriptionTh: e.target.value})}
                                    placeholder="รายละเอียดภาษาไทย"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                    <ImageIcon size={14}/> {t('imageSource')}
                                </label>
                                <div className="flex gap-2 mt-1">
                                    <input 
                                        className="flex-1 border rounded p-2 text-sm text-gray-500" 
                                        placeholder="Paste URL here..."
                                        value={itemForm.image} 
                                        onChange={e => setItemForm({...itemForm, image: e.target.value})}
                                    />
                                    <label className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded cursor-pointer flex items-center justify-center transition-colors" title="Upload Image">
                                        <Upload size={20} />
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                    </label>
                                </div>
                                {itemForm.image && (
                                    <div className="mt-2 h-24 w-full rounded bg-gray-100 overflow-hidden relative group">
                                        <img src={itemForm.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    </div>
                                )}
                            </div>
                            <button onClick={handleSaveItem} className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold hover:bg-brand-700">
                                {itemForm.id ? t('updateItem') : t('saveItem')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Toppings Modal */}
            {showToppingsModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-bold">{t('manageToppings')}</h3>
                            <button onClick={() => setShowToppingsModal(false)}><X size={20}/></button>
                        </div>
                        
                        {/* List */}
                        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                            {toppings.map(t => (
                                <div key={t.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
                                    <span className="font-medium text-gray-700">{language === 'th' && t.nameTh ? t.nameTh : t.name}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 text-sm">฿{t.price}</span>
                                        <button onClick={() => deleteTopping(t.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add New Topping Form */}
                        <div className="bg-gray-100 p-4 rounded-lg">
                            <h4 className="font-bold text-sm mb-2 text-gray-600 uppercase">Add New Topping</h4>
                            <div className="flex gap-2 mb-2">
                                <input 
                                    placeholder="Name" 
                                    className="flex-1 p-2 rounded border text-sm"
                                    value={newToppingName}
                                    onChange={e => setNewToppingName(e.target.value)}
                                />
                                <input 
                                    placeholder="Price" 
                                    type="number"
                                    className="w-20 p-2 rounded border text-sm"
                                    value={newToppingPrice}
                                    onChange={e => setNewToppingPrice(e.target.value)}
                                />
                            </div>
                            <button onClick={handleAddTopping} className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm hover:bg-blue-700">
                                Add Topping
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Customization Modal for POS */}
            {selectedPizza && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h3 className="font-bold text-xl">
                                {editingCartItem ? `${t('edit')}: ${getLocalizedItem(selectedPizza).name}` : getLocalizedItem(selectedPizza).name}
                            </h3>
                            <button onClick={() => { setSelectedPizza(null); setEditingCartItem(null); }}><X size={24} className="text-gray-500 hover:text-red-500" /></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Only show toppings for Pizzas */}
                            {selectedPizza.category === 'pizza' ? (
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    {toppings.map(topping => {
                                        const isSelected = !!selectedToppings.find(t => t.id === topping.id);
                                        const toppingName = language === 'th' && topping.nameTh ? topping.nameTh : topping.name;
                                        return (
                                            <button 
                                                key={topping.id}
                                                onClick={() => toggleTopping(topping)}
                                                className={`p-3 rounded-lg border text-left flex justify-between items-center transition ${isSelected ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <span className={`font-medium ${isSelected ? 'text-brand-700' : 'text-gray-700'}`}>{toppingName}</span>
                                                <span className="text-sm text-gray-400">+฿{topping.price}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    No customization available for this item.
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t bg-gray-50 rounded-b-xl flex items-center justify-between gap-4">
                             <div className="text-xl font-bold text-brand-600">
                                ฿{(selectedPizza.basePrice + selectedToppings.reduce((s, t) => s + t.price, 0)) * (editingCartItem ? editingCartItem.quantity : 1)}
                             </div>
                             <button 
                                onClick={confirmAddToCart}
                                className="flex-1 bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black transition"
                             >
                                 {editingCartItem ? t('updateItem') : t('addItem')}
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
