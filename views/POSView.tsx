
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Pizza, Topping, CartItem, ProductCategory, OrderSource, ExpenseCategory } from '../types';
import { CATEGORIES, EXPENSE_CATEGORIES, PRESET_EXPENSES } from '../constants';
import { Plus, Minus, Trash2, ShoppingBag, DollarSign, Settings, User, X, Edit2, Power, LogOut, Upload, Image as ImageIcon, Bike, Store, List, PieChart, Calculator, Globe, ToggleLeft, ToggleRight, Camera, ChevronUp, AlertCircle, Calendar, Link, Star, Layers, Database, MousePointerClick, MessageCircle, MapPin, Facebook, Phone, CheckCircle } from 'lucide-react';

export const POSView: React.FC = () => {
    const { 
        menu, addToCart, removeFromCart, cart, cartTotal, clearCart, placeOrder, orders, 
        updatePizzaPrice, togglePizzaAvailability, addPizza, deletePizza, updatePizza, toggleBestSeller,
        toppings, addTopping, deleteTopping, updateCartItemQuantity, updateCartItem,
        adminLogout, shopLogo, updateShopLogo,
        expenses, addExpense, deleteExpense,
        t, toggleLanguage, language, getLocalizedItem,
        isStoreOpen, toggleStoreStatus, storeSettings, updateStoreSettings, seedDatabase
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
        name: '', description: '', basePrice: 0, image: '', available: true, category: 'pizza', comboCount: 0
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
                // Combo sub-items would be handled differently, simplifying for generic POS edit
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
        setItemForm({ name: '', description: '', basePrice: 0, image: '', available: true, category: 'pizza', comboCount: 0 });
        setShowItemModal(true);
    };

    const handleEditMenuItem = (item: Pizza) => {
        setItemForm({ ...item, comboCount: item.comboCount || 0 });
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
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.netAmount || o.totalAmount), 0) - totalExpenses;

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

                {/* VIEW: SALES REPORT */}
                {activeTab === 'sales' && (
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2"><PieChart className="text-blue-600"/> {t('salesReport')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                 <h3 className="text-sm font-bold text-gray-500 uppercase">{t('grossSales')}</h3>
                                 <p className="text-3xl font-bold text-gray-900 mt-2">฿{totalGrossSales.toLocaleString()}</p>
                             </div>
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                 <h3 className="text-sm font-bold text-gray-500 uppercase">{t('expenses')}</h3>
                                 <p className="text-3xl font-bold text-red-600 mt-2">฿{totalExpenses.toLocaleString()}</p>
                             </div>
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                 <h3 className="text-sm font-bold text-gray-500 uppercase">{t('netProfit')}</h3>
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
                                            <th className="p-4 text-left">Type</th>
                                            <th className="p-4 text-left">Status</th>
                                            <th className="p-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {orders.slice(0, 20).map(order => (
                                            <tr key={order.id} className="text-sm hover:bg-gray-50">
                                                <td className="p-4 font-mono font-bold text-gray-600">#{order.id.slice(-4)}</td>
                                                <td className="p-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded font-bold text-xs uppercase">{order.source}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded font-bold text-xs uppercase ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right font-bold">฿{order.totalAmount}</td>
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
                         <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2"><Calculator className="text-yellow-600"/> Expenses & Costs</h2>
                         
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
                                 <h3 className="p-4 border-b font-bold text-lg bg-gray-50">Recent Expenses</h3>
                                 <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                     {expenses.length === 0 ? <p className="text-gray-400 text-center mt-10">No expenses recorded.</p> : expenses.map(exp => (
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
                                 <label className="text-xs font-bold text-gray-500 mb-1 block">Promotional Banner (Image, Video, or YouTube URL)</label>
                                 <div className="flex gap-2">
                                     <div className="relative flex-1">
                                        <Link size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                        <input 
                                            className="w-full bg-gray-50 border rounded p-2 pl-9 text-sm" 
                                            placeholder="https://... (Image, MP4, or YouTube Link)" 
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
                                         <option value="video">Video / YouTube</option>
                                     </select>
                                 </div>
                                 <p className="text-[10px] text-gray-400 mt-1">Paste a YouTube link or a direct MP4 link to show a video banner at the top of the Customer App.</p>
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
                         
                         {/* 3. Contact & Links */}
                         <div className="bg-white rounded-xl p-5 shadow-sm mb-6 border border-gray-200">
                             <h3 className="font-bold text-gray-500 text-xs uppercase mb-3 flex items-center gap-2"><MessageCircle size={14}/> Contact & Links</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div>
                                     <label className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Star size={12}/> Review URL (Google)</label>
                                     <input className="w-full bg-gray-50 border rounded p-2 text-sm" value={storeSettings.reviewUrl || ''} onChange={e => updateStoreSettings({ reviewUrl: e.target.value })} placeholder="https://maps.app.goo.gl/..."/>
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><MapPin size={12}/> Map URL</label>
                                     <input className="w-full bg-gray-50 border rounded p-2 text-sm" value={storeSettings.mapUrl || ''} onChange={e => updateStoreSettings({ mapUrl: e.target.value })} placeholder="https://maps.google.com..."/>
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Facebook size={12}/> Facebook URL</label>
                                     <input className="w-full bg-gray-50 border rounded p-2 text-sm" value={storeSettings.facebookUrl || ''} onChange={e => updateStoreSettings({ facebookUrl: e.target.value })} placeholder="https://facebook.com/..."/>
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><MessageCircle size={12}/> Line URL</label>
                                     <input className="w-full bg-gray-50 border rounded p-2 text-sm" value={storeSettings.lineUrl || ''} onChange={e => updateStoreSettings({ lineUrl: e.target.value })} placeholder="https://line.me/..."/>
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Phone size={12}/> Contact Phone</label>
                                     <input className="w-full bg-gray-50 border rounded p-2 text-sm" value={storeSettings.contactPhone || ''} onChange={e => updateStoreSettings({ contactPhone: e.target.value })} placeholder="099..."/>
                                 </div>
                             </div>
                         </div>

                         {/* 4. Menu Actions */}
                         <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                             <h3 className="font-bold text-gray-500 text-xs uppercase mb-3 flex items-center gap-2"><Database size={14}/> Data Management</h3>
                             <div className="flex gap-4">
                                 <button onClick={seedDatabase} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 font-bold text-sm flex items-center gap-2">
                                     <Upload size={16}/> Upload Menu to Database
                                 </button>
                                 <button onClick={() => setShowToppingsModal(true)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-300 font-bold text-sm flex items-center gap-2">
                                     <Layers size={16}/> Manage Toppings
                                 </button>
                             </div>
                             <p className="text-[10px] text-gray-400 mt-2">Use "Upload Menu" to sync your local code mock menu with Supabase.</p>
                         </div>
                    </div>
                )}
            </main>

            {/* Modal: Add/Edit Item */}
            {showItemModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
                        <h2 className="text-xl font-bold mb-4">{itemForm.id ? 'Edit Item' : 'Add New Item'}</h2>
                        <button onClick={() => setShowItemModal(false)} className="absolute top-4 right-4 text-gray-400"><X size={20}/></button>
                        
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('name')}</label>
                                <input className="w-full border rounded p-2" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} />
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
                                    <Layers size={12}/> Combo Settings
                                </label>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600">Pizza Count (0 = Not a combo)</span>
                                    <input 
                                        type="number" 
                                        className="w-20 border rounded p-1 text-center font-bold" 
                                        value={itemForm.comboCount} 
                                        onChange={e => setItemForm({...itemForm, comboCount: parseInt(e.target.value) || 0})}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">If set > 0, customer will be asked to select this many pizzas.</p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('description')}</label>
                                <textarea className="w-full border rounded p-2 h-20" value={itemForm.description} onChange={e => setItemForm({...itemForm, description: e.target.value})} />
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
            
            {/* Modal: Manage Toppings */}
             {showToppingsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
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
