
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Pizza, Topping, CartItem, ProductCategory, OrderSource, ExpenseCategory } from '../types';
import { CATEGORIES, EXPENSE_CATEGORIES } from '../constants';
import { Plus, Minus, Trash2, ShoppingBag, DollarSign, Settings, User, X, Edit2, Power, LogOut, Upload, Image as ImageIcon, Bike, Store, List, PieChart, Calculator, Globe, ToggleLeft, ToggleRight, Camera, ChevronUp, AlertCircle, Calendar, Link, Star } from 'lucide-react';

export const POSView: React.FC = () => {
    const { 
        menu, addToCart, removeFromCart, cart, cartTotal, clearCart, placeOrder, orders, 
        updatePizzaPrice, togglePizzaAvailability, addPizza, deletePizza, updatePizza, toggleBestSeller,
        toppings, addTopping, deleteTopping, updateCartItemQuantity, updateCartItem,
        adminLogout, shopLogo, updateShopLogo,
        expenses, addExpense,
        t, toggleLanguage, language, getLocalizedItem,
        isStoreOpen, toggleStoreStatus, storeSettings, updateStoreSettings
    } = useStore();
    
    // Unified Tab State: 'order' | 'sales' | 'expenses' | 'manage'
    const [activeTab, setActiveTab] = useState<string>('order');
    const [selectedPizza, setSelectedPizza] = useState<Pizza | null>(null);
    const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
    const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
    const [activeCategory, setActiveCategory] = useState<ProductCategory>('pizza');
    const [showMobileCart, setShowMobileCart] = useState(false);
    
    // Admin / Edit features
    const [isEditMode, setIsEditMode] = useState(false);
    const [tableNumber, setTableNumber] = useState('');
    const [tempClosedMsg, setTempClosedMsg] = useState(storeSettings.closedMessage);
    
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
        if (isEditMode && activeTab === 'order') return; 
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

    // Filter Menu
    const filteredMenu = menu.filter(item => {
        const cat = item.category || 'pizza';
        return cat === activeCategory;
    });

    const totalGrossSales = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0);
    const netProfit = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.netAmount || o.totalAmount), 0) - expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden flex-col md:flex-row font-sans">
            
            {/* --- MOBILE LAYOUT HEADER --- */}
            <div className="md:hidden bg-gray-900 text-white p-3 flex justify-between items-center z-30 shadow-md shrink-0 h-14">
                <div className="flex items-center gap-2">
                    {shopLogo ? (
                        <img src={shopLogo} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <div className="bg-brand-600 p-1 rounded-lg"><DollarSign size={16} /></div>
                    )}
                    <span className="font-bold text-lg tracking-tight">POS</span>
                </div>
                 <div className="flex items-center gap-3">
                    <div className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${isStoreOpen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        {isStoreOpen ? 'OPEN' : 'CLOSED'}
                    </div>
                 </div>
            </div>

            {/* --- DESKTOP SIDEBAR --- */}
            <aside className="hidden md:flex w-20 bg-gray-900 flex-col items-center py-6 text-gray-400 z-10 shadow-xl justify-between shrink-0">
                <div className="flex flex-col items-center gap-6 w-full">
                    <div className="mb-2 relative group cursor-pointer">
                        {shopLogo ? (
                            <img src={shopLogo} alt="Logo" className="w-12 h-12 rounded-xl object-cover border-2 border-brand-500" />
                        ) : (
                            <div className="p-3 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-900/50">
                                <DollarSign size={24} strokeWidth={3} />
                            </div>
                        )}
                    </div>
                    
                    <nav className="flex flex-col gap-4 w-full px-2">
                        <button onClick={() => {setActiveTab('order'); setIsEditMode(false)}} className={`group p-3 w-full flex justify-center rounded-xl transition-all ${activeTab === 'order' ? 'bg-gray-800 text-brand-500 shadow-inner' : 'hover:bg-gray-800'}`}>
                            <ShoppingBag size={24} />
                        </button>
                        <button onClick={() => setActiveTab('sales')} className={`group p-3 w-full flex justify-center rounded-xl transition-all ${activeTab === 'sales' ? 'bg-gray-800 text-blue-500 shadow-inner' : 'hover:bg-gray-800'}`}>
                            <PieChart size={24} />
                        </button>
                        <button onClick={() => setActiveTab('expenses')} className={`group p-3 w-full flex justify-center rounded-xl transition-all ${activeTab === 'expenses' ? 'bg-gray-800 text-yellow-500 shadow-inner' : 'hover:bg-gray-800'}`}>
                            <Calculator size={24} />
                        </button>
                         <button onClick={() => setActiveTab('manage')} className={`group p-3 w-full flex justify-center rounded-xl transition-all ${activeTab === 'manage' ? 'bg-gray-800 text-red-500 shadow-inner' : 'hover:bg-gray-800'}`}>
                            <Settings size={24} />
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
            <main className="flex-1 flex overflow-hidden relative flex-col md:flex-row pb-0 md:pb-0 h-full">
                
                {/* VIEW: ORDER */}
                {activeTab === 'order' && (
                    <>
                        <div className="flex-1 flex flex-col overflow-hidden relative h-full pb-16 md:pb-0">
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
                                </div>
                            </div>

                            {/* Menu Grid */}
                            <div className="flex-1 overflow-y-auto p-2 md:p-6 pt-0 pb-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {filteredMenu.map(item => {
                                        const localized = getLocalizedItem(item);
                                        return (
                                        <div 
                                            key={item.id} 
                                            className={`relative bg-white p-3 rounded-xl shadow-sm border transition flex flex-row md:flex-col h-28 md:h-64 ${isEditMode ? 'border-dashed border-red-300 bg-red-50/20' : 'hover:shadow-md cursor-pointer'} ${!item.available ? 'opacity-75 bg-gray-50' : ''}`}
                                            onClick={() => !isEditMode && item.available && handleCustomize(item)}
                                        >
                                            {/* Image */}
                                            <div className="w-24 md:w-full h-full md:h-32 rounded-lg overflow-hidden flex-shrink-0 relative">
                                                <img src={item.image} className="w-full h-full object-cover" />
                                                {!item.available && (
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                        <span className="text-white text-[10px] md:text-xs font-bold bg-red-600 px-2 py-1 rounded">SOLD OUT</span>
                                                    </div>
                                                )}
                                                {item.isBestSeller && (
                                                    <div className="absolute top-1 right-1 bg-yellow-400 text-white p-1 rounded-full shadow-md">
                                                        <Star size={12} fill="white" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 ml-3 md:ml-0 md:mt-3 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-gray-800 leading-tight text-sm md:text-lg line-clamp-2">{localized.name}</h3>
                                                        {isEditMode && (
                                                            <div className="flex gap-1">
                                                                <button onClick={(e)=>{e.stopPropagation(); handleEditMenuItem(item)}} className="bg-blue-100 text-blue-600 p-1.5 rounded"><Edit2 size={12}/></button>
                                                                <button onClick={(e)=>{e.stopPropagation(); togglePizzaAvailability(item.id)}} className={`p-1.5 rounded ${item.available ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}><Power size={12}/></button>
                                                                <button onClick={(e)=>{e.stopPropagation(); toggleBestSeller(item.id)}} className={`p-1.5 rounded ${item.isBestSeller ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}><Star size={12} fill={item.isBestSeller ? "currentColor" : "none"}/></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 hidden md:block">{localized.description}</p>
                                                </div>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="font-bold text-brand-600 text-base md:text-xl">฿{item.basePrice}</span>
                                                    {!isEditMode && item.available && <div className="bg-brand-50 text-brand-600 p-1.5 rounded-full"><Plus size={16}/></div>}
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

                             <div className="p-4 bg-gray-50 border-b shrink-0">
                                 <div className="flex items-center gap-2">
                                     <User size={18} className="text-gray-500"/>
                                     <input type="text" placeholder="Table Number" className="bg-white border border-gray-300 rounded px-2 py-2 text-base w-full outline-none" value={tableNumber} onChange={e => setTableNumber(e.target.value)}/>
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
                                     <button onClick={clearCart} className="px-4 py-3 rounded-xl border border-gray-300 text-gray-600 font-bold">Clear</button>
                                     <button onClick={() => handlePlaceOrder('store')} disabled={cart.length === 0} className="px-4 py-3 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                         <Store size={18} /> Order
                                     </button>
                                 </div>
                             </div>
                        </div>
                    </>
                )}

                {/* VIEW: MANAGE (Unified Dashboard) */}
                {activeTab === 'manage' && (
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-100">
                         <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2"><Settings className="text-red-600"/> Manager Dashboard</h2>
                         
                         {/* 1. Store Status & Holiday */}
                         <div className="bg-white rounded-xl p-5 shadow-sm mb-6 border border-gray-200">
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

                         {/* 2. Marketing & Branding */}
                         <div className="bg-white rounded-xl p-5 shadow-sm mb-6 border border-gray-200">
                             <h3 className="font-bold text-gray-500 text-xs uppercase mb-3 flex items-center gap-2"><Globe size={14}/> Marketing</h3>
                             
                             {/* Promo Banner */}
                             <div className="mb-4">
                                 <label className="text-xs font-bold text-gray-500 mb-1 block">Promotional Banner (Image or Video URL)</label>
                                 <div className="flex gap-2">
                                     <div className="relative flex-1">
                                        <Link size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                        <input 
                                            className="w-full bg-gray-50 border rounded p-2 pl-9 text-sm" 
                                            placeholder="https://... (Image or MP4 link)" 
                                            value={storeSettings.promoBannerUrl || ''} 
                                            onChange={e => updateStoreSettings({ promoBannerUrl: e.target.value })}
                                        />
                                     </div>
                                     <select 
                                        className="bg-gray-50 border rounded text-sm p-2"
                                        value={storeSettings.promoContentType || 'image'}
                                        onChange={e => updateStoreSettings({ promoContentType: e.target.value as 'image'|'video' })}
                                     >
                                         <option value="image">Image</option>
                                         <option value="video">Video</option>
                                     </select>
                                 </div>
                                 <p className="text-[10px] text-gray-400 mt-1">Paste a link to a YouTube video or Image to show at the top of the Customer App.</p>
                             </div>

                             {/* Logo */}
                             <div className="flex items-center gap-4 border-t pt-4">
                                 {shopLogo ? <img src={shopLogo} className="w-12 h-12 rounded-lg object-cover border"/> : <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>}
                                 <label className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-bold text-sm text-center cursor-pointer hover:bg-gray-200">
                                     Upload Shop Logo
                                     <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                                 </label>
                             </div>
                         </div>

                         {/* 3. Quick Actions */}
                         <div className="grid grid-cols-2 gap-4">
                             <button onClick={() => { setShowItemModal(true); setItemForm({category: 'pizza', available: true})}} className="bg-white p-5 rounded-xl shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition hover:shadow-md">
                                 <div className="bg-brand-100 text-brand-600 p-3 rounded-full"><Plus size={24}/></div>
                                 <span className="font-bold text-gray-700 text-sm">{t('addItem')}</span>
                             </button>
                             <button onClick={() => setShowToppingsModal(true)} className="bg-white p-5 rounded-xl shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition hover:shadow-md">
                                 <div className="bg-blue-100 text-blue-600 p-3 rounded-full"><List size={24}/></div>
                                 <span className="font-bold text-gray-700 text-sm">Toppings</span>
                             </button>
                         </div>
                         
                         <button onClick={adminLogout} className="w-full bg-red-50 text-red-600 py-4 rounded-xl font-bold mt-8 flex items-center justify-center gap-2 hover:bg-red-100">
                             <LogOut size={20}/> Logout
                         </button>
                    </div>
                )}
                
                {/* VIEW: SALES REPORT */}
                {activeTab === 'sales' && (
                    <div className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
                         <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('accountantReport')}</h2>
                         
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-gray-400 text-xs uppercase font-bold mb-1">{t('grossSales')}</p>
                                <p className="text-2xl font-bold text-gray-900">฿{totalGrossSales.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-gray-400 text-xs uppercase font-bold mb-1">{t('netProfit')}</p>
                                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>฿{netProfit.toLocaleString()}</p>
                            </div>
                         </div>
                         
                         <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                                    <tr>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Desc</th>
                                        <th className="p-3 text-right">Amt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...orders.filter(o => o.status!=='cancelled').map(o=>({id:o.id, date:o.createdAt, desc:`Order #${o.id.slice(-4)}`, amt:o.netAmount, type:'in'})), ...expenses.map(e=>({id:e.id, date:e.date, desc:e.description, amt:e.amount, type:'out'}))]
                                      .sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime())
                                      .map(i => (
                                          <tr key={i.id} className="border-b last:border-0">
                                              <td className="p-3 text-gray-500">{new Date(i.date).toLocaleDateString()}</td>
                                              <td className="p-3 font-medium">{i.desc}</td>
                                              <td className={`p-3 text-right font-bold ${i.type==='out'?'text-red-500':'text-green-600'}`}>{i.type==='out'?'-':'+'}฿{i.amt.toLocaleString()}</td>
                                          </tr>
                                      ))
                                    }
                                </tbody>
                            </table>
                         </div>
                    </div>
                )}
                
                {/* VIEW: EXPENSES */}
                {activeTab === 'expenses' && (
                    <div className="flex-1 p-4 overflow-y-auto pb-24">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('expenses')}</h2>
                        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
                            <form onSubmit={handleAddExpense} className="space-y-3">
                                <select className="w-full p-3 bg-gray-50 rounded-lg text-sm border-none" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value as ExpenseCategory})}>
                                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <input className="w-full p-3 bg-gray-50 rounded-lg text-sm" placeholder="Description" value={expenseForm.description} onChange={e=>setExpenseForm({...expenseForm, description:e.target.value})}/>
                                <input className="w-full p-3 bg-gray-50 rounded-lg text-sm" type="number" placeholder="Amount" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm, amount:e.target.value})}/>
                                <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-200">Record Expense</button>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden bg-white border-t border-gray-200 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0 h-16">
                <button onClick={() => { setActiveTab('order'); setShowMobileCart(false); setIsEditMode(false) }} className={`flex-1 py-1 flex flex-col items-center ${activeTab === 'order' ? 'text-brand-600' : 'text-gray-400'}`}>
                    <ShoppingBag size={22} className={activeTab === 'order' ? 'fill-current' : ''} />
                    <span className="text-[10px] font-bold mt-1">Order</span>
                </button>
                <button onClick={() => { setActiveTab('sales'); setShowMobileCart(false); }} className={`flex-1 py-1 flex flex-col items-center ${activeTab === 'sales' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <PieChart size={22} className={activeTab === 'sales' ? 'fill-current' : ''} />
                    <span className="text-[10px] font-bold mt-1">Report</span>
                </button>
                <button onClick={() => { setActiveTab('expenses'); setShowMobileCart(false); }} className={`flex-1 py-1 flex flex-col items-center ${activeTab === 'expenses' ? 'text-yellow-500' : 'text-gray-400'}`}>
                    <Calculator size={22} className={activeTab === 'expenses' ? 'fill-current' : ''} />
                    <span className="text-[10px] font-bold mt-1">Exp</span>
                </button>
                <button onClick={() => { setActiveTab('manage'); setShowMobileCart(false); }} className={`flex-1 py-1 flex flex-col items-center ${activeTab === 'manage' ? 'text-red-600' : 'text-gray-400'}`}>
                    <Settings size={22} className={activeTab === 'manage' ? 'fill-current' : ''} />
                    <span className="text-[10px] font-bold mt-1">Manage</span>
                </button>
            </div>

            {/* Add/Edit Item Modal */}
            {showItemModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                        {/* ... Modal Content Same as Before ... */}
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
                                    placeholder="e.g. Carbonara"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('name')} (TH)</label>
                                <input 
                                    className="w-full border rounded p-2 mt-1" 
                                    value={itemForm.nameTh || ''} 
                                    onChange={e => setItemForm({...itemForm, nameTh: e.target.value})}
                                    placeholder="ชื่อไทย"
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
                                    placeholder="Short description"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                    <ImageIcon size={14}/> {t('imageSource')}
                                </label>
                                <div className="flex gap-2 mt-1">
                                    <label className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 p-3 rounded cursor-pointer flex items-center justify-center gap-2 border border-dashed border-gray-300">
                                        <Upload size={18} />
                                        <span className="text-sm font-medium">Upload Image</span>
                                        <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                </div>
                                {itemForm.image && (
                                    <div className="mt-2 h-32 w-full rounded-lg bg-gray-100 overflow-hidden relative">
                                        <img src={itemForm.image} alt="Preview" className="w-full h-full object-cover" />
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
            
            {/* Customization Modal */}
            {selectedPizza && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
                    <div className="bg-white w-full sm:rounded-xl sm:max-w-lg shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh] rounded-t-2xl">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h3 className="font-bold text-lg line-clamp-1 pr-4">
                                {editingCartItem ? `${t('edit')}: ${getLocalizedItem(selectedPizza).name}` : getLocalizedItem(selectedPizza).name}
                            </h3>
                            <button onClick={() => { setSelectedPizza(null); setEditingCartItem(null); }}><X size={24} className="text-gray-500" /></button>
                        </div>
                        
                        <div className="p-4 overflow-y-auto flex-1">
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
                                                <span className={`font-medium text-sm ${isSelected ? 'text-brand-700' : 'text-gray-700'}`}>{toppingName}</span>
                                                <span className="text-xs text-gray-400">+฿{topping.price}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400 text-sm">No customization available.</div>
                            )}
                        </div>

                        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex items-center justify-between gap-4 pb-safe">
                             <div className="text-xl font-bold text-brand-600">
                                ฿{(selectedPizza.basePrice + selectedToppings.reduce((s, t) => s + t.price, 0)) * (editingCartItem ? editingCartItem.quantity : 1)}
                             </div>
                             <button onClick={confirmAddToCart} className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold">
                                 {editingCartItem ? t('updateItem') : t('addItem')}
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
