
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Pizza, Topping, CartItem, ProductCategory, OrderSource, ExpenseCategory, PaymentMethod, Order, OrderStatus, SubItem, parseGPSCoordinates, parseDeliveryPhone, parseAnyMapLink } from '../types';
import { CATEGORIES, EXPENSE_CATEGORIES, PRESET_EXPENSES } from '../constants';
import { generatePromptPayPayload } from '../utils/promptpay';
import { calculateDistanceKm } from '../utils/geo';
import { Plus, Minus, Trash2, ShoppingBag, DollarSign, Settings, User, X, Edit2, Power, LogOut, Upload, Image as ImageIcon, Bike, Store, List, PieChart, Calculator, Globe, ToggleLeft, ToggleRight, Camera, ChevronUp, ChevronDown, AlertCircle, Calendar, Link, Star, Layers, Database, MousePointerClick, MessageCircle, MapPin, Facebook, Phone, CheckCircle, Video, PlayCircle, Newspaper, Save, Download, QrCode, Printer, CheckCircle2, ChefHat, Banknote, CreditCard, Lock, Unlock, ArrowRight, Utensils, RefreshCw, Send, Check, ChevronRight, ArrowLeft, Filter, FileSpreadsheet, Maximize2, Sparkles, Receipt, Eye, Volume2, VolumeX, Clock } from 'lucide-react';

const convertGoogleDriveUrl = (url: string): string => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com') || trimmed.includes('googleusercontent.com')) {
        let fileId = '';
        const dMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{15,80})/);
        const dShortMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{15,80})/);
        const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{15,80})/);
        const lhMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{15,80})/);

        if (dMatch && dMatch[1]) {
            fileId = dMatch[1];
        } else if (dShortMatch && dShortMatch[1]) {
            fileId = dShortMatch[1];
        } else if (idMatch && idMatch[1]) {
            fileId = idMatch[1];
        } else if (lhMatch && lhMatch[1]) {
            fileId = lhMatch[1];
        }

        if (fileId) {
            // drive.google.com/thumbnail is serving-safe and bypasses third-party cookie restrictions
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        }
    }
    return trimmed;
};

const isDriveUrl = (url: string): boolean => {
    if (!url) return false;
    return url.includes('drive.google.com/thumbnail') || url.includes('lh3.googleusercontent.com') || url.includes('drive.google.com') || url.includes('docs.google.com');
};

const isPhotosUrl = (url: string): boolean => {
    if (!url) return false;
    return url.includes('photos.app.goo.gl') || url.includes('photos.google.com');
};

const formatOrderDateTime = (dateStr?: string | null, dateStyle: 'short' | 'medium' | 'long' | 'full' | 'default' = 'default'): string => {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'N/A';
        if (dateStyle === 'default') {
            return d.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
        }
        return d.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle, timeStyle: 'short' });
    } catch (e) {
        return 'N/A';
    }
};

export const POSView: React.FC = () => {
    const { 
        menu, addToCart, removeFromCart, cart, cartTotal, clearCart, placeOrder, orders, deleteOrder, updateOrderFields,
        updatePizzaPrice, togglePizzaAvailability, addPizza, deletePizza, updatePizza, toggleBestSeller, reorderMenu,
        toppings, addTopping, updateTopping, deleteTopping, updateCartItemQuantity, updateCartItem,
        adminLogout, shopLogo, updateShopLogo,
        expenses, addExpense, deleteExpense,
        t, toggleLanguage, language, getLocalizedItem,
        isStoreOpen, toggleStoreStatus, storeSettings, updateStoreSettings, seedDatabase,
        partners, addPartner, updatePartner, deletePartner,
        addNewsItem, deleteNewsItem, getAllCustomers, completeOrder, updateOrderStatus, updateOrderDeliveryFee, updateOrderNetAmount,
        paperSize, setPaperSize,
        printerIpAddress, setPrinterIpAddress,
        printerPort, setPrinterPort,
        printerType, setPrinterType,
        receiptFontSize, setReceiptFontSize,
        receiptPadding, setReceiptPadding,
        autoPrintNewOrders, setAutoPrintNewOrders,
        vatEnabled, setVatEnabled,
        btDevice, btCharacteristic, btStatus,
        connectBluetoothPrinter, disconnectBluetoothPrinter,
        triggerReceiptPrint, generateEscPosData, writeBtInChunks
    } = useStore();
    
    // Unified Tab State
    const [activeTab, setActiveTab] = useState<string>('order');
    const [selectedPizza, setSelectedPizza] = useState<Pizza | null>(null);
    
    // Half-Half customizer states for POS
    const [halfA, setHalfA] = useState<Pizza | null>(null);
    const [halfB, setHalfB] = useState<Pizza | null>(null);

    // Partners form states
    const [newPartnerName, setNewPartnerName] = useState('');
    const [newPartnerComm, setNewPartnerComm] = useState<number>(10);

    useEffect(() => {
        if (selectedPizza?.id === 'p_half_half') {
            setHalfA(null);
            setHalfB(null);
        }
    }, [selectedPizza]);

    const handleUpdateGPDeduction = async (order: Order) => {
        const suggestion = (order.totalAmount - (order.netAmount || order.totalAmount)).toFixed(2);
        const deductionStr = prompt(`Enter GP Deduction Amount for Order #${String(order.id).slice(-4)}:`, suggestion);
        if (deductionStr !== null) {
            const deduction = parseFloat(deductionStr);
            if (!isNaN(deduction) && deduction >= 0) {
                const newNetAmount = order.totalAmount - deduction;
                await updateOrderNetAmount(order.id, newNetAmount);
            } else {
                alert("Invalid deduction amount.");
            }
        }
    };

    const isoToDatetimeLocal = (isoStr: string) => {
        try {
            if (!isoStr) return '';
            const date = new Date(isoStr);
            const pad = (num: number) => String(num).padStart(2, '0');
            const year = date.getFullYear();
            const month = pad(date.getMonth() + 1);
            const day = pad(date.getDate());
            const hours = pad(date.getHours());
            const minutes = pad(date.getMinutes());
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (e) {
            return '';
        }
    };

    const datetimeLocalToIso = (localStr: string) => {
        try {
            if (!localStr) return new Date().toISOString();
            const date = new Date(localStr);
            return date.toISOString();
        } catch (e) {
            return new Date().toISOString();
        }
    };

    const handleDeleteOrderPrompt = async (order: Order) => {
        const confirmMsg = language === 'th' 
            ? `คุณแน่ใจหรือไม่ว่าต้องการลบออเดอร์ #${String(order.id).slice(-4)} ของคุณ ${order.customerName}? (การลบนี้จะไม่สามารถย้อนกลับได้และข้อมูลในฐานข้อมูลจะถูกลบถาวร)` 
            : `Are you sure you want to delete order #${String(order.id).slice(-4)} for ${order.customerName}? (This action cannot be undone and data will be permanently removed from database)`;
        if (confirm(confirmMsg)) {
            try {
                await deleteOrder(order.id);
                alert(language === 'th' ? "ลบออเดอร์สำเร็จแล้ว!" : "Order deleted successfully!");
            } catch (e: any) {
                alert("Error deleting order: " + e.message);
            }
        }
    };

    const handleStartEditOrder = (order: Order) => {
        setEditingOrder(order);
        setEditOrderForm({
            customerName: order.customerName || '',
            customerPhone: order.customerPhone || '',
            status: order.status,
            source: order.source,
            paymentMethod: order.paymentMethod || 'cash',
            totalAmount: order.totalAmount,
            netAmount: order.netAmount || order.totalAmount,
            createdAt: order.createdAt,
            tableNumber: order.tableNumber || '',
            note: order.note || ''
        });
        setShowEditOrderModal(true);
    };

    const handleSaveOrderEdit = async () => {
        if (!editingOrder) return;
        try {
            await updateOrderFields(editingOrder.id, {
                customerName: editOrderForm.customerName,
                customerPhone: editOrderForm.customerPhone,
                status: editOrderForm.status,
                source: editOrderForm.source,
                paymentMethod: editOrderForm.paymentMethod,
                totalAmount: Number(editOrderForm.totalAmount),
                netAmount: Number(editOrderForm.netAmount),
                createdAt: editOrderForm.createdAt,
                tableNumber: editOrderForm.tableNumber,
                note: editOrderForm.note
            });
            setShowEditOrderModal(false);
            setEditingOrder(null);
            alert(language === 'th' ? "บันทึกการแก้ไขออเดอร์สำเร็จแล้ว!" : "Order details saved successfully!");
        } catch (e: any) {
            alert("Error updating order: " + e.message);
        }
    };
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
    const [deliveryPlatformRef, setDeliveryPlatformRef] = useState('');
    const [tempClosedMsg, setTempClosedMsg] = useState(storeSettings.closedMessage);
    const [orderSource, setOrderSource] = useState<OrderSource>('store');
    
    // Reporting State
    const [salesFilter, setSalesFilter] = useState<'day' | 'month' | 'year' | 'all'>('day');
    
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
    const [taxInvoice, setTaxInvoice] = useState({ isRequested: false, companyName: '', taxId: '', address: '' });
    const [change, setChange] = useState<number>(0);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // --- EDIT ORDER STATE ---
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [showEditOrderModal, setShowEditOrderModal] = useState(false);
    const [editOrderForm, setEditOrderForm] = useState<{
        customerName: string;
        customerPhone: string;
        status: OrderStatus;
        source: OrderSource;
        paymentMethod: PaymentMethod;
        totalAmount: number;
        netAmount: number;
        createdAt: string;
        tableNumber: string;
        note: string;
    }>({
        customerName: '',
        customerPhone: '',
        status: 'pending',
        source: 'store',
        paymentMethod: 'cash',
        totalAmount: 0,
        netAmount: 0,
        createdAt: '',
        tableNumber: '',
        note: ''
    });

    // --- POS AUDIO ALERTS AND SYSTEM SOUND FEEDBACK ---
    const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem('damac_pos_sound');
            return saved !== null ? JSON.parse(saved) : true;
        } catch (e) {
            return true;
        }
    });
    const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
    const audioCtxRef = React.useRef<AudioContext | null>(null);

    const initAudio = () => {
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }
            setAudioUnlocked(true);
        } catch (e) {
            console.warn("Failed to initialize or resume AudioContext", e);
        }
    };

    useEffect(() => {
        const handleUserGesture = () => {
            if (!audioUnlocked) {
                initAudio();
            }
            window.removeEventListener('click', handleUserGesture);
            window.removeEventListener('touchstart', handleUserGesture);
        };
        window.addEventListener('click', handleUserGesture);
        window.addEventListener('touchstart', handleUserGesture);
        return () => {
            window.removeEventListener('click', handleUserGesture);
            window.removeEventListener('touchstart', handleUserGesture);
        };
    }, [audioUnlocked]);

    const toggleSound = () => {
        setSoundEnabled(prev => {
            const next = !prev;
            localStorage.setItem('damac_pos_sound', JSON.stringify(next));
            return next;
        });
        initAudio();
        setTimeout(() => {
            playSuccessFeedback();
        }, 50);
    };

    const playClickSound = () => {
        if (!soundEnabled) return;
        try {
            const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
            if (!audioCtxRef.current) audioCtxRef.current = ctx;
            if (ctx.state === 'suspended') ctx.resume();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(580, ctx.currentTime);
            
            gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.08);
        } catch (e) {
            console.warn("Failed to play click sound", e);
        }
    };

    const playSuccessFeedback = () => {
        if (!soundEnabled) return;
        try {
            const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
            if (!audioCtxRef.current) audioCtxRef.current = ctx;
            if (ctx.state === 'suspended') ctx.resume();
            
            const beep = (freq: number, delay: number, duration: number) => {
                if (!ctx) return;
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();
                osc.connect(gainNode);
                gainNode.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
                gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
                gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + delay + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
                osc.start(ctx.currentTime + delay);
                osc.stop(ctx.currentTime + delay + duration + 0.05);
            };
            beep(659.25, 0, 0.08); // E5
            beep(880.00, 0.07, 0.2);  // A5
        } catch (e) {
            console.warn("Failed to play success sound", e);
        }
    };

    const playAlertSound = () => {
        if (!soundEnabled) return;
        try {
            const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
            if (!audioCtxRef.current) audioCtxRef.current = ctx;
            if (ctx.state === 'suspended') ctx.resume();
            
            const buzz = (freq: number, delay: number, duration: number) => {
                if (!ctx) return;
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();
                osc.connect(gainNode);
                gainNode.connect(ctx.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
                gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
                gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + delay + 0.03);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
                osc.start(ctx.currentTime + delay);
                osc.stop(ctx.currentTime + delay + duration + 0.05);
            };
            buzz(160, 0, 0.12);
            buzz(120, 0.08, 0.2);
        } catch (e) {
            console.warn("Failed to play alert sound", e);
        }
    };

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

    const [deliveryForm, setDeliveryForm] = useState({
        storeLocationGps: '',
        freeDeliveryRadiusKm: 5,
        deliveryFeePerKm: 10,
        baseDeliveryFee: 0
    });
    
    // Robust Receipt Data Interface
    interface ReceiptData {
        storeName: string;
        address: string;
        taxId: string;
        phone: string;
        orderId: string;
        date: string;
        tableOrType: string;
        source: string;
        customerName: string;
        customerPhone?: string;
        deliveryAddress?: string;
        deliveryFee?: number | 'pending';
        items: CartItem[];
        subtotal: number;
        vat: number; // 7%
        total: number;
        paymentMethod: string;
        received?: number;
        change: number;
        note?: string;
        queueNo?: string;
        deliveryPlatformRef?: string;
        taxInvoice?: {
            isRequested: boolean;
            companyName: string;
            taxId: string;
            address: string;
        };
        isPaid?: boolean;
    }
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

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
            setDeliveryForm({
                storeLocationGps: storeSettings.storeLocationGps || '13.9239103,100.5220632',
                freeDeliveryRadiusKm: storeSettings.freeDeliveryRadiusKm ?? 5,
                deliveryFeePerKm: storeSettings.deliveryFeePerKm ?? 10,
                baseDeliveryFee: storeSettings.baseDeliveryFee ?? 0
            });
            setTempClosedMsg(storeSettings.closedMessage);
        }
    }, [storeSettings]);

    // --- HELPER: IMAGE COMPRESSION ---
    // Prevents app crash by resizing large images before saving to state/localStorage
    const compressImage = (file: File, maxWidth: number = 800): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    // Resize logic
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    // Compress to JPEG at 0.5 quality to save space
                    resolve(canvas.toDataURL('image/jpeg', 0.5));
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    // Active Tables Logic - Show active or unpaid orders
    const activeTables = (orders || []).filter(o => 
        o && 
        o.status &&
        o.status !== 'completed' && 
        o.status !== 'cancelled'
    );

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

    // Stable transition tracker for silent initial load & real-time auto-prints
    const sessionStartTimeRef = React.useRef(Date.now());
    const prevOrdersRef = React.useRef<Order[]>([]);

    useEffect(() => {
        if (!orders) return;

        // If this is the initial mount/load or prevOrders is empty, we record current orders as pre-existing
        const validOrders = orders.filter(Boolean);
        if (prevOrdersRef.current.length === 0 && validOrders.length > 0) {
            prevOrdersRef.current = validOrders;
            return;
        }

        if (!autoPrintNewOrders) {
            prevOrdersRef.current = validOrders;
            return;
        }

        validOrders.forEach(order => {
            if (!order || !order.id) return;
            const prevOrder = prevOrdersRef.current.find(o => o && o.id === order.id);

            if (!prevOrder) {
                // New Order added to list in this active session
                const orderTime = order.createdAt ? new Date(order.createdAt).getTime() : Date.now();
                const isNewSessionOrder = orderTime > sessionStartTimeRef.current - 15000; // within 15 seconds of or after session start

                if (isNewSessionOrder) {
                    // Condition 1: Dine-in / Walk-in / Store order created & confirmed (Pay Later)
                    if (order.type === 'dine-in' && order.status === 'confirmed') {
                        handleReprintOrder(order);
                    }
                    // Condition 2: Delivery order first received (status pending / confirmed)
                    else if (order.type === 'delivery' && (order.status === 'pending' || order.status === 'confirmed')) {
                        handleReprintOrder(order);
                    }
                    // Condition 3: Any order instantly created as completed/paid
                    else if (order.status === 'completed') {
                        handleReprintOrder(order);
                    }
                }
            } else {
                // Pre-existing order modified: check status transition to completed/paid
                if (prevOrder.status !== 'completed' && order.status === 'completed') {
                    handleReprintOrder(order);
                }
            }
        });

        prevOrdersRef.current = validOrders;
    }, [orders, autoPrintNewOrders]);

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
    
    const getCleanQrUrl = () => (qrBaseUrl || '').replace(/\/$/, "");
    
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
        playClickSound();
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
        playClickSound();
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
        playClickSound();
        if (selectedToppings.find(t => t.id === topping.id)) {
            setSelectedToppings(prev => prev.filter(t => t.id !== topping.id));
        } else {
            setSelectedToppings(prev => [...prev, topping]);
        }
    };

    const confirmAddToCart = () => {
        if (!selectedPizza) return;
        playSuccessFeedback();
        const toppingsPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);

        if (selectedPizza.id === 'p_half_half') {
            if (!halfA || !halfB) {
                alert("Please select both halves for the Half-Half pizza!");
                return;
            }
            const calculatedBasePrice = Math.round((halfA.basePrice / 2) + (halfB.basePrice / 2) + 20);
            const itemTotal = (calculatedBasePrice + toppingsPrice) * quantity;
            const nameEn = `Half-Half Pizza (${halfA.name} / ${halfB.name})`;
            const nameTh = `พิซซ่าครึ่ง-ครึ่ง (${halfA.nameTh || halfA.name} / ${halfB.nameTh || halfB.name})`;

            const item: CartItem = {
                id: editingCartItem ? editingCartItem.id : Date.now().toString() + Math.random().toString(),
                pizzaId: selectedPizza.id,
                name: nameEn,
                nameTh: nameTh,
                basePrice: calculatedBasePrice,
                selectedToppings: selectedToppings,
                quantity: quantity,
                totalPrice: itemTotal,
                subItems: [
                    { pizzaId: halfA.id, name: `Half A: ${halfA.name}`, nameTh: `ครึ่งแรก: ${halfA.nameTh || halfA.name}`, toppings: [] },
                    { pizzaId: halfB.id, name: `Half B: ${halfB.name}`, nameTh: `ครึ่งหลัง: ${halfB.nameTh || halfB.name}`, toppings: [] }
                ],
                specialInstructions: specialInstructions
            };
            if (editingCartItem) updateCartItem(item); else addToCart(item);
            setSelectedPizza(null); setSelectedToppings([]); setEditingCartItem(null); setSpecialInstructions(''); setQuantity(1);
            setHalfA(null); setHalfB(null);
            if (editingCartItem && window.innerWidth < 768) setShowMobileCart(true);
            return;
        }

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

    const handleDirectAddToCart = (e: React.MouseEvent, item: Pizza) => {
        e.stopPropagation();
        if (!item.available) return;
        
        if (item.id === 'custom_base' || item.id === 'p_half_half' || (item.category === 'promotion' && (item.comboCount || 0) > 0)) {
            handleCustomize(item);
            return;
        }

        playSuccessFeedback();
        const localized = getLocalizedItem(item);
        const cartItem: CartItem = {
            id: Date.now().toString() + Math.random().toString(),
            pizzaId: item.id,
            name: localized.name,
            nameTh: item.nameTh,
            basePrice: item.basePrice,
            selectedToppings: [],
            quantity: 1,
            totalPrice: item.basePrice,
            specialInstructions: ''
        };
        addToCart(cartItem);
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
        playSuccessFeedback();
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
        playSuccessFeedback();
        const success = await placeOrder('dine-in', {
            tableNumber: tableNumber || (orderSource !== 'store' ? orderSource.toUpperCase() : 'Walk-in'),
            source: orderSource, paymentMethod: undefined, status: 'confirmed', 
            note: orderSource === 'store' ? 'Pay Later' : `${orderSource.toUpperCase()} Order`,
            deliveryPlatformRef: deliveryPlatformRef
        });
        if (success) { setTableNumber(''); setDeliveryPlatformRef(''); setShowMobileCart(false); setOrderSource('store'); setActiveTab('tables'); }
    };

    const handleCheckBill = () => {
        if (cart.length === 0) return;
        playClickSound();
        setSelectedOrder(null); setCashReceived(''); setPaymentMethod('cash'); setShowPaymentModal(true);
    };
    
    const handleCheckTableBill = (order: Order) => {
        playClickSound();
        setSelectedOrder(order); setCashReceived(''); setPaymentMethod('cash'); setShowPaymentModal(true);
    }
    
    const handleCloseTable = async (orderId: string) => {
        if(confirm("Close this table? (Mark as completed)")) {
            playSuccessFeedback();
            await completeOrder(orderId, { paymentMethod: 'cash' });
        }
    }
    
    const handleConfirmPaymentAndCook = async (orderId: string) => {
        if(confirm(language === 'th' ? "ยืนยันว่าได้รับเงินแล้วและส่งออเดอร์ให้ครัวเริ่มทำ?" : "Confirm payment received and start cooking?")) {
            playSuccessFeedback();
            await updateOrderStatus(orderId, 'cooking');
        }
    }
    
    const handleCancelTable = async (orderId: string) => {
        if(confirm("Force Cancel/Delete this table order?")) {
            playAlertSound();
            await updateOrderStatus(orderId, 'cancelled');
        }
    }

    const handleUpdateDeliveryFee = async (order: Order) => {
        const feeStr = prompt(`Enter delivery fee for Order #${String(order.id).slice(-4)}:`, order.deliveryFee === 'pending' ? '' : String(order.deliveryFee));
        if (feeStr !== null) {
            const fee = parseFloat(feeStr);
            if (!isNaN(fee) && fee >= 0) {
                await updateOrderDeliveryFee(order.id, fee);
            } else {
                alert("Invalid fee amount.");
            }
        }
    };

    const handleFinalizePayment = async () => {
        if (selectedOrder && selectedOrder.deliveryFee === 'pending') {
            alert("Please update the delivery fee before finalizing payment.");
            return;
        }
        const currentTotal = selectedOrder ? selectedOrder.totalAmount : cartTotal;
        if (paymentMethod === 'cash' && parseFloat(cashReceived || '0') < currentTotal) { alert("Insufficient cash!"); return; }
        const note = paymentMethod === 'cash' 
            ? `Cash: ${cashReceived}, Change: ${change}` 
            : paymentMethod === 'thai_chuay_thai'
                ? 'Paid via Thai Chuay Thai (Tungngern QR)'
                : 'Paid via QR';
        
        if (selectedOrder) {
            playSuccessFeedback();
            await completeOrder(selectedOrder.id, { paymentMethod: paymentMethod, note: note });
            alert(
                paymentMethod === 'cash' 
                    ? `Paid! Change: ฿${change}` 
                    : paymentMethod === 'thai_chuay_thai'
                        ? "Paid via Thai Chuay Thai Project!"
                        : "Order Paid via QR!"
            );
        } else {
            playSuccessFeedback();
            const success = await placeOrder('dine-in', {
                tableNumber: tableNumber || 'Walk-in', source: orderSource, paymentMethod: paymentMethod, status: 'completed', note: note, deliveryPlatformRef: deliveryPlatformRef
            });
            if (success) { 
                alert(
                    paymentMethod === 'cash' 
                        ? `Paid! Change: ฿${change}` 
                        : paymentMethod === 'thai_chuay_thai'
                            ? "Paid via Thai Chuay Thai Project!"
                            : "Paid via QR!"
                ); 
                setTableNumber(''); 
                setDeliveryPlatformRef(''); 
                setOrderSource('store'); 
                setShowMobileCart(false); 
            }
        }
        setShowPaymentModal(false);
    };

    // --- INTEGRATED RECEIPT TRIGGER (WITH LOCAL RECEIPT DATA CACHING) ---
    const handleTriggerReceiptPrint = async (payload: any) => {
        setReceiptData(payload);
        playSuccessFeedback();
        await triggerReceiptPrint(payload);
    };

    const handlePrintBill = () => {
        const currentItems = selectedOrder ? selectedOrder.items : cart;
        const currentTotal = selectedOrder ? selectedOrder.totalAmount : cartTotal;
        const tableOrType = selectedOrder ? (selectedOrder.tableNumber ? `Table ${selectedOrder.tableNumber}` : selectedOrder.type.toUpperCase()) : (tableNumber ? `Table ${tableNumber}` : 'Walk-in');
        
        // Calculate VAT (7% included if enabled) => Total * 7 / 107
        const vatAmount = vatEnabled ? (currentTotal * 7) / 107 : 0;
        const subtotal = currentTotal - vatAmount;

        // Payment Details (Use current state if paying now, or defaults)
        const payMethod = selectedOrder?.paymentMethod || paymentMethod;
        const received = parseFloat(cashReceived) || currentTotal; // Default to exact if not specified
        const changeAmt = change || 0;

        // Queue/Table Logic for Header
        let queueNo = '';
        if (selectedOrder?.tableNumber || tableNumber) {
            queueNo = `Table ${selectedOrder?.tableNumber || tableNumber}`;
        } else {
            const id = selectedOrder ? selectedOrder.id : Date.now().toString();
            queueNo = `Q-${String(id).slice(-3)}`;
        }

        const payload = {
            storeName: "Pizza Damac Nonthaburi",
            address: "Nonthaburi, Thailand",
            taxId: storeSettings.promptPayNumber || "0-9949-7919-9", 
            phone: storeSettings.contactPhone || "099-497-9199",
            orderId: selectedOrder ? String(selectedOrder.id).slice(-4) : 'NEW',
            date: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
            tableOrType: tableOrType,
            source: selectedOrder ? selectedOrder.source.toUpperCase() : orderSource.toUpperCase(),
            customerName: selectedOrder?.customerName || 'Guest',
            customerPhone: selectedOrder?.customerPhone || '',
            deliveryAddress: selectedOrder?.deliveryAddress || '',
            deliveryFee: selectedOrder?.deliveryFee,
            note: selectedOrder?.note || '',
            queueNo: queueNo,
            deliveryPlatformRef: selectedOrder ? selectedOrder.deliveryPlatformRef : deliveryPlatformRef,
            items: currentItems,
            subtotal: subtotal,
            vat: vatAmount,
            total: currentTotal,
            paymentMethod: payMethod === 'cash' ? 'CASH' : payMethod === 'thai_chuay_thai' ? 'THAI CHUAY THAI' : 'QR / TRANSFER',
            received: received,
            change: changeAmt,
            taxInvoice: taxInvoice,
            isPaid: selectedOrder ? selectedOrder.status === 'completed' : true
        };

        handleTriggerReceiptPrint(payload);
    };

    // --- REPRINT FOR LOG BOOK ---
    const handleReprintOrder = (order: Order) => {
        // Calculate VAT (7% included if enabled)
        const vatAmount = vatEnabled ? (order.totalAmount * 7) / 107 : 0;
        const subtotal = order.totalAmount - vatAmount;

        // Queue/Table Logic
        let queueNo = '';
        if (order.tableNumber) {
            queueNo = `Table ${order.tableNumber}`;
        } else {
            queueNo = `Q-${String(order.id).slice(-3)}`;
        }

        const payload = {
            storeName: "Pizza Damac Nonthaburi",
            address: "Nonthaburi, Thailand",
            taxId: storeSettings.promptPayNumber || "0-9949-7919-9",
            phone: storeSettings.contactPhone || "099-497-9199",
            orderId: String(order.id).slice(-4),
            date: formatOrderDateTime(order.createdAt),
            tableOrType: order.tableNumber ? `Table ${order.tableNumber}` : order.type.toUpperCase(),
            source: order.source.toUpperCase(),
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            deliveryAddress: order.deliveryAddress,
            deliveryFee: order.deliveryFee,
            note: order.note,
            queueNo: queueNo,
            deliveryPlatformRef: order.deliveryPlatformRef,
            items: order.items,
            subtotal: subtotal,
            vat: vatAmount,
            total: order.totalAmount,
            paymentMethod: order.paymentMethod === 'cash' ? 'CASH' : order.paymentMethod === 'thai_chuay_thai' ? 'THAI CHUAY THAI' : 'QR / TRANSFER',
            received: order.totalAmount, // Assumed exact for history
            change: 0,
            isPaid: order.status === 'completed'
        };

        handleTriggerReceiptPrint(payload);
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (window.confirm("Delete record?")) await deleteOrder(orderId);
    };

    // --- ITEM & TOPPING MANAGEMENT ---
    const handleOpenAddModal = () => {
        setItemForm({ name: '', nameTh: '', description: '', descriptionTh: '', basePrice: 0, image: '', available: true, category: 'pizza', comboCount: 0, allowedPromotions: [], badge: '', badgeTh: '' });
        setShowItemModal(true);
    };
    const handleEditMenuItem = (item: Pizza) => {
        setItemForm({ ...item, comboCount: item.comboCount || 0, allowedPromotions: item.allowedPromotions || [], badge: item.badge || '', badgeTh: item.badgeTh || '' });
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
    
    const handleMoveMenuItem = (pizzaId: string, direction: 'up' | 'down') => {
        // Filter menu by current active category to handle category-scoped reordering or overall reordering
        // Reordering the raw 'menu' array is best, as it represents the stored order of all items.
        const currentIndex = menu.findIndex(p => p.id === pizzaId);
        if (currentIndex === -1) return;
        
        const newMenu = [...menu];
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        // Boundaries check
        if (targetIndex < 0 || targetIndex >= newMenu.length) return;
        
        // Swap items
        const temp = newMenu[currentIndex];
        newMenu[currentIndex] = newMenu[targetIndex];
        newMenu[targetIndex] = temp;
        
        const sortedIds = newMenu.map(p => p.id);
        reorderMenu(sortedIds);
    };
    
    // UPDATED: Compress Image Handlers
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { 
            try {
                const compressed = await compressImage(file, 800); // 800px max width for menu
                setItemForm({ ...itemForm, image: compressed }); 
            } catch (error) {
                alert("Failed to process image. Try a smaller file.");
            }
        }
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
    const handleToppingImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { 
            try {
                const compressed = await compressImage(file, 400); // 400px max width for toppings
                setToppingForm({ ...toppingForm, image: compressed }); 
            } catch(e) {
                alert("Image error");
            }
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { 
            try {
                const compressed = await compressImage(file, 200); // 200px max width for logo
                updateShopLogo(compressed);
            } catch(e) { alert("Logo upload failed"); }
        }
    };
    
    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { 
            try {
                const compressed = await compressImage(file, 1200); // 1200px max width for banner
                setMediaForm(p => ({ ...p, promoBannerUrl: compressed })); 
                updateStoreSettings({ promoBannerUrl: compressed, promoContentType: 'image' });
            } catch(e) { alert("Banner upload failed. Try a smaller image."); }
        }
    };
    
    const handleEventImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { 
            try {
                const compressed = await compressImage(file, 400); // 400px max width to severely save space
                const newGallery = [...(mediaForm.eventGalleryUrls || []), compressed]; 
                setMediaForm(p => ({ ...p, eventGalleryUrls: newGallery })); 
            } catch(e) { alert("Gallery upload failed"); }
        }
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
    const activeOrders = (orders || []).filter(o => o && o.status && o.status !== 'cancelled');
    const filteredOrders = activeOrders.filter(o => o && filterByDate(o.createdAt, salesFilter));
    const filteredExpenses = (expenses || []).filter(e => e && filterByDate(e.date, salesFilter));
    const totalGrossSales = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = filteredOrders.reduce((sum, o) => sum + (o.netAmount || o.totalAmount || 0), 0) - totalExpenses;
    const filteredMenu = useMemo(() => {
        const raw = menu.filter(item => { const cat = item.category || 'pizza'; return cat === activeCategory; });
        if (activeCategory === 'pizza') {
            const virtualHalfHalfPizza: Pizza = {
                id: 'p_half_half',
                name: 'Half-Half Pizza (Create Your Own)',
                nameTh: 'พิซซ่าครึ่ง-ครึ่ง (รวม 2 หน้าในถาดเดียว)',
                basePrice: 0, 
                description: 'Choose 2 flavors in 1 pizza tray! Price is (Average base price + 20 THB).',
                descriptionTh: 'เลือกผสม 2 หน้าที่คุณชอบในถาดเดียว! ราคาคิดเฉลี่ยสองหน้า + 20 บาท',
                image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
                available: true,
                category: 'pizza',
                badge: 'Mix 2-in-1',
                badgeTh: 'แบ่งครึ่งผสมผสาน'
            };
            return [virtualHalfHalfPizza, ...raw];
        }
        return raw;
    }, [menu, activeCategory]);

    // Export Handlers
    const handleExportSales = () => {
        if (filteredOrders.length === 0) { alert("No sales data to export"); return; }
        const data = filteredOrders.map(o => ({
            ID: o.id,
            Date: formatOrderDateTime(o.createdAt),
            Customer: o.customerName,
            Type: o.type,
            Source: o.source,
            Status: o.status,
            Total: o.totalAmount,
            Payment: o.paymentMethod || '-',
            Items: (o.items || []).map(i => `${i.quantity}x ${i.name}`).join('; ')
        }));
        downloadCSV(data, `sales_report_${salesFilter}.csv`);
    };

    const handleExportExpenses = () => {
        if (filteredExpenses.length === 0) { alert("No expense data to export"); return; }
        const data = filteredExpenses.map(e => ({
            Date: new Date(e.date).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' }),
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
        <div className="flex h-screen bg-gray-100 overflow-hidden flex-col lg:flex-row font-sans print:h-auto print:overflow-visible print:bg-white print:block">
                     {/* --- DYNAMIC PRINTER STYLE INJECTION --- */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: ${paperSize === '58mm' ? '58mm' : '80mm'} auto !important;
                        margin: 0mm !important;
                    }
                    html, body, #root {
                        width: ${paperSize === '58mm' ? '58mm' : '80mm'} !important;
                        height: auto !important;
                        overflow: visible !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body > *:not(.printable-area) {
                        display: none !important;
                    }
                    #root > *:not(.printable-area) {
                        display: none !important;
                    }
                    .printable-area {
                        width: ${paperSize === '58mm' ? '58mm' : '80mm'} !important;
                        padding: ${receiptPadding}mm !important;
                        height: auto !important;
                        min-height: auto !important;
                        max-height: none !important;
                        overflow: visible !important;
                        display: block !important;
                    }
                    .printable-area, .printable-area * {
                        font-size: ${receiptFontSize}px !important;
                    }
                    .printable-area .store-title {
                        font-size: ${receiptFontSize + 3}px !important;
                    }
                }
            ` }} />

            {/* --- ROBUST THAI RECEIPT PRINTER (58mm/80mm Adaptive Channel) --- */}
            <div 
                className={`hidden print:block printable-area ${paperSize === '58mm' ? 'print:w-[58mm]' : 'print:w-[80mm]'} print:font-mono p-0 m-0 bg-white text-black leading-snug`}
                style={{ fontSize: `${receiptFontSize}px` }}
            >
                {receiptData && (
                    <div className={`${paperSize === '58mm' ? 'w-[58mm]' : 'w-[80mm]'} overflow-hidden`}>
                        <div className="text-center font-bold">
                            <div>{paperSize === '58mm' ? '=============================' : '========================================'}</div>
                            <div 
                                className="mt-1 mb-1 font-black store-title"
                                style={{ fontSize: `${receiptFontSize + 3}px` }}
                            >
                                {receiptData.storeName}
                            </div>
                            <div className="mb-1">โทร: {receiptData.phone}</div>
                            {receiptData.deliveryPlatformRef && receiptData.source !== 'STORE' && (
                                <div className="mt-2 mb-1">
                                    {receiptData.source.toUpperCase() === 'GRAB' ? (
                                        <div className="whitespace-pre-wrap text-[11px] font-extrabold bg-gray-150 p-1">Order Grab {receiptData.deliveryPlatformRef}</div>
                                    ) : receiptData.source.toUpperCase() === 'LINEMAN' ? (
                                        <div className="whitespace-pre-wrap text-[11px] font-extrabold bg-gray-150 p-1">Order Lineman {receiptData.deliveryPlatformRef}</div>
                                    ) : (
                                        <div className="whitespace-pre-wrap text-[11px] font-extrabold bg-gray-150 p-1">Order {receiptData.source} {receiptData.deliveryPlatformRef}</div>
                                    )}
                                </div>
                            )}
                            <div>{paperSize === '58mm' ? '=============================' : '========================================'}</div>
                            <div className="mt-1 text-[11px] font-extrabold">ใบเสร็จรับเงิน / ใบสั่งอาหาร</div>
                            <div className="text-[10px] font-bold">(Receipt / Order Bill)</div>
                            <div>{paperSize === '58mm' ? '-----------------------------' : '----------------------------------------'}</div>
                            
                            {receiptData.isPaid ? (
                                <div className="my-1 base-border py-1 px-2 text-center font-black text-[12px] tracking-wider uppercase flex items-center justify-center gap-1 bg-white text-black" style={{ border: '1px solid black' }}>
                                    <span>✔ ชำระเงินแล้ว / PAID</span>
                                </div>
                            ) : (
                                <div className="my-1 base-border py-1 px-2 text-center font-black text-[12px] tracking-wider uppercase flex items-center justify-center gap-1 bg-white text-black" style={{ border: '1px solid black' }}>
                                    <span>⚠️ ยังไม่ชำระเงิน / UNPAID</span>
                                </div>
                            )}

                            {receiptData.deliveryAddress && (
                                <div className="my-1.5 p-1 text-[9px] rounded font-bold leading-normal text-black bg-white" style={{ border: '1px solid black' }}>
                                    <div className="font-extrabold border-b pb-0.5 mb-1 text-[9.5px]" style={{ borderBottom: '1px solid black' }}>
                                        📍 ข้อมูลจัดส่ง / DELIVERY DETAILS:
                                    </div>
                                    <div className="space-y-0.5">
                                        <div>
                                            <span className="font-black">ที่อยู่:</span>{" "}
                                            <span>{receiptData.deliveryAddress.replace(/\[Phone: .*?\]/g, '')}</span>
                                        </div>
                                        {parseDeliveryPhone(receiptData.deliveryAddress) && (
                                            <div>
                                                <span className="font-black">เบอร์โทร:</span>{" "}
                                                <span className="text-[10px] underline font-black">
                                                    {parseDeliveryPhone(receiptData.deliveryAddress)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-1 mb-1 px-0.5 space-y-0.5 font-bold">
                            <div className="flex justify-between">
                                <span>เลขที่บิล: {receiptData.orderId}</span>
                                <span>วันที่: {receiptData.date.split(' ')[0]}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>โต๊ะ/ประเภท: {receiptData.tableOrType.replace('Table ', '')}</span>
                                <span>เวลา: {receiptData.date.split(' ')[1] || '00:00'} น.</span>
                            </div>
                            <div className="flex justify-between">
                                <span>พนักงาน: Cashier</span>
                                <span>จำนวน: 1 ท่าน</span>
                            </div>
                        </div>

                        <div className="text-center font-bold">{paperSize === '58mm' ? '-----------------------------' : '----------------------------------------'}</div>
                        <table className="w-full text-left font-bold">
                            <thead>
                                <tr className="font-bold border-b border-black">
                                    <th className="w-[50%] py-1">รายการ (Item)</th>
                                    <th className="text-center py-1">จำนวน</th>
                                    <th className="text-right py-1">{paperSize === '58mm' ? 'หน่วย' : 'ราคา/หน่วย'}</th>
                                    <th className="text-right py-1">รวม (Sub)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan={4} className="text-center font-bold">{paperSize === '58mm' ? '-----------------------------' : '----------------------------------------'}</td>
                                </tr>
                                 {(receiptData.items || []).map((item, i) => {
                                     const displayName = item.nameTh && item.nameTh !== item.name ? `${item.name} (${item.nameTh})` : item.name;
                                     return (
                                         <React.Fragment key={i}>
                                             <tr className="align-top border-b border-gray-200">
                                                 <td className="pr-1 whitespace-pre-wrap py-1">
                                                     <div className="font-bold">{i + 1}. {displayName}</div>
                                                     {((item.selectedToppings?.length || 0) > 0 || (item.subItems?.length || 0) > 0) && (
                                                         <div className="pl-3 text-[9.5px] text-black mt-1 space-y-0.5">
                                                             {item.selectedToppings?.map(t => {
                                                                 const toppingName = t.nameTh && t.nameTh !== t.name ? `${t.name} (${t.nameTh})` : t.name;
                                                                 return (
                                                                     <div key={t.id} className="font-black">
                                                                         * [เพิ่ม/ADD] {toppingName} (+{t.price}.-)
                                                                     </div>
                                                                 );
                                                             })}
                                                             {item.subItems?.map((s, sIdx) => {
                                                                 const comboItemName = s.nameTh && s.nameTh !== s.name ? `${s.name} (${s.nameTh})` : s.name;
                                                                 return (
                                                                     <div key={sIdx} className="pl-1 font-extrabold text-[9px]">
                                                                         ↳ [เซ็ต/COMBO] {comboItemName}
                                                                         {s.toppings?.length > 0 && (
                                                                             <div className="pl-3 text-[8.5px] font-bold text-gray-750 italic">
                                                                                 {s.toppings.map(t => {
                                                                                     const toppingName = t.nameTh && t.nameTh !== t.name ? `${t.name} (${t.nameTh})` : t.name;
                                                                                     return `+ ${toppingName}`;
                                                                                 }).join(', ')}
                                                                             </div>
                                                                         )}
                                                                     </div>
                                                                 );
                                                             })}
                                                         </div>
                                                     )}
                                                     {item.specialInstructions && (
                                                         <div className="mt-1 pl-2 border-l border-black text-[9px] font-black bg-gray-100 p-1">
                                                             !!! [พิเศษ/REQUEST] : "{item.specialInstructions}" !!!
                                                         </div>
                                                     )}
                                                 </td>
                                                 <td className="text-center font-bold py-1">{item.quantity}</td>
                                                 <td className="text-right py-1">{(item.totalPrice/item.quantity).toFixed(0)}.-</td>
                                                 <td className="text-right font-bold py-1">{item.totalPrice.toFixed(0)}.-</td>
                                             </tr>
                                         </React.Fragment>
                                     );
                                 })}
                             </tbody>
                        </table>
                        
                        {receiptData.note && (
                            <div className="my-2 p-1.5 border border-black text-black">
                                <div className="text-[9.5px] font-black">📝 หมายเหตุออเดอร์ (ORDER NOTE):</div>
                                <div className="text-[10px] font-bold mt-0.5">"{receiptData.note}"</div>
                            </div>
                        )}
                        
                        <div className="text-center font-bold">{paperSize === '58mm' ? '-----------------------------' : '----------------------------------------'}</div>

                        <div className="px-1 mt-1 font-bold">
                            {vatEnabled ? (
                                <>
                                    <div className="flex justify-between">
                                        <span>มูลค่าก่อนภาษี (Subtotal Ex. VAT)</span>
                                        <span>{receiptData.subtotal.toFixed(2)}.-</span>
                                    </div>
                                    <div className="flex justify-between mt-0.5">
                                        <span>ภาษีมูลค่าเพิ่ม 7% (VAT 7%)</span>
                                        <span>{receiptData.vat.toFixed(2)}.-</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-between">
                                    <span>ราคารวมสินค้า (Items Total)</span>
                                    <span>{(receiptData.total - (receiptData.deliveryFee && receiptData.deliveryFee !== 'pending' ? Number(receiptData.deliveryFee) : 0)).toFixed(0)}.-</span>
                                </div>
                            )}
                            {receiptData.deliveryFee && receiptData.deliveryFee !== 'pending' && (
                                <div className="flex justify-between mt-1 text-[10px]">
                                    <span>ค่าจัดส่ง (Delivery)</span>
                                    <span>{Number(receiptData.deliveryFee).toFixed(0)}.-</span>
                                </div>
                            )}
                            <div className="flex justify-between text-[13px] mt-1">
                                <span>ยอดสุทธิ (Total)</span>
                                <span>{receiptData.total.toFixed(0)}.-</span>
                            </div>
                        </div>

                        <div className="text-center font-bold mt-1">{paperSize === '58mm' ? '-----------------------------' : '----------------------------------------'}</div>
                        <div className="text-center mt-2 mb-2 font-bold px-1">
                            <div className="mb-2 text-[10px]">({receiptData.total} บาทถ้วน)</div>
                            
                            {!receiptData.isPaid && (
                                <div className="my-2 flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50" style={{ border: '1px dashed gray' }}>
                                    <div className="text-[9px] font-black mb-1.5 text-center text-black">
                                        สแกนจ่ายเงินผ่าน THAI QR / PROMPTPAY
                                    </div>
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                                            generatePromptPayPayload(
                                                storeSettings.promptPayNumber || "0-9949-7919-9",
                                                receiptData.total
                                            )
                                        )}`} 
                                        alt="PromptPay QR Code" 
                                        className="w-32 h-32 border border-gray-350 p-1 bg-white rounded mx-auto"
                                    />
                                    <div className="text-[8px] mt-1 text-center font-bold text-gray-700">
                                        PromptPay: {storeSettings.promptPayNumber || "0-9949-7919-9"}
                                    </div>
                                </div>
                            )}

                            <div>ขอบคุณที่ใช้บริการ / Thank You</div>
                        </div>
                        <div className="text-center font-bold">{paperSize === '58mm' ? '=============================' : '========================================'}</div>
                    </div>
                )}
            </div>

            {/* --- MOBILE HEADER --- */}
            <div className="lg:hidden bg-gray-900 text-white p-3 flex justify-between items-center z-30 shadow-md shrink-0 h-14 print:hidden">
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
            <aside className="hidden lg:flex w-24 bg-gray-900 flex-col items-center py-6 text-gray-400 z-10 shadow-xl justify-between shrink-0 print:hidden font-sans">
                <div className="flex flex-col items-center gap-6 w-full">
                    <div className="mb-2 relative group cursor-pointer">
                        {shopLogo ? <img src={shopLogo} alt="Logo" className="w-14 h-14 rounded-full object-cover border-2 border-brand-500" /> : <div className="bg-brand-600 p-3 rounded-xl text-white shadow-lg shadow-brand-500/50"><DollarSign size={28} /></div>}
                         <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLogoUpload}/>
                    </div>
                    <button onClick={() => { playClickSound(); setActiveTab('order'); }} className={`p-4 rounded-2xl transition w-16 h-16 flex items-center justify-center ${activeTab === 'order' ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-gray-800'}`} title="New Order"><ShoppingBag size={28} /></button>
                    <button onClick={() => { playClickSound(); setActiveTab('tables'); }} className={`p-4 rounded-2xl transition relative w-16 h-16 flex items-center justify-center ${activeTab === 'tables' ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-gray-800'}`} title="Active Orders"><Layers size={28} />{activeTables.length > 0 && <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}</button>
                    <button onClick={() => { playClickSound(); setActiveTab('sales'); }} className={`p-4 rounded-2xl transition w-16 h-16 flex items-center justify-center ${activeTab === 'sales' ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-gray-800'}`} title="Reports"><PieChart size={28} /></button>
                    <button onClick={() => { playClickSound(); setActiveTab('qr_gen'); }} className={`p-4 rounded-2xl transition w-16 h-16 flex items-center justify-center ${activeTab === 'qr_gen' ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-gray-800'}`} title="QR Generator"><QrCode size={28} /></button>
                    <button onClick={() => { playClickSound(); setActiveTab('partners'); }} className={`p-4 rounded-2xl transition w-16 h-16 flex items-center justify-center ${activeTab === 'partners' ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-gray-800'}`} title="Partner Referral Shares"><Store size={28} /></button>
                     <button onClick={() => { playClickSound(); setActiveTab('manage'); }} className={`p-4 rounded-2xl transition w-16 h-16 flex items-center justify-center ${activeTab === 'manage' ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-gray-800'}`} title="Store Settings"><Settings size={28} /></button>
                </div>
                <div className="flex flex-col items-center gap-4 w-full">
                    {/* SYSTEM SOUND TOGGLE CONTROLLER */}
                    <button 
                        onClick={toggleSound} 
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 border cursor-pointer ${soundEnabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-800 text-gray-500 border-gray-700/50'}`} 
                        title={soundEnabled ? 'Mute Sound Alerts' : 'Unmute Sound Alerts'}
                    >
                        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                    <button onClick={() => { playClickSound(); toggleLanguage(); }} className="text-xs font-bold bg-gray-800 text-gray-300 w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-700 active:scale-95 transition">{language.toUpperCase()}</button>
                    <button onClick={() => { playAlertSound(); adminLogout(); }} className="p-4 text-red-400 hover:bg-gray-800 rounded-xl transition cursor-pointer" title="Logout"><LogOut size={28} /></button>
                </div>
            </aside>
            
            {/* --- MOBILE BOTTOM NAV --- */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-gray-900 border-t border-gray-800 flex justify-around items-center z-50 px-2 print:hidden font-sans">
                <button onClick={() => { playClickSound(); setActiveTab('order'); setShowMobileCart(false); }} className={`flex flex-col items-center gap-1 ${activeTab === 'order' && !showMobileCart ? 'text-brand-500' : 'text-gray-400'}`}><ShoppingBag size={20}/><span className="text-[10px] font-bold">Order</span></button>
                 <button onClick={() => { playClickSound(); setActiveTab('tables'); setShowMobileCart(false); }} className={`flex flex-col items-center gap-1 relative ${activeTab === 'tables' ? 'text-brand-500' : 'text-gray-400'}`}><Layers size={20}/>{activeTables.length > 0 && <span className="absolute top-0 right-3 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}<span className="text-[10px] font-bold">Active</span></button>
                <div className="relative -top-5"><button onClick={() => { playClickSound(); setShowMobileCart(!showMobileCart); }} className="bg-brand-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center border-4 border-gray-900">{showMobileCart ? <X size={24}/> : (<><ShoppingBag size={24}/>{cart.length > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cart.reduce((s,i)=>s+i.quantity,0)}</span>}</>)}</button></div>
                <button onClick={() => { playClickSound(); setActiveTab('qr_gen'); setShowMobileCart(false); }} className={`flex flex-col items-center gap-1 ${activeTab === 'qr_gen' ? 'text-brand-500' : 'text-gray-400'}`}><QrCode size={20}/><span className="text-[10px] font-bold">QR</span></button>
                <button onClick={() => { playClickSound(); setActiveTab('partners'); setShowMobileCart(false); }} className={`flex flex-col items-center gap-1 ${activeTab === 'partners' ? 'text-brand-500' : 'text-gray-400'}`}><Store size={20}/><span className="text-[10px] font-bold">Partners</span></button>
                <button onClick={() => { playClickSound(); setActiveTab('manage'); setShowMobileCart(false); }} className={`flex flex-col items-center gap-1 ${activeTab === 'manage' ? 'text-brand-500' : 'text-gray-400'}`}><Settings size={20}/><span className="text-[10px] font-bold">Settings</span></button>
            </div>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex overflow-hidden relative print:hidden">
                {activeTab === 'order' && (
                    <>
                        <div className={`flex-1 flex flex-col h-full bg-gray-100 relative ${showMobileCart ? 'hidden lg:flex' : 'flex'}`}>
                            <div className="bg-white px-4 py-3 shadow-sm border-b shrink-0 overflow-x-auto no-scrollbar flex items-center gap-2">
                                <button onClick={() => setIsEditMode(!isEditMode)} className={`hidden lg:flex p-3 rounded-xl items-center gap-2 mr-2 transition ${isEditMode ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}><Edit2 size={20}/> <span className="text-sm font-bold">{isEditMode ? 'Editing' : 'Order'}</span></button>
                                {CATEGORIES.map(cat => (<button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`whitespace-nowrap px-6 py-3 rounded-xl text-base font-bold transition ${activeCategory === cat.id ? 'bg-brand-600 text-white shadow-md scale-105' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{language === 'th' ? cat.labelTh : cat.label}</button>))}
                                {isEditMode && <button onClick={handleOpenAddModal} className="whitespace-nowrap px-4 py-3 rounded-xl text-sm font-bold bg-green-500 text-white flex items-center gap-1 shadow hover:bg-green-600 ml-auto"><Plus size={18}/> New Item</button>}
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {filteredMenu.map(item => {
                                        const localized = getLocalizedItem(item);
                                        return (
                                            <div key={item.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col transition h-full group ${!item.available ? 'opacity-60 grayscale' : ''} ${isEditMode ? 'hover:border-blue-400' : 'hover:border-brand-400 cursor-pointer active:scale-95'}`}>
                                                <div className="relative aspect-square overflow-hidden" onClick={() => !isEditMode && handleCustomize(item)}>
                                                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-500"/>
                                                    
                                                    {/* Promo Badge Tag */}
                                                    {(() => {
                                                        const activeBadge = language === 'th' ? (item.badgeTh || item.badge) : (item.badge || item.badgeTh);
                                                        return activeBadge ? (
                                                            <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white font-black text-[10px] uppercase tracking-wider py-1 px-2 rounded-lg shadow-md animate-pulse">
                                                                {activeBadge}
                                                            </div>
                                                        ) : null;
                                                    })()}

                                                    {!item.available && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">SOLD OUT</div>}
                                                    {isEditMode && (
                                                        <div className="absolute top-2 right-2 flex flex-wrap gap-1 max-w-[125px] justify-end z-20">
                                                            <button onClick={(e) => { e.stopPropagation(); handleMoveMenuItem(item.id, 'up'); }} className="bg-gray-800 text-white p-1.5 rounded-lg shadow hover:bg-black" title="Move Up"><ChevronUp size={14}/></button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleMoveMenuItem(item.id, 'down'); }} className="bg-gray-800 text-white p-1.5 rounded-lg shadow hover:bg-black" title="Move Down"><ChevronDown size={14}/></button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleEditMenuItem(item); }} className="bg-blue-500 text-white p-1.5 rounded-lg shadow hover:bg-blue-600" title="Edit"><Edit2 size={14}/></button>
                                                            <button onClick={(e) => { e.stopPropagation(); togglePizzaAvailability(item.id); }} className={`p-1.5 rounded-lg shadow text-white ${item.available ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`} title="Toggle Availability"><Power size={14}/></button>
                                                            <button onClick={(e) => { e.stopPropagation(); toggleBestSeller(item.id); }} className={`p-1.5 rounded-lg shadow text-white ${item.isBestSeller ? 'bg-yellow-400' : 'bg-gray-400'}`} title="Mark Bestseller"><Star size={14} fill="currentColor"/></button>
                                                            {item.id !== 'p_half_half' && item.id !== 'custom_base' && (
                                                                <button onClick={async (e) => { 
                                                                    e.stopPropagation(); 
                                                                    if (confirm(language === 'th' ? `คุณแน่ใจหรือไม่ที่จะลบเมนู "${getLocalizedItem(item).name}" ออกจากระบบ?` : `Are you sure you want to permanently delete "${getLocalizedItem(item).name}"?`)) {
                                                                        await deletePizza(item.id);
                                                                    }
                                                                }} className="bg-red-600 text-white p-1.5 rounded-lg shadow hover:bg-red-700" title="Delete"><Trash2 size={14}/></button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4 flex flex-col flex-1" onClick={() => !isEditMode && handleCustomize(item)}>
                                                    <h3 className="font-bold text-gray-800 text-base md:text-lg leading-tight mb-1">{localized.name}</h3>
                                                    <div className="mt-auto flex justify-between items-center pt-2">
                                                        <span className="font-bold text-brand-600 text-base md:text-lg">
                                                            {item.id === 'p_half_half' ? (language === 'th' ? 'เลือก 2 หน้า' : 'Select halves') : `฿${item.basePrice}`}
                                                        </span>
                                                        {!isEditMode && (
                                                            <button 
                                                                onClick={(e) => handleDirectAddToCart(e, item)}
                                                                className="bg-brand-50 text-brand-600 p-2 rounded-lg hover:bg-brand-600 hover:text-white transition cursor-pointer"
                                                                title={language === 'th' ? 'สั่งทันที' : 'Add Direct'}
                                                            >
                                                                <Plus size={24}/>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className={`w-full lg:w-96 bg-white border-l shadow-xl flex flex-col fixed lg:relative inset-0 lg:inset-auto transition-transform duration-300 ${showMobileCart ? 'translate-y-0 z-[60] lg:z-40' : 'translate-y-full lg:translate-y-0 z-40'}`}>
                            <div className="lg:hidden p-4 bg-gray-900 text-white flex justify-between items-center"><h2 className="font-bold text-lg flex items-center gap-2"><ShoppingBag/> Current Order</h2><button onClick={() => setShowMobileCart(false)} className="bg-white/20 p-2 rounded-full"><X size={20}/></button></div>
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                                {cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50"><ShoppingBag size={64} className="mb-4"/><p className="font-bold text-xl">No items yet</p></div> : <div className="space-y-3">{cart.map(item => (<div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group active:bg-gray-50"><div className="flex justify-between items-start mb-2 cursor-pointer" onClick={() => handleEditCartItem(item)}><div className="pr-6"><h4 className="font-bold text-gray-800 text-base">{item.name}</h4>{item.specialInstructions && <div className="text-xs text-red-500 font-bold mt-1 bg-red-50 inline-block px-1 rounded">Note: {item.specialInstructions}</div>}<p className="text-xs text-gray-500 leading-tight mt-1">{(item.selectedToppings || []).map(t => t.name).join(', ')}{(item.subItems || []).filter(Boolean).map(s => `+ ${s.name}`).join(', ')}</p></div><div className="font-bold text-gray-900 text-base">฿{item.totalPrice}</div></div><div className="flex items-center justify-between mt-3"><div className="flex items-center bg-gray-100 rounded-lg p-1"><button onClick={() => item.quantity > 1 ? updateCartItemQuantity(item.id, -1) : removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white rounded-md shadow-sm transition"><Minus size={16}/></button><span className="w-10 text-center font-bold text-base">{item.quantity}</span><button onClick={() => updateCartItemQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white rounded-md shadow-sm transition"><Plus size={16}/></button></div><button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={20}/></button></div></div>))}</div>}
                            </div>
                            <div className="p-4 bg-white border-t space-y-3 pb-24 lg:pb-4">
                                <div className="grid grid-cols-2 gap-2"><input type="text" placeholder="Table No. / Name" className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base font-bold focus:border-brand-500 outline-none w-full" value={tableNumber} onChange={e => setTableNumber(e.target.value)}/><select className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base font-bold focus:border-brand-500 outline-none w-full" value={orderSource} onChange={e => setOrderSource(e.target.value as OrderSource)}><option value="store">In-Store</option><option value="grab">Grab</option><option value="lineman">Lineman</option><option value="robinhood">Robinhood</option><option value="foodpanda">Foodpanda</option><option value="shopeefood">ShopeeFood</option><option value="other">Other / อื่นๆ</option></select></div>
                                {orderSource !== 'store' && (
                                    <div className="w-full"><input type="text" placeholder={`${orderSource.toUpperCase()} Order No.`} className="border-2 border-brand-200 rounded-xl px-4 py-3 text-base font-bold focus:border-brand-500 outline-none w-full bg-brand-50" value={deliveryPlatformRef} onChange={e => setDeliveryPlatformRef(e.target.value)}/></div>
                                )}
                                <div className="space-y-1.5 pt-1.5 border-t border-gray-100">
                                    <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                        <span>{language === 'th' ? 'ภาษี 7% (VAT Toggle):' : '7% VAT (VAT Toggle):'}</span>
                                        <button 
                                            onClick={() => setVatEnabled(!vatEnabled)} 
                                            className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${vatEnabled ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
                                        >
                                            {vatEnabled ? (language === 'th' ? 'เปิดใช้งาน / ON' : 'ON') : (language === 'th' ? 'ปิดการใช้งาน / OFF' : 'OFF')}
                                        </button>
                                    </div>
                                    {vatEnabled && cartTotal > 0 && (
                                        <>
                                            <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                                                <span>{language === 'th' ? 'ก่อนภาษี (Ex. VAT)' : 'Before VAT (Ex. VAT)'}</span>
                                                <span>฿{(cartTotal - (cartTotal * 7 / 107)).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                                                <span>{language === 'th' ? 'ภาษีมูลค่าเพิ่ม (VAT 7%)' : 'Value Added Tax (VAT 7%)'}</span>
                                                <span>฿{(cartTotal * 7 / 107).toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex justify-between items-center text-2xl font-black text-gray-950 pt-1">
                                        <span>Total</span>
                                        <span>฿{cartTotal}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3"><button onClick={handleSendToKitchen} disabled={cart.length === 0} className="py-4 rounded-xl font-bold text-lg bg-yellow-400 text-yellow-900 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow">Kitchen</button><button onClick={handleCheckBill} disabled={cart.length === 0} className="py-4 rounded-xl font-bold text-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow">Pay Now</button></div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'tables' && (
                    <div className="flex-1 bg-gray-100 p-6 overflow-y-auto pb-24 lg:pb-6">
                        <div className="max-w-7xl mx-auto">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Layers className="text-brand-600"/> Active Orders & Tables</h2>
                            {activeTables.length === 0 ? <div className="flex flex-col items-center justify-center h-64 text-gray-400"><Layers size={64} className="mb-4 opacity-20"/><p className="text-xl font-bold">No active orders</p><button onClick={() => setActiveTab('order')} className="mt-4 text-brand-600 hover:underline font-bold">Start New Order</button></div> : 
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">{activeTables.map(order => {
                                    try {
                                        if (!order || !order.id) {
                                            throw new Error("Invalid or missing order data");
                                        }
                                        return (
                                            <div key={order.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col relative group hover:border-brand-300 transition">
                                                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                                                    <div>
                                                        <div className="text-xs text-gray-500 font-bold uppercase mb-1">Order #{String(order.id).slice(-4)}</div>
                                                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                                            {order.tableNumber ? (
                                                                <span className="bg-gray-800 text-white px-3 py-1 rounded-lg text-lg">Table {order.tableNumber}</span>
                                                            ) : (
                                                                <span className="bg-brand-600 text-white px-3 py-1 rounded-lg text-lg uppercase flex items-center gap-1">
                                                                    {order.type === 'delivery' ? <Bike size={16}/> : <ShoppingBag size={16}/>}
                                                                    {order.type}
                                                                </span>
                                                            )}
                                                        </h3>
                                                        {/* Date & Time of Order Creation */}
                                                        <div className="text-xs font-bold text-brand-600 mt-2 flex items-center gap-1 bg-brand-50/50 px-2 py-1 rounded-lg border border-brand-100 w-fit">
                                                            <Clock size={12}/>
                                                            <span>{formatOrderDateTime(order.createdAt, 'short')}</span>
                                                        </div>
                                                        {/* Customer Name for Non-Table Orders */}
                                                        {!order.tableNumber && (
                                                            <div className="text-sm font-bold text-gray-600 mt-1.5 flex items-center gap-1">
                                                                <User size={14}/> {order.customerName}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-brand-600">฿{order.totalAmount}</div>
                                                        <div className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded mt-1 inline-block border border-red-100">UNPAID</div>
                                                    </div>
                                                </div>
                                                <div className="p-4 flex-1">
                                                    <div className="text-sm text-gray-600 space-y-2 max-h-48 overflow-y-auto">
                                                        {(order.items || []).filter(Boolean).map((item, i) => (
                                                            <div key={i} className="flex justify-between border-b border-gray-100 pb-1">
                                                                <span className="font-bold">{item.quantity}x {item.name}</span>
                                                                <span className="font-bold text-gray-800">฿{item.totalPrice}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {order.note && <div className="mt-2 text-xs italic text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-100">Note: {order.note}</div>}
                                                    {order.type === 'delivery' && (
                                                        <div className="mt-3 space-y-2 bg-blue-50 p-3 rounded-xl border border-blue-100 shadow-sm animate-fade-in">
                                                            <div className="flex justify-between items-center pb-2 border-b border-blue-100/40">
                                                                <span className="text-sm font-bold text-blue-800">Delivery Fee: {order.deliveryFee === 'pending' ? 'TBD' : `฿${order.deliveryFee}`}</span>
                                                                <button onClick={() => handleUpdateDeliveryFee(order)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 font-bold shadow-sm">Update Fee</button>
                                                            </div>
                                                            
                                                            {/* Decoded delivery address annotations */}
                                                            <div className="text-xs space-y-2 pt-2 pb-1">
                                                                <div className="flex justify-between items-start">
                                                                    <span className="font-bold text-gray-700">ที่อยู่จัดส่ง:</span>
                                                                    <button 
                                                                        onClick={() => {
                                                                            const cleanAddress = (order.deliveryAddress || '')
                                                                                .replace(/\[Phone: .*?\]/g, '')
                                                                                .replace(/\[GPS Pin: .*?\]/g, '')
                                                                                .replace(/\[Google Maps Link: .*?\]/g, '')
                                                                                .trim();
                                                                            navigator.clipboard.writeText(cleanAddress);
                                                                            alert('คัดลอกที่อยู่แล้ว!');
                                                                        }}
                                                                        className="text-brand-600 hover:text-brand-800 underline active:text-brand-500 whitespace-nowrap ml-2"
                                                                    >
                                                                        คัดลอก
                                                                    </button>
                                                                </div>
                                                                <p className="text-gray-600 leading-relaxed bg-white p-2 rounded border border-blue-100/50">
                                                                    {(order.deliveryAddress || '')
                                                                        .replace(/\[Phone: .*?\]/g, '')
                                                                        .replace(/\[GPS Pin: .*?\]/g, '')
                                                                        .replace(/\[Google Maps Link: .*?\]/g, '')
                                                                        .trim()
                                                                    }
                                                                </p>
                                                                
                                                                {parseDeliveryPhone(order.deliveryAddress) && (
                                                                    <div className="flex items-center justify-between font-sans font-bold text-gray-700 border-t border-dashed border-blue-100 pt-2">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Phone size={13} className="text-blue-600 shrink-0"/>
                                                                            <span>เบอร์โทร:</span>
                                                                        </div>
                                                                        <a href={`tel:${parseDeliveryPhone(order.deliveryAddress)}`} className="text-blue-600 underline">
                                                                            {parseDeliveryPhone(order.deliveryAddress)}
                                                                        </a>
                                                                    </div>
                                                                )}
                                                                {parseGPSCoordinates(order.deliveryAddress) && (
                                                                    <div className="flex items-center justify-between gap-1.5 font-bold pt-2 border-t border-dashed border-blue-100">
                                                                        <div className="flex items-center gap-1.5 text-gray-750">
                                                                            <MapPin size={13} className="text-red-500 animate-pulse shrink-0"/>
                                                                            <span>ระยะทาง: {
                                                                                (() => {
                                                                                    const coords = parseGPSCoordinates(order.deliveryAddress);
                                                                                    if (!coords) return '?';
                                                                                    const storeGps = storeSettings.storeLocationGps || "13.9239103,100.5220632";
                                                                                    const storeCoords = parseAnyMapLink(storeGps) || { lat: 13.9239103, lng: 100.5220632 };
                                                                                    const sLat = storeCoords.lat;
                                                                                    const sLng = storeCoords.lng;
                                                                                    return calculateDistanceKm(sLat, sLng, coords.lat, coords.lng).toFixed(2);
                                                                                })()
                                                                            } กม.</span>
                                                                        </div>
                                                                        <a 
                                                                            href={parseGPSCoordinates(order.deliveryAddress)?.url} 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer" 
                                                                            className="text-[10px] bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 rounded-lg font-extrabold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                                                                        >
                                                                            <Globe size={11}/> เปิด Google Maps
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {order.source !== 'store' && (
                                                        <div className="mt-2 flex justify-between items-center bg-orange-50 p-2 rounded border border-orange-100">
                                                            <span className="text-sm font-bold text-orange-800">GP Deduction</span>
                                                            <button onClick={() => handleUpdateGPDeduction(order)} className="text-xs bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 font-bold shadow-sm">Edit GP</button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4 border-t bg-gray-50 space-y-2.5">
                                                    {(order.status === 'pending' || order.status === 'confirmed') && (
                                                        <button onClick={() => handleConfirmPaymentAndCook(order.id)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition text-base">
                                                            <CheckCircle size={18}/> {language === 'th' ? 'ยืนยันรับเงิน & เริ่มทำเลย' : 'Confirm Payment & Cook'}
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleCheckTableBill(order)} className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition text-base"><Receipt size={18}/> Check Bill & Print</button>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <button onClick={() => handleReprintOrder(order)} className="bg-amber-100 hover:bg-amber-200 text-amber-800 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95" title="Print Receipt">
                                                            <Printer size={12}/> Print
                                                        </button>
                                                        <button onClick={() => handleCloseTable(order.id)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95" title="Force Complete">
                                                            <Check size={12}/> Clear
                                                        </button>
                                                        <button onClick={() => handleCancelTable(order.id)} className="bg-red-100 hover:bg-red-200 text-red-700 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95" title="Cancel Order">
                                                            <X size={12}/> Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    } catch (e: any) {
                                        console.error("Error rendering order card:", order, e);
                                        return (
                                            <div key={order?.id || Math.random().toString()} className="bg-red-50 p-5 rounded-2xl border-2 border-dashed border-red-200 shadow-sm flex flex-col justify-between text-left h-full min-h-[300px]">
                                                <div className="space-y-2">
                                                    <div className="text-xs uppercase font-extrabold text-red-500">❌ Error Loading Order</div>
                                                    <h4 className="font-extrabold text-[#7c2d12] text-sm truncate">ID: {order?.id || 'Unknown'}</h4>
                                                    <p className="text-xs text-red-900 font-mono leading-relaxed bg-white p-3 rounded-xl border border-red-100 overflow-y-auto max-h-36">
                                                        {e?.message || String(e)}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={async () => {
                                                        if (order?.id && window.confirm(language === 'th' ? `ลบออเดอร์ที่เสียหายรหัส #${order.id} หรือไม่?` : `Remove corrupted order record #${order.id}?`)) {
                                                            await deleteOrder(order.id);
                                                        }
                                                    }}
                                                    className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs shadow transition active:scale-95 cursor-pointer text-center"
                                                >
                                                    {language === 'th' ? '🗑️ ลบข้อมูลเสียหายนี้' : '🗑️ Remove Corrupted Record'}
                                                </button>
                                            </div>
                                        );
                                    }
                                })}</div>
                            }
                        </div>
                    </div>
                )}

                {activeTab === 'sales' && (() => {
                    const filteredOrders = (orders || []).filter(o => o && filterByDate(o.createdAt, salesFilter));
                    const filteredExpenses = (expenses || []).filter(e => e && filterByDate(e.date, salesFilter));
                    const totalSales = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                    const netSales = filteredOrders.reduce((sum, o) => sum + (o.netAmount || o.totalAmount || 0), 0);
                    const totalExpensesValue = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
                    
                    return (
                        <div className="flex-1 bg-gray-100 p-6 overflow-y-auto pb-24 lg:pb-6">
                            <div className="max-w-7xl mx-auto space-y-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800"><PieChart className="text-brand-600"/> Reports & History</h2>
                                
                                {/* Filters */}
                                <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                    <div className="flex gap-2">
                                        {(['day', 'month', 'year', 'all'] as const).map(f => (
                                            <button key={f} onClick={() => setSalesFilter(f)} className={`px-4 py-2 rounded-lg font-bold transition capitalize ${salesFilter === f ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                                {f === 'day' ? 'Today' : f}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => downloadCSV(filteredOrders.map(o => ({ ID: o.id, Status: o.status, Amount: o.totalAmount, Items: (o.items || []).length })), 'sales_export.csv')} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-sm flex items-center gap-2"><Download size={18}/> Export CSV</button>
                                </div>

                                {/* KPIs */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"><p className="text-sm font-bold text-gray-500 uppercase mb-2">Total Sales</p><p className="text-3xl font-bold text-gray-900">฿{totalSales.toLocaleString()}</p></div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"><p className="text-sm font-bold text-gray-500 uppercase mb-2">Total Orders</p><p className="text-3xl font-bold text-gray-900">{filteredOrders.length}</p></div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"><p className="text-sm font-bold text-gray-500 uppercase mb-2">Net Sales (After GP)</p><p className="text-3xl font-bold text-brand-600">฿{netSales.toLocaleString()}</p></div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"><p className="text-sm font-bold text-gray-500 uppercase mb-2">Total Expenses</p><p className="text-3xl font-bold text-orange-500">฿{totalExpensesValue.toLocaleString()}</p></div>
                                </div>

                                {/* Order History Table */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center"><h3 className="font-bold text-gray-800 text-lg">Order History</h3></div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-100">
                                                <tr><th className="p-4">Date & Time (เวลาไทย)</th><th className="p-4">Order ID</th><th className="p-4">Source</th><th className="p-4">Status</th><th className="p-4">Amount(Total)</th><th className="p-4 text-orange-500">Net(After GP)</th><th className="p-4 text-right">Actions</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {[...filteredOrders].reverse().map(order => (
                                                    <tr key={order.id} className="hover:bg-gray-50">
                                                        <td className="p-4 text-gray-600 font-medium">
                                                            {formatOrderDateTime(order.createdAt, 'medium')}
                                                        </td>
                                                        <td className="p-4 font-bold text-gray-800">#{String(order.id).slice(-4)} {order.tableNumber && `(TB: ${order.tableNumber})`}</td>
                                                        <td className="p-4"><span className="uppercase text-[10px] font-bold bg-gray-200 px-2 py-1 rounded text-gray-700">{order.source}</span></td>
                                                        <td className="p-4">
                                                            <span className={`uppercase text-[10px] font-bold px-2 py-1 rounded ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 font-bold text-gray-600">฿{order.totalAmount}</td>
                                                        <td className="p-4 font-bold text-brand-600">฿{order.netAmount || order.totalAmount}</td>
                                                        <td className="p-4 text-right flex justify-end gap-1.5 flex-wrap">
                                                            <button onClick={() => handleStartEditOrder(order)} className="text-blue-700 hover:underline font-bold text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition">แก้ไข (Edit)</button>
                                                            <button onClick={() => handleDeleteOrderPrompt(order)} className="text-red-700 hover:underline font-bold text-xs bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition">ลบ (Delete)</button>
                                                            {order.source !== 'store' && (
                                                                <button onClick={() => handleUpdateGPDeduction(order)} className="text-orange-600 hover:underline font-bold text-xs bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded transition">Edit GP</button>
                                                            )}
                                                            <button onClick={() => handleReprintOrder(order)} className="text-amber-700 hover:underline font-bold text-xs bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded flex items-center gap-1 transition"><Printer size={12}/> Print</button>
                                                            <button onClick={() => { setSelectedOrder(order); setShowPaymentModal(true); }} className="text-brand-600 hover:underline font-bold text-xs bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded transition">Receipt</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredOrders.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400 font-bold">No orders found for this period.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {activeTab === 'qr_gen' && (
                    <div className="flex-1 bg-gray-100 p-6 overflow-y-auto pb-24 lg:pb-6">
                        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><QrCode className="text-brand-600"/> QR Generator</h2>
                            <div className="flex flex-col lg:flex-row gap-8">
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="text-sm font-bold text-gray-500 uppercase">Base URL</label>
                                        <input type="text" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-700 focus:border-brand-500 outline-none mt-1" value={qrBaseUrl} onChange={e => setQrBaseUrl(e.target.value)} />
                                    </div>
                                    <div>
                                         <label className="text-sm font-bold text-gray-500 uppercase">Table Number</label>
                                         <input type="text" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-700 focus:border-brand-500 outline-none mt-1" value={qrTableNum} onChange={e => setQrTableNum(e.target.value)} placeholder="e.g. 5" />
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2 p-3 bg-gray-50 rounded-xl leading-relaxed">
                                         This tool generates a QR code pre-filled with the table number. Customers scanning this QR will automatically be assigned this table number during order placement.
                                    </div>
                                </div>
                                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 min-w-[250px]">
                                     {qrBaseUrl && qrTableNum ? (
                                         <>
                                             <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getCleanQrUrl() + '?table=' + qrTableNum)}`} alt="QR Code" className="w-48 h-48 mix-blend-multiply border border-gray-200 p-2 bg-white rounded-xl shadow-sm" />
                                             <div className="mt-4 font-bold text-lg text-brand-600 text-center uppercase">Table {qrTableNum}</div>
                                             <button className="mt-6 bg-brand-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-brand-700 w-full shadow flex items-center justify-center gap-2" onClick={handlePrintQrCard}><Printer size={18}/> Print QR Card</button>
                                         </>
                                     ) : (
                                         <div className="text-gray-400 font-bold text-center">Enter Base URL & Table Number</div>
                                     )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'partners' && (
                    <div className="flex-1 bg-gray-100 p-6 overflow-y-auto pb-24 lg:pb-6 font-sans">
                        <div className="max-w-5xl mx-auto space-y-6">
                            
                            {/* Header Summary */}
                            <div className="bg-gradient-to-r from-brand-600 to-indigo-600 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2"><Store/> {language === 'th' ? 'ระบบพันธมิตรร้านใกล้เคียง' : 'Partner Referral Ecosystem'}</h2>
                                    <p className="text-white/85 text-sm mt-1">
                                        {language === 'th' 
                                            ? 'สร้างคิวอาร์โค้ดให้ร้านค้าผู้แนะนำรอบๆ ร้าน และแบ่งเปอร์เซ็นต์ส่วนแบ่งตามยอดขายจริง' 
                                            : 'Generate referral QR codes for nearby partner stores and distribute dynamic commission splits of actual order volumes.'}
                                    </p>
                                </div>
                                <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/20 text-left">
                                    <div className="text-xs text-white/70 font-semibold">{language === 'th' ? 'จำนวนพันธมิตรทั้งหมด' : 'Total Active Partners'}</div>
                                    <div className="text-2xl font-black">{partners?.length || 0} {language === 'th' ? 'ร้านค้า' : 'Stores'}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                
                                {/* Form: Add Partner */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-fit text-left">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3 border-gray-100 text-left">
                                        <Plus className="text-emerald-500" size={20}/> 
                                        {language === 'th' ? 'เพิ่มพันธมิตรใหม่' : 'Register New Partner'}
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="text-left">
                                            <label className="text-xs font-bold text-gray-400 uppercase block mb-1">
                                                {language === 'th' ? 'ชื่อร้านค้า / พันธมิตร' : 'Partner Store Name'}
                                            </label>
                                            <input 
                                                type="text" 
                                                className="w-full border border-gray-250 rounded-xl px-4 py-3 font-bold text-gray-700 focus:border-brand-500 outline-none text-sm bg-white"
                                                placeholder="e.g. Welltech Printer, Coffee Shop"
                                                value={newPartnerName}
                                                onChange={e => setNewPartnerName(e.target.value)}
                                            />
                                        </div>
                                        <div className="text-left">
                                            <label className="text-xs font-bold text-gray-400 uppercase block mb-1">
                                                {language === 'th' ? 'อัตราส่วนแบ่ง (%) จากยอดขาย' : 'Commission Share Rate (%)'}
                                            </label>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    max="100"
                                                    className="w-full border border-gray-250 rounded-xl pl-4 pr-10 py-3 font-bold text-gray-700 focus:border-brand-500 outline-none text-sm bg-white"
                                                    value={newPartnerComm}
                                                    onChange={e => setNewPartnerComm(parseFloat(e.target.value) || 0)}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-gray-400">%</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                if (!newPartnerName.trim()) {
                                                    alert(language === 'th' ? 'กรุณากรอกชื่อร้านค้าพันธมิตร' : 'Please input a partner name!');
                                                    return;
                                                }
                                                addPartner({
                                                    id: 'partner_' + Date.now(),
                                                    name: newPartnerName,
                                                    commissionPercent: newPartnerComm
                                                });
                                                setNewPartnerName('');
                                                setNewPartnerComm(10);
                                                playSuccessFeedback();
                                            }}
                                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 text-sm cursor-pointer"
                                        >
                                            <Save size={16}/> {language === 'th' ? 'บันทึกพันธมิตร' : 'Create Partner Account'}
                                        </button>
                                    </div>
                                </div>

                                {/* List of Active Partners */}
                                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-left">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3 border-gray-100 text-left">
                                        <List className="text-brand-500" size={20}/>
                                        {language === 'th' ? 'รายชื่อและข้อมูลยอดส่วนแบ่ง' : 'Partners Sales & Splits Ledger'}
                                    </h3>

                                    {!partners || partners.length === 0 ? (
                                        <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center">
                                            <Store size={48} className="opacity-30 mb-2" />
                                            <p className="font-bold">{language === 'th' ? 'ยังไม่มีพันธมิตรถูกลงทะเบียน' : 'No partner accounts created yet'}</p>
                                            <p className="text-xs text-gray-400 mt-1">{language === 'th' ? 'คุณสามารถเพิ่มร้านใกล้เคียงได้ที่แบบฟอร์มด้านซ้าย' : 'Add partner details using the form on the left.'}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {partners.map(partner => {
                                                const partnerOrders = (orders || []).filter(o => o && o.partnerId === partner.id && o.status !== 'cancelled');
                                                const totalReferredSales = partnerOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                                                const commissionAmountPaid = partnerOrders.reduce((sum, o) => sum + (o.partnerCommissionAmount || 0), 0);
                                                const affiliateLink = window.location.origin + '?partner=' + partner.id;

                                                return (
                                                    <div key={partner.id} className="p-4 rounded-2xl border border-gray-150 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-brand-200 transition-all text-left">
                                                        <div className="space-y-1.5 flex-1 w-full text-left">
                                                            <div className="flex items-center gap-2 justify-between md:justify-start">
                                                                <span className="font-bold text-gray-800 text-lg">{partner.name}</span>
                                                                <span className="bg-brand-50 text-brand-655 font-black text-xs py-1 px-2.5 rounded-lg border border-brand-100">
                                                                    Split: {partner.commissionPercent}%
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 max-w-sm">
                                                                <div className="bg-white p-2.5 rounded-xl border border-gray-200 text-left">
                                                                    <div className="text-[10px] uppercase font-bold text-gray-400">{language === 'th' ? 'ยอดขายแนะนำสำเร็จ' : 'Total Orders Value'}</div>
                                                                    <div className="text-base font-black text-gray-800">฿{totalReferredSales.toLocaleString()} ({partnerOrders.length} ออเดอร์)</div>
                                                                </div>
                                                                <div className="bg-white p-2.5 rounded-xl border border-gray-200 text-left">
                                                                    <div className="text-[10px] uppercase font-bold text-amber-500">{language === 'th' ? 'ส่วนแบ่งคอมมิชชั่นสะสม' : 'Earned Commission'}</div>
                                                                    <div className="text-base font-black text-amber-600">฿{commissionAmountPaid.toLocaleString()}</div>
                                                                </div>
                                                            </div>
                                                            <div className="mt-2 flex items-center gap-1 bg-white p-2 rounded-xl border border-gray-250 w-full overflow-hidden">
                                                                <code className="text-[11px] font-mono text-gray-500 flex-1 truncate select-all">{affiliateLink}</code>
                                                                <button 
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(affiliateLink);
                                                                        alert(language === 'th' ? 'คัดลอกลิงก์ผู้แนะนำแล้ว!' : 'Referral URL copied to clipboard!');
                                                                    }}
                                                                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer shrink-0"
                                                                >
                                                                    Copy
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* QR Code and Actions */}
                                                        <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-gray-200 w-full md:w-auto shrink-0 md:min-w-[140px] text-center">
                                                            <img 
                                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(affiliateLink)}`} 
                                                                alt="Partner QR" 
                                                                className="w-24 h-24 p-1 mix-blend-multiply border border-gray-150 rounded" 
                                                            />
                                                            <button 
                                                                onClick={() => {
                                                                    const pWindow = window.open('', '_blank');
                                                                    if (pWindow) {
                                                                        pWindow.document.write(`
                                                                            <html>
                                                                                <head>
                                                                                    <title>Print QR for ${partner.name}</title>
                                                                                    <style>
                                                                                        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fff; }
                                                                                        .card { border: 4px solid #db2777; border-radius: 24px; padding: 40px; text-align: center; max-width: 400px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
                                                                                        h1 { font-size: 24px; color: #111827; margin-bottom: 8px; }
                                                                                        p { font-size: 14px; color: #4b5563; margin-bottom: 24px; }
                                                                                        img { width: 250px; height: 250px; margin-bottom: 24px; }
                                                                                        .footer { font-size: 12px; color: #9ca3af; font-weight: bold; text-transform: uppercase; }
                                                                                    </style>
                                                                                </head>
                                                                                <body>
                                                                                    <div class="card">
                                                                                        <h1>Scan & Order Here!</h1>
                                                                                        <p>Welcome! Our menu is sponsored by ${partner.name}. Select food and complete payment instantly.</p>
                                                                                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(affiliateLink)}" />
                                                                                        <div class="footer">Referral Code: ${partner.name}</div>
                                                                                    </div>
                                                                                    <script>window.onload=function(){setTimeout(function(){window.print();},500);}</script>
                                                                                </body>
                                                                            </html>
                                                                        `);
                                                                        pWindow.document.close();
                                                                    }
                                                                }}
                                                                className="mt-2 text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <Printer size={12}/> {language === 'th' ? 'พิมพ์ป้ายคิวอาร์' : 'Print QR Sign'}
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    if (confirm(language === 'th' ? `ลบพันธมิตร "${partner.name}" หรือไม่?` : `Remove partner "${partner.name}"?`)) {
                                                                        deletePartner(partner.id);
                                                                    }
                                                                }}
                                                                className="mt-2 text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                                                            >
                                                                {language === 'th' ? 'ลบบัญชีพันธมิตร' : 'Delete Partner'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'manage' && (
                    <div className="flex-1 bg-gray-100 p-6 overflow-y-auto pb-24 lg:pb-6">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800"><Settings className="text-brand-600"/> Store Settings & Management</h2>
                            {/* Contact Info Settings */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-lg text-gray-800 mb-4 border-b border-gray-100 pb-2 flex items-center gap-2"><Phone size={20} className="text-brand-500"/> Connect & Links (Footer)</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                     <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Contact Phone</label>
                                        <input type="text" className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 mt-1 font-bold text-gray-700 focus:border-brand-500 outline-none" value={contactForm.contactPhone} onChange={e => setContactForm({...contactForm, contactPhone: e.target.value})} />
                                     </div>
                                     <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">PromptPay Number</label>
                                        <input type="text" className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 mt-1 font-bold text-gray-700 focus:border-brand-500 outline-none" value={contactForm.promptPayNumber} onChange={e => setContactForm({...contactForm, promptPayNumber: e.target.value})} />
                                     </div>
                                     <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Facebook URL</label>
                                        <input type="text" className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 mt-1 font-bold text-gray-700 focus:border-brand-500 outline-none" value={contactForm.facebookUrl} onChange={e => setContactForm({...contactForm, facebookUrl: e.target.value})} />
                                     </div>
                                     <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Line URL</label>
                                        <input type="text" className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 mt-1 font-bold text-gray-700 focus:border-brand-500 outline-none" value={contactForm.lineUrl} onChange={e => setContactForm({...contactForm, lineUrl: e.target.value})} />
                                     </div>
                                </div>
                                <button onClick={() => { updateStoreSettings(contactForm); alert("Contact Settings Saved!"); }} className="mt-4 bg-gray-800 text-white font-bold py-2 px-6 rounded-xl hover:bg-gray-900 shadow transition w-full lg:w-auto">Save Contact Settings</button>
                            </div>

                            {/* Delivery Settings */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-lg text-gray-800 mb-4 border-b border-gray-100 pb-2 flex items-center gap-2"><MapPin size={20} className="text-brand-500"/> Delivery & Location Settings</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Store GPS Location (Lat,Lng)</label>
                                        <input type="text" className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 mt-1 font-bold text-gray-700 focus:border-brand-500 outline-none" value={deliveryForm.storeLocationGps} onChange={e => setDeliveryForm({...deliveryForm, storeLocationGps: e.target.value})} placeholder="e.g. 13.9239103,100.5220632" />
                                     </div>
                                     <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Free Delivery Radius (KM)</label>
                                        <input type="number" step="0.1" className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 mt-1 font-bold text-gray-700 focus:border-brand-500 outline-none" value={deliveryForm.freeDeliveryRadiusKm} onChange={e => setDeliveryForm({...deliveryForm, freeDeliveryRadiusKm: Number(e.target.value)})} />
                                     </div>
                                     <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Delivery Fee Per KM (฿)</label>
                                        <input type="number" className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 mt-1 font-bold text-gray-700 focus:border-brand-500 outline-none" value={deliveryForm.deliveryFeePerKm} onChange={e => setDeliveryForm({...deliveryForm, deliveryFeePerKm: Number(e.target.value)})} />
                                     </div>
                                     <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Base Delivery Fee (฿)</label>
                                        <input type="number" className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 mt-1 font-bold text-gray-700 focus:border-brand-500 outline-none" value={deliveryForm.baseDeliveryFee} onChange={e => setDeliveryForm({...deliveryForm, baseDeliveryFee: Number(e.target.value)})} />
                                     </div>
                                </div>
                                <button onClick={async () => { 
                                    let resolvedGps = deliveryForm.storeLocationGps;
                                    if (resolvedGps.includes('maps.app.goo.gl') || resolvedGps.includes('goo.gl/maps')) {
                                        try {
                                            const res = await fetch('/api/resolve-link', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ url: resolvedGps })
                                            });
                                            const data = await res.json();
                                            if (data && data.targetUrl) {
                                                resolvedGps = data.targetUrl;
                                            }
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    }
                                    // Parse to exact lat/lng string if it's a URL
                                    const coords = parseAnyMapLink(resolvedGps);
                                    if (coords) {
                                        resolvedGps = `${coords.lat},${coords.lng}`;
                                        setDeliveryForm({...deliveryForm, storeLocationGps: resolvedGps});
                                    }
                                    
                                    await updateStoreSettings({...deliveryForm, storeLocationGps: resolvedGps}); 
                                    alert("Delivery Settings Saved!"); 
                                }} className="mt-4 bg-gray-800 text-white font-bold py-2 px-6 rounded-xl hover:bg-gray-900 shadow transition w-full lg:w-auto">Save Delivery Settings</button>
                            </div>

                            {/* Printer Settings */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-lg text-gray-800 mb-4 border-b border-gray-100 pb-2 flex items-center gap-2"><Printer size={20} className="text-brand-500"/> {language === 'th' ? 'ตั้งค่าความกว้างกระดาษเครื่องพิมพ์' : 'Printer & Paper Width Settings'}</h3>
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500">
                                        {language === 'th' ? 'เลือกความกว้างกระดาษเครื่องพิมพ์ความร้อนที่คุณใช้อยู่ เพื่อจัดสัดส่วนใบเสร็จให้สวยงาม ไม่ตกขอบกระดาษ' : 'Choose your physical thermal printer paper width so that receipt formats align perfectly without margins clipping.'}
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 font-sans">
                                        <button 
                                            key="btn-58"
                                            onClick={() => setPaperSize('58mm')} 
                                            className={`py-4 px-4 rounded-xl font-bold flex flex-col items-center justify-center border-2 transition cursor-pointer ${paperSize === '58mm' ? 'border-brand-600 bg-brand-50 text-brand-600 shadow' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'}`}
                                        >
                                            <span className="text-lg">58 mm</span>
                                            <span className="text-xs font-normal opacity-75 mt-1">{language === 'th' ? 'เครื่องขนาดเล็ก / พกพา' : 'Small / Portable Thermal'}</span>
                                        </button>
                                        <button 
                                            key="btn-80"
                                            onClick={() => setPaperSize('80mm')} 
                                            className={`py-4 px-4 rounded-xl font-bold flex flex-col items-center justify-center border-2 transition cursor-pointer ${paperSize === '80mm' ? 'border-brand-600 bg-brand-50 text-brand-600 shadow' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'}`}
                                        >
                                            <span className="text-lg">80 mm</span>
                                            <span className="text-xs font-normal opacity-75 mt-1">{language === 'th' ? 'เครื่องตั้งโต๊ะมาตรฐาน' : 'Standard Desktop Thermal'}</span>
                                        </button>
                                    </div>

                                    {/* Advanced Customizations for Receipt Layout */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-150">
                                        <div>
                                            <label className="text-xs font-bold text-gray-600 block mb-1.5 flex items-center gap-1">
                                                <span>🔎 {language === 'th' ? 'ขนาดอักษรใบเสร็จ (Font Size):' : 'Receipt Font Size:'}</span>
                                                <span className="font-extrabold text-brand-600">{receiptFontSize}px</span>
                                            </label>
                                            <div className="grid grid-cols-5 gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
                                                {[10, 11, 12, 14, 16].map((sz) => (
                                                    <button
                                                        type="button"
                                                        key={`fs-${sz}`}
                                                        onClick={() => setReceiptFontSize(sz)}
                                                        className={`py-1 text-xs font-bold rounded-lg transition cursor-pointer ${receiptFontSize === sz ? 'bg-white text-brand-600 shadow border border-gray-200' : 'text-gray-500 hover:text-gray-800'}`}
                                                    >
                                                        {sz}px
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-600 block mb-1.5 flex items-center gap-1">
                                                <span>📐 {language === 'th' ? 'ระยะขอบข้างใบเสร็จ (Margin):' : 'Receipt Margins:'}</span>
                                                <span className="font-extrabold text-brand-600">{receiptPadding}mm</span>
                                            </label>
                                            <div className="grid grid-cols-5 gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
                                                {[0, 1, 2, 4, 6].map((pd) => (
                                                    <button
                                                        type="button"
                                                        key={`pad-${pd}`}
                                                        onClick={() => setReceiptPadding(pd)}
                                                        className={`py-1 text-xs font-bold rounded-lg transition cursor-pointer ${receiptPadding === pd ? 'bg-white text-brand-600 shadow border border-gray-200' : 'text-gray-500 hover:text-gray-800'}`}
                                                    >
                                                        {pd}mm
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center text-sm gap-4">
                                        <div className="flex flex-col gap-3 w-full">
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => setAutoPrintNewOrders(!autoPrintNewOrders)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer leading-tight transition shrink-0 ${autoPrintNewOrders ? 'bg-amber-100/80 text-amber-800 border border-amber-300' : 'bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-200'}`}
                                                >
                                                    {autoPrintNewOrders ? 'AUTOPRINT: ON' : 'AUTOPRINT: OFF'}
                                                </button>
                                                <span className="text-xs text-gray-400 font-bold block max-w-xl">{language === 'th' ? 'สั่งพิมพ์บิลใบเสร็จและใบจัดส่งทันทีเมื่อได้รับออเดอร์หรือชำระเงิน' : 'Prints bills, delivery receipts, and tickets instantly.'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 border-t border-gray-50 pt-2">
                                                <button 
                                                    onClick={() => setVatEnabled(!vatEnabled)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer leading-tight transition shrink-0 ${vatEnabled ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-2 ring-emerald-50' : 'bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-200'}`}
                                                >
                                                    {vatEnabled ? (language === 'th' ? 'ภาษีมูลค่าเพิ่ม (VAT 7%): ON' : 'VAT 7% DISPLAY: ON') : (language === 'th' ? 'ภาษีมูลค่าเพิ่ม (VAT 7%): OFF' : 'VAT 7% DISPLAY: OFF')}
                                                </button>
                                                <span className="text-xs text-gray-400 font-bold block max-w-xl">
                                                    {language === 'th' 
                                                        ? 'เปิด/ปิดการคำนวณและแสดงแจกแจงภาษีมูลค่าเพิ่ม 7% (รวมในราคาสินค้าแล้ว ไม่บวกเพิ่มจากราคาหน้า POS) บนใบเสร็จ' 
                                                        : 'Toggle display of 7% Value Added Tax calculated from existing prices (VAT inclusive, no extra charges added on top) on printed bills.'}
                                                </span>
                                            </div>
                                        </div>
                                        <button onClick={() => { window.print(); }} className="text-brand-600 font-bold hover:underline py-1.5 px-4 bg-brand-50 hover:bg-brand-100 rounded-xl transition self-end md:self-center shrink-0">{language === 'th' ? '🖨️ ทดสอบสั่งพิมพ์' : '🖨️ Try Printing Test'}</button>
                                    </div>
                                    
                                    <div className="mt-6 pt-6 border-t border-gray-150 space-y-4">
                                        <h4 className="font-extrabold text-sm text-gray-800 flex items-center gap-1.5 uppercase">
                                            📶 {language === 'th' ? 'ตั้งค่าการเชื่อมต่อเครื่องพิมพ์ Wi-Fi / IP Printer' : 'Wi-Fi / IP Printer Connection Setup'}
                                        </h4>
                                        <p className="text-xs text-gray-400">
                                            {language === 'th' 
                                                ? 'กำหนดหมายเลขไอพีเครื่องพิมพ์ที่แชร์บนวงเครือข่าย Wi-Fi ท้องถิ่นของคุณ เพื่อความสะดวกและยืดหยุ่นในการสับเปลี่ยนเครือข่ายในอนาคต' 
                                                : 'Define the physical printer IP address on your local network/Wi-Fi to ensure rapid access and seamless future printer swaps.'}
                                        </p>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 block mb-1">
                                                    {language === 'th' ? 'หมายเลข IP เครื่องพิมพ์ (Printer IP Address)' : 'Printer IP Address'}
                                                </label>
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        value={printerIpAddress} 
                                                        onChange={(e) => setPrinterIpAddress(e.target.value)}
                                                        placeholder="เช่น 192.168.1.255"
                                                        className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-xl font-mono font-bold text-gray-800 focus:border-brand-500 outline-none transition"
                                                    />
                                                    <span className="absolute left-3 top-2.5 text-gray-400 text-xs font-black">IP:</span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-gray-500 block mb-1">
                                                    {language === 'th' ? 'พอร์ตเชื่อมต่อ (Connection Port)' : 'Connection Port'}
                                                </label>
                                                <input 
                                                    type="number" 
                                                    value={printerPort} 
                                                    onChange={(e) => setPrinterPort(Number(e.target.value))}
                                                    placeholder="9100"
                                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl font-mono font-bold text-gray-800 focus:border-brand-500 outline-none transition"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 block mb-1">
                                                    {language === 'th' ? 'วิธีการสั่งพิมพ์ (Printing Mode)' : 'Printing Mode'}
                                                </label>
                                                <select
                                                    value={printerType}
                                                    onChange={(e) => setPrinterType(e.target.value as any)}
                                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl font-bold text-gray-800 bg-white focus:border-brand-500 outline-none transition"
                                                >
                                                    <option value="system">🖥️ {language === 'th' ? 'System Print (แนะนำเสถียรที่สุด)' : 'System Print (Recommended)'}</option>
                                                    <option value="bluetooth">🔵 {language === 'th' ? 'Bluetooth Direct Printer001 (สำหรับเครื่อง Welltech G5)' : 'Bluetooth Direct Printer001 (Welltech G5)'}</option>
                                                    <option value="rawbt">📱 {language === 'th' ? 'RawBT App / Android WiFi' : 'RawBT Companion App (Android)'}</option>
                                                    <option value="local_proxy">🔌 {language === 'th' ? 'Direct Local Network Proxy' : 'Local Network Proxy/Bridge'}</option>
                                                </select>
                                            </div>

                                            <div className="flex items-end">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        alert(language === 'th' 
                                                            ? `💾 บันทึกค่าการเชื่อมต่อเครื่องพิมพ์ ${printerIpAddress}:${printerPort} (โหมด: ${printerType}) เรียบร้อยแล้ว!` 
                                                            : `💾 Wi-Fi Printer configuration saved! Target: ${printerIpAddress}:${printerPort}`);
                                                    }}
                                                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-4 rounded-xl shadow transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 text-xs h-10"
                                                >
                                                    💾 {language === 'th' ? 'บันทึกการตั้งค่าเครื่องปริ้นเตอร์' : 'Save Printer Preferences'}
                                                </button>
                                            </div>
                                        </div>

                                        {printerType === 'bluetooth' && (
                                            <div className="p-4 rounded-2xl bg-brand-50/50 border border-brand-200 space-y-3 animate-fade-in text-left">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-1.5 font-bold text-brand-900 text-sm">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
                                                        <span>{language === 'th' ? 'สเตตัสการเชื่อมต่อบลูทูธ (Bluetooth Printer001)' : 'Bluetooth Thermal Printer Status'}</span>
                                                    </div>
                                                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
                                                        btStatus === 'connected' ? 'bg-emerald-100 text-emerald-800' :
                                                        btStatus === 'connecting' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                                        'bg-gray-200 text-gray-700'
                                                    }`}>
                                                        {btStatus}
                                                    </span>
                                                </div>

                                                <div className="text-xs text-gray-500 font-sans leading-relaxed">
                                                    {language === 'th' 
                                                        ? 'กดเชื่อมต่อบลูทูธด้านล่างเพื่อจับคู่โปรแกรมหน้าเว็บ POS กับเครื่องพิมพ์ Welltech G5 (Printer001) ของคุณโดยตรง' 
                                                        : 'Pair your browser environment directly with your Welltech G5 (Printer001) thermal printer below.'}
                                                </div>

                                                {btDevice && (
                                                    <div className="text-xs font-mono bg-white p-3 rounded-xl border border-brand-100 space-y-1 animate-fade-in">
                                                        <div>🔧 <strong>Device Name:</strong> {btDevice.name || 'Printer001'}</div>
                                                        <div>📶 <strong>ID:</strong> {btDevice.id || 'N/A'}</div>
                                                        <div>🔋 <strong>GATT Server:</strong> Connected</div>
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    {btStatus !== 'connected' ? (
                                                        <button 
                                                            type="button"
                                                            onClick={connectBluetoothPrinter}
                                                            className="flex-1 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-sm transition-all"
                                                        >
                                                            🔗 {btStatus === 'connecting' ? 'กำลังเชื่อมต่อ...' : 'ค้นหา & เชื่อมต่อเครื่องพิมพ์'}
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button 
                                                                type="button"
                                                                onClick={async () => {
                                                                    const testPayload = {
                                                                        storeName: "Pizza Damac Nonthaburi",
                                                                        address: "TEST PRINT SUCCESSFUL",
                                                                        phone: "099-497-9199",
                                                                        queueNo: "Printer001 TEST",
                                                                        date: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
                                                                        items: [{ name: "Test Pizza Margherita", quantity: 1, totalPrice: 0 }],
                                                                        total: 0,
                                                                        paymentMethod: "BLUETOOTH FEED"
                                                                    };
                                                                    try {
                                                                        const bytes = generateEscPosData(testPayload, language);
                                                                        await writeBtInChunks(btCharacteristic, bytes);
                                                                        alert("🎉 ส่งใบทดสอบสำเร็จกรุณาดูที่เครื่องพิมพ์!");
                                                                    } catch (err: any) {
                                                                        alert("❌ ไม่สามารถพิมพ์ได้: " + err.message);
                                                                    }
                                                                }}
                                                                className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold py-2.5 rounded-xl text-xs hover:shadow transition-all"
                                                            >
                                                                📝 ทดสอบพิมพ์ใบเสร็จ
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                onClick={disconnectBluetoothPrinter}
                                                                className="flex-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold py-2.5 rounded-xl text-xs hover:shadow transition-all"
                                                            >
                                                                ❌ ตัดการเชื่อมต่อบลูทูธ
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Dynamic System Instructions Guide Box */}
                                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900 space-y-3.5">
                                            <h5 className="font-black text-amber-950 text-sm flex items-center gap-1.5">
                                                🖨️ {language === 'th' ? 'คู่มือตั้งค่าและเชื่อมต่อเครื่องพิมพ์ Welltech รุ่น Wi-Fi' : 'How to Setup Welltech Wi-Fi Printer'}
                                            </h5>
                                            
                                            {language === 'th' ? (
                                                <div className="space-y-3 text-[11.5px] leading-relaxed">
                                                    <p className="font-medium text-amber-900">
                                                        เครื่องพิมพ์ความร้อนแบรนด์ <strong className="font-extrabold text-[#d97706]">Welltech</strong> ใช้การเชื่อมต่อแบบมาตรฐาน ESC/POS ผ่านพอร์ต <strong className="font-extrabold text-blue-700">9100</strong> หากท่านยังเชื่อมต่อไม่ได้ กรุณาทำตาม 4 ขั้นตอนสำคัญนี้ครับ:
                                                    </p>
                                                    
                                                    <div className="space-y-2.5">
                                                        <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                                                            <strong className="text-amber-950 font-black block mb-1">ขั้นตอนที่ 1: ตรวจหาไอพีจริงของ Welltech (พิมพ์ใบทดสอบ Self-Test)</strong>
                                                            <p className="text-gray-650 text-[11px]">
                                                                หมายเลข <span className="font-bold underline text-red-600">192.168.1.255</span> เป็นเพียงไอพีบรอดแคสต์ (Broadcast Address) เครื่องจริงของท่านจะมีไอพีเฉพาะของมันเอง ให้หาวิธีพิมพ์ใบข้อมูลดังนี้:
                                                            </p>
                                                            <ol className="list-decimal list-inside mt-1.5 space-y-0.5 text-gray-700">
                                                                <li><span className="font-bold">ปิดสวิตช์เครื่องปริ้นเตอร์</span>ด้านหลังหรือด้านข้าง</li>
                                                                <li>ใช้มือกดปุ่ม <span className="font-bold bg-gray-100 px-1 rounded border">FEED</span> ค้างไว้ (ห้ามปล่อยมือ)</li>
                                                                <li><span className="font-bold">เปิดสวิตช์เปิดเครื่อง</span> ในขณะที่ยังกดปุ่ม FEED ค้างอยู่</li>
                                                                <li>ค้างไว้ 3 วินาทีจนเครื่องดังสั้นๆ หรือเริ่มดึงกระดาษ แล้วจึง<span className="font-bold text-brand-600">ปล่อยปุ่ม FEED</span></li>
                                                                <li>เครื่องพิมพ์จะพิมพ์กระดาษรายงานออกมาเป็นภาษาอังกฤษ ให้มองหาคำว่า <strong className="text-blue-700 font-mono">"IP Address: 192.168.1.xxx"</strong> (ตัวเลข 3 ตัวหลังจะไม่ใช่ 255 เช่น 192.168.1.100 หรือ 192.168.1.199)</li>
                                                            </ol>
                                                        </div>

                                                        <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                                                            <strong className="text-amber-950 font-black block mb-1">ขั้นตอนที่ 2: ตั้งค่าเชื่อมต่อ Wi-Fi ในอุปกรณ์</strong>
                                                            <p className="text-gray-650 text-[11px]">
                                                                อุปกรณ์ที่เปิดโปรแกรมนี้ (เช่น คอมพิวเตอร์ โทรศัพท์มือถือ แท็บเล็ต หรือ iPad ที่ใช้กดสั่งออเดอร์) <strong className="text-[#9a3412]">จะต้องเชื่อมต่อสัญญาณ Wi-Fi ตัวเดียวกันกับที่ต่อกับเครื่องพิมพ์ Welltech</strong> หากต่อคนละตัวกัน จะไม่สามารถพิมพ์สลิปและค้นหากันเจอได้ครับ
                                                            </p>
                                                        </div>

                                                        <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                                                            <strong className="text-amber-950 font-black block mb-1">ขั้นตอนที่ 3: กรอกไอพีและบันทึกค่าลงระบบ</strong>
                                                            <p className="text-gray-650 text-[11px]">
                                                                นำหมายเลข IP จริงที่ได้จากขั้นตอนที่ 1 (เช่น 192.168.1.199) มากอกลงในช่อง <strong className="text-brand-600">"หมายเลข IP เครื่องพิมพ์"</strong> ด้านข้างบนนี้ แล้วกด <span className="font-bold text-gray-800">"บันทึกการตั้งค่าเครื่องปริ้นเตอร์"</span>
                                                            </p>
                                                        </div>

                                                        <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                                                            <strong className="text-amber-950 font-black block mb-1">ขั้นตอนที่ 4: สั่งพิมพ์ออเดอร์ผ่านแอปคู่ใจตามระบบปฏิบัติการ</strong>
                                                            <ul className="list-disc list-inside mt-1 space-y-1 text-gray-750">
                                                                <li>
                                                                    <strong className="text-blue-700">ระบบแอนดรอยด์ (Android Phone/Tablet):</strong> แนะนำให้ใช้ <strong className="text-brand-600">RawBT Print Service</strong> บน Google Play Store ตั้งค่าในแอป RawBT ให้เชื่อมต่อแบบ "Network/WiFi" ใส่ IP ของเครื่อง Welltech แล้วลองสั่งพิมพ์ตามเมนูด้านบน จะดึงเข้าเครื่องปริ้นสดๆ ทันที
                                                                </li>
                                                                <li>
                                                                    <strong className="text-blue-700">ระบบวินโดวส์ (Windows PC):</strong> ไปที่ Devices and Printers → Add Printer → Add using TCP/IP address → กรอกไอพีของ Welltech แล้วเลือกไดรเวอร์ผู้ผลิต Welltech หรือเลือก "Generic / Text Only" จากนั้นกดสั่งพิมพ์ใบเสร็จในระบบได้ทันที
                                                                </li>
                                                                <li>
                                                                    <strong className="text-blue-700">ระบบ iOS (iPad/iPhone):</strong> หากเครื่องพิมพ์ไม่รองรับ AirPrint ให้ใช้แอปใน App Store เช่น "ESC/POS WiFi Print" ช่วยทำหน้าที่ส่ง IP ตรง
                                                                </li>
                                                            </ul>
                                                        </div>

                                                        <div className="bg-amber-100/50 p-3 rounded-xl border border-amber-200 mt-2 text-[11px] font-sans">
                                                            <strong className="text-amber-950 font-extrabold block mb-1">💡 ขั้นตอนที่ 5: การตั้งค่าขนาดหน้าต่างพิมพ์ (สิ่งสำคัญที่สุด)</strong>
                                                            <p className="text-gray-700 mb-1 leading-relaxed">เมื่อกด "ทดสอบสั่งพิมพ์" หรือ สั่งพิมพ์บนบิล จะปรากฏหน้าต่างเบราเซอร์ ให้ตรวจสอบการตั้งค่า 3 อย่างดังนี้เพื่อให้เข้าขนาด Welltech:</p>
                                                            <ul className="list-inside list-disc space-y-0.5 text-gray-700">
                                                                <li><strong>1. ขนาดกระดาษ (Paper size):</strong> ม้วน Welltech ให้เลือกขนาดเป็น <span className="text-brand-650 font-bold">"58mm x Roll"</span> หรือ <span className="text-brand-650 font-bold">"80mm x Roll"</span></li>
                                                                <li><strong>2. ระยะขอบ (Margins):</strong> สำคัญมาก! ปรับเป็น <span className="text-red-700 font-bold">"None" / "ไม่มี"</span> เพื่อแก้ปัญหาสลิปเยื้องหรือหดตัว</li>
                                                                <li><strong>3. หัว/ท้ายกระดาษ (Headers/Footers):</strong> ให้ <span className="font-bold text-red-700">ตีกถูกออก</span> เพื่อไม่ให้มีที่อยู่เว็บโผล่ในกระดาษ</li>
                                                                <li>ปรับขนาดตัวอักษร 🔎 และขอบข้าง 📐 ได้ด้วยปุ่มควิกคอนฟิกสีเขียวด้านบนนี้ได้เลยครับ</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3 leading-relaxed">
                                                    <p className="font-medium text-amber-900">
                                                        <strong className="font-extrabold text-[#d97706]">Welltech</strong> receipt printers are standard ESC/POS devices performing on Port <strong className="font-extrabold text-blue-700">9100</strong>. Follow these 4 easy steps to check your setup:
                                                    </p>
                                                    <ul className="list-decimal list-inside space-y-2 text-gray-705">
                                                        <li>
                                                            <strong className="text-amber-950 font-black">Find Welltech Real IP (Self-Test Slip):</strong> Turn off Welltech power switch. Press and hold physical <span className="font-mono bg-white inline-block px-1 rounded shadow-sm border text-[10px]">FEED</span> button, turn back on switch and hold <span className="font-mono bg-white inline-block px-1 rounded shadow-sm border text-[10px]">FEED</span> for 3 seconds until it prints. Read <span className="font-mono font-bold text-blue-700">"IP Address: 192.168.1.xxx"</span>. (Do not confuse it with broadcasts like .255).
                                                        </li>
                                                        <li>
                                                            <strong className="text-amber-950 font-black">Same Wi-Fi Network Required:</strong> Verify that your POS tablet/device is on the same local network subnet name.
                                                        </li>
                                                        <li>
                                                            <strong className="text-amber-950 font-black">Enter IP & Port:</strong> Save the acquired IP into the configuration bar above.
                                                        </li>
                                                        <li>
                                                            <strong className="text-amber-950 font-black">Device Spoolers:</strong> Install the standard <strong className="text-brand-650">RawBT Print Service</strong> (Android Play Store) or create a TCP/IP computer port pointing to Welltech inside Windows configurations for flawless automatic ticket output.
                                                        </li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            
{/* 1. Item Customization Modal / Add to Cart Modal */}
{selectedPizza && (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
        <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full">
            <div className="relative h-48 bg-gray-100 flex-shrink-0">
                <img src={selectedPizza.image} alt={selectedPizza.name} className="w-full h-full object-cover" />
                <button onClick={() => { setSelectedPizza(null); setComboSelections([]); }} className="absolute top-4 right-4 bg-white/50 backdrop-blur p-2 rounded-full hover:bg-white transition"><X size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
                <h2 className="text-2xl font-bold text-gray-800">{getLocalizedItem(selectedPizza).name}</h2>
                <div className="text-xl font-bold text-brand-600 mt-1 mb-4">฿{selectedPizza.basePrice}</div>
                <p className="text-sm text-gray-500 mb-6">{getLocalizedItem(selectedPizza).description}</p>
                
                {/* Combo Selector */}
                {selectedPizza.category === 'promotion' && (selectedPizza.comboCount || 0) > 0 ? (
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Utensils size={18}/> Select Your Items</h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {Array.from({ length: selectedPizza.comboCount }).map((_, idx) => (
                                <button key={idx} onClick={() => handleComboSlotClick(idx)} className={`p-4 border-2 rounded-xl text-left transition ${activeComboSlot === idx ? 'border-brand-500 bg-brand-50' : comboSelections[idx] ? 'border-green-500 bg-green-50' : 'border-dashed border-gray-300 hover:border-gray-400'}`}>
                                    <div className="text-sm font-bold text-gray-500 mb-1">Item {idx + 1}</div>
                                    <div className="font-bold text-gray-900">{comboSelections[idx]?.name || 'Tap to select'}</div>
                                </button>
                            ))}
                        </div>
                        
                        {activeComboSlot !== null && (
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-fade-in">
                                <div className="text-sm font-bold text-gray-800 mb-2">Options for Item {activeComboSlot + 1}:</div>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                    {menu.filter(m => !m.comboCount).map(m => { // Exclude combos from combo
                                        const promoBadge = language === 'th' ? (m.badgeTh || m.badge) : (m.badge || m.badgeTh);
                                        return (
                                            <button key={m.id} onClick={() => handleComboPizzaSelect(m)} className="text-left p-2.5 border rounded-lg bg-white hover:border-brand-300 flex flex-col justify-between gap-1 transition">
                                                <div className="text-sm font-bold text-gray-800 line-clamp-1 flex items-center justify-between w-full gap-1">
                                                    <span className="truncate">{language === 'th' && m.nameTh ? m.nameTh : m.name}</span>
                                                    {promoBadge && (
                                                        <span className="bg-gradient-to-r from-red-600 to-amber-500 text-white text-[8px] font-extrabold uppercase px-1 py-0.5 rounded shrink-0 animate-pulse">{promoBadge}</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-brand-600 font-bold">฿{m.basePrice}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}

                {/* Half-Half Selector (POS) */}
                {selectedPizza.id === 'p_half_half' && (
                    <div className="mb-6 bg-amber-50 p-4 rounded-xl border border-amber-200 text-left">
                        <h3 className="font-bold text-amber-950 mb-3 flex items-center gap-2">🌓 Select Two Halves</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1 text-left">Side A (First Half)</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-sm font-bold text-gray-800"
                                    value={halfA?.id || ''}
                                    onChange={(e) => setHalfA(menu.find(p => p.id === e.target.value) || null)}
                                >
                                    <option value="">-- Select Side A --</option>
                                    {menu.filter(p => p.category === 'pizza' && p.id !== 'custom_base' && p.id !== 'p_half_half' && p.available).map(pItem => (
                                        <option key={pItem.id} value={pItem.id}>
                                            {language === 'th' ? pItem.nameTh || pItem.name : pItem.name} (฿{pItem.basePrice})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1 text-left">Side B (Second Half)</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-sm font-bold text-gray-800"
                                    value={halfB?.id || ''}
                                    onChange={(e) => setHalfB(menu.find(p => p.id === e.target.value) || null)}
                                >
                                    <option value="">-- Select Side B --</option>
                                    {menu.filter(p => p.category === 'pizza' && p.id !== 'custom_base' && p.id !== 'p_half_half' && p.available).map(pItem => (
                                        <option key={pItem.id} value={pItem.id}>
                                            {language === 'th' ? pItem.nameTh || pItem.name : pItem.name} (฿{pItem.basePrice})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toppings (Only for non-combo items, though you can adapt logic as needed) */}
                {!(selectedPizza.category === 'promotion' && (selectedPizza.comboCount || 0) > 0) && (
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Layers size={18}/> Extra Options</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {toppings.filter(t => t.available).map(t => {
                                const isSelected = selectedToppings.some(st => st.id === t.id);
                                return (
                                    <button key={t.id} onClick={() => toggleTopping(t)} className={`w-full flex items-center justify-between p-3 border rounded-xl transition ${isSelected ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isSelected ? 'bg-brand-500 border-brand-500 text-white' : 'border-gray-300'}`}>
                                                {isSelected && <Check size={14}/>}
                                            </div>
                                            <span className="font-bold text-sm text-gray-700">{language === 'en' ? t.name : (t.nameTh || t.name)}</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-500">+฿{t.price}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
                
                {/* Note */}
                <div className="mb-6">
                    <h3 className="font-bold text-gray-800 mb-2">Special Instructions</h3>
                    <input type="text" placeholder="e.g., No onions, extra spicy" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-brand-500 outline-none" value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} />
                </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t flex items-center gap-4">
                <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1">
                    <button onClick={() => quantity > 1 && setQuantity(q => q - 1)} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg transition"><Minus size={18}/></button>
                    <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg transition"><Plus size={18}/></button>
                </div>
                <button 
                    onClick={(selectedPizza.category === 'promotion' && (selectedPizza.comboCount || 0) > 0) ? confirmAddComboToCart : confirmAddToCart} 
                    disabled={(selectedPizza.category === 'promotion' && (selectedPizza.comboCount || 0) > 0) ? comboSelections.filter(Boolean).length < selectedPizza.comboCount : false}
                    className="flex-1 bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-700 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed">
                    {editingCartItem ? 'Update Order' : 'Add to Order'} • ฿{
                        ((selectedPizza.id === 'p_half_half' 
                            ? (halfA && halfB ? Math.round((halfA.basePrice/2)+(halfB.basePrice/2)+20) : 20) 
                            : selectedPizza.basePrice) 
                        + selectedToppings.reduce((s,t)=>s+t.price,0)) * quantity
                    }
                </button>
            </div>
        </div>
    </div>
)}

{/* 2. Menu Item Editor Modal */}
{showItemModal && (
    <div className="fixed inset-0 z-50 bg-black/50 flex flex-col items-center justify-center p-4 print:hidden">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{itemForm.id ? 'Edit Menu Item' : 'New Menu Item'}</h2>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Name (EN)</label>
                        <input className="w-full border rounded-lg px-3 py-2" value={itemForm.name || ''} onChange={e => setItemForm({...itemForm, name: e.target.value})}/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Name (TH)</label>
                        <input className="w-full border rounded-lg px-3 py-2" value={itemForm.nameTh || ''} onChange={e => setItemForm({...itemForm, nameTh: e.target.value})}/>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Category</label>
                        <select className="w-full border rounded-lg px-3 py-2" value={itemForm.category || 'pizza'} onChange={e => setItemForm({...itemForm, category: e.target.value as ProductCategory})}>
                            {CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.label} / {cat.labelTh}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Base Price (฿)</label>
                        <input type="number" className="w-full border rounded-lg px-3 py-2" value={itemForm.basePrice || 0} onChange={e => setItemForm({...itemForm, basePrice: Number(e.target.value)})}/>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Promo Badge (EN) (e.g. New)</label>
                        <input className="w-full border rounded-lg px-3 py-2" placeholder="e.g. New, Promo" value={itemForm.badge || ''} onChange={e => setItemForm({...itemForm, badge: e.target.value})}/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">ป้ายโปรโมชั่น (TH)</label>
                        <input className="w-full border rounded-lg px-3 py-2" placeholder="เช่น เมนูใหม่, แนะนำ" value={itemForm.badgeTh || ''} onChange={e => setItemForm({...itemForm, badgeTh: e.target.value})}/>
                    </div>
                </div>
                
                {itemForm.category === 'promotion' && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Items allowed in Combo</label>
                        <input type="number" className="w-full border rounded-lg px-3 py-2" value={itemForm.comboCount || 2} onChange={e => setItemForm({...itemForm, comboCount: Number(e.target.value)})}/>
                    </div>
                )}
                
                <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 space-y-3">
                     <div>
                          <label className="block text-xs font-bold text-gray-750 mb-1">ตัวเลือกที่ 1: อัปโหลดไฟล์รูปภาพ (Upload File)</label>
                          <input 
                              type="file" 
                              accept="image/*" 
                              className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer" 
                              onChange={handleImageUpload}
                          />
                     </div>
                     <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold justify-center">
                          <span className="h-[1px] bg-gray-200 flex-1"></span>
                          <span>หรือ (OR)</span>
                          <span className="h-[1px] bg-gray-200 flex-1"></span>
                     </div>
                     <div>
                          <label className="block text-xs font-bold text-gray-750 mb-1 flex items-center justify-between">
                             <span>ตัวเลือกที่ 2: ระบุลิงก์รูปภาพ (Image URL)</span>
                             <span className="text-[10px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded font-semibold animate-pulse">รองรับ Google Drive!</span>
                          </label>
                          <input 
                              type="text"
                              placeholder="วางลิงก์รูปภาพทั่วไป หรือลิงก์แชร์จาก Google Drive..." 
                              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" 
                              value={itemForm.image || ''} 
                              onChange={e => {
                                  const val = e.target.value;
                                  const converted = convertGoogleDriveUrl(val);
                                  setItemForm({...itemForm, image: converted});
                              }}
                          />
                     </div>
                     {itemForm.image && (
                          <div className="flex flex-col items-center gap-2 pt-2 border-t border-gray-150">
                              <span className="text-xs font-bold text-gray-500">ภาพตัวอย่าง (Preview)</span>
                              {isDriveUrl(itemForm.image) && (
                                  <div className="text-green-700 text-xs font-bold flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 w-full justify-center">
                                      <span>✨ แปลงลิงก์ Google Drive สำเร็จ!</span>
                                  </div>
                              )}
                              {isPhotosUrl(itemForm.image) && (
                                  <div className="text-amber-800 text-xs font-sans p-3 rounded-lg border border-amber-250 bg-amber-50 w-full leading-relaxed space-y-1.5 text-left">
                                      <p className="font-bold flex items-center gap-1 text-amber-900">⚠️ ตรวจพบลิงก์อัลบั้ม Google Photos!</p>
                                      <p>ลิงก์ประเภทอัลบั้มแชร์จะไม่แสดงรูปภาพอ้างอิงของระบบ ให้แก้ไขดังนี้:</p>
                                      <ol className="list-decimal pl-4 space-y-1">
                                          <li>เปิดรูปภาพของคุณในแถบใหม่ของเบราว์เซอร์</li>
                                          <li>คลิกขวาที่ตัวรูปภาพ แล้วเลือกเมนู <span className="font-bold bg-white px-1 py-0.5 rounded shadow-xs border">"คัดลอกที่อยู่อิมเมจ" (Copy image address)</span></li>
                                          <li>ก๊อปปี้ลิงก์ตรงนั้น (ขึ้นต้นด้วย <span className="font-mono text-[10px] text-brand-700">https://lh3.googleusercontent.com/...</span>) มาวางแทนที่</li>
                                      </ol>
                                  </div>
                              )}
                              <img src={itemForm.image} className="w-36 h-36 object-cover rounded-xl border-2 border-brand-200 shadow-md bg-gray-100" />
                          </div>
                     )}
                </div>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-3">
                {itemForm.id && itemForm.id !== 'p_half_half' && itemForm.id !== 'custom_base' && (
                    <button 
                        onClick={async () => {
                            if (confirm(language === 'th' ? `คุณแน่ใจหรือไม่ที่จะลบเมนูนี้ออกจากระบบอย่างถาวร?` : 'Are you sure you want to permanently delete this menu item?')) {
                                await deletePizza(itemForm.id!);
                                setShowItemModal(false);
                            }
                        }} 
                        className="px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-650 flex items-center justify-center gap-1.5 shadow"
                        title="Delete permanently"
                    >
                        <Trash2 size={16}/>
                        <span className="text-sm">{language === 'th' ? 'ลบเมนู' : 'Delete'}</span>
                    </button>
                )}
                <button onClick={() => setShowItemModal(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 text-sm">Cancel</button>
                <button onClick={handleSaveItem} className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 text-sm">Save Item</button>
            </div>
        </div>
    </div>
)}

{/* 3. Add Topping Modal */}
{showToppingsModal && (
    <div className="fixed inset-0 z-50 bg-black/50 flex flex-col items-center justify-center p-4 print:hidden">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">{toppingForm.id ? 'Edit Topping Option' : 'New Topping Option'}</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Name (EN)</label>
                    <input className="w-full border rounded-lg px-3 py-2" value={toppingForm.name || ''} onChange={e => setToppingForm({...toppingForm, name: e.target.value})}/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Name (TH)</label>
                    <input className="w-full border rounded-lg px-3 py-2" value={toppingForm.nameTh || ''} onChange={e => setToppingForm({...toppingForm, nameTh: e.target.value})}/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Price Add-on (฿)</label>
                    <input type="number" className="w-full border rounded-lg px-3 py-2" value={toppingForm.price || 0} onChange={e => setToppingForm({...toppingForm, price: Number(e.target.value)})}/>
                </div>
            </div>
            <div className="mt-6 flex gap-3">
                <button onClick={() => setShowToppingsModal(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200">Cancel</button>
                <button onClick={handleSaveTopping} className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700">Save Topping</button>
            </div>
        </div>
    </div>
)}


            {showPaymentModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-0 lg:p-4 print:hidden">
                    {/* Updated Modal Container: Full Screen on Mobile/Tablet, Centered on Desktop */}
                    <div className="bg-white w-full h-full lg:h-[85vh] lg:max-w-4xl lg:rounded-2xl shadow-2xl flex flex-col lg:flex-row overflow-hidden animate-fade-in">
                        
                        {/* Order Summary Column */}
                        <div className="hidden lg:flex lg:w-1/2 bg-gray-50 border-r border-gray-200 p-6 flex-col">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800"><Receipt size={24}/> {selectedOrder ? `Bill for Table ${selectedOrder.tableNumber}` : 'Current Order'}</h2>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                                {((selectedOrder ? selectedOrder.items : cart) || []).map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                        <div>
                                            <div className="font-bold text-gray-800">{item.quantity}x {item.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {(item.selectedToppings || []).map(t => t.name).join(', ')}
                                                {(item.subItems || []).filter(Boolean).map(s => `+ ${s.name}`).join(', ')}
                                            </div>
                                        </div>
                                        <div className="font-bold text-gray-700">฿{item.totalPrice}</div>
                                    </div>
                                ))}
                            </div>
                            {selectedOrder && selectedOrder.type === 'delivery' && (
                                <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center text-sm font-bold text-gray-700">
                                    <span>Delivery Fee</span>
                                    <span>{selectedOrder.deliveryFee === 'pending' ? 'TBD' : `฿${selectedOrder.deliveryFee}`}</span>
                                </div>
                            )}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex justify-between items-center text-2xl font-bold text-gray-900">
                                    <span>Total Amount</span>
                                    <span>฿{selectedOrder ? selectedOrder.totalAmount : cartTotal}</span>
                                </div>
                                {selectedOrder && selectedOrder.deliveryFee === 'pending' && (
                                    <div className="text-xs text-red-500 font-bold mt-1 text-right">
                                        * Please update delivery fee before payment
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Action Column */}
                        <div className="w-full lg:w-1/2 p-4 lg:p-6 flex flex-col bg-white h-full">
                            <div className="flex justify-between items-center mb-4 lg:mb-6">
                                <div className="lg:hidden">
                                    <h3 className="font-bold text-lg text-gray-900">{selectedOrder ? `Table ${selectedOrder.tableNumber}` : 'Payment'}</h3>
                                    <p className="text-sm text-brand-600 font-bold">Total: ฿{selectedOrder ? selectedOrder.totalAmount : cartTotal}</p>
                                    {selectedOrder && selectedOrder.deliveryFee === 'pending' && (
                                        <p className="text-xs text-red-500 font-bold mt-1">* Update delivery fee first</p>
                                    )}
                                </div>
                                <h3 className="hidden lg:block font-bold text-lg text-gray-500 uppercase">Payment Method</h3>
                                <button onClick={() => setShowPaymentModal(false)} className="bg-gray-100 p-3 rounded-full hover:bg-gray-200"><X size={24}/></button>
                            </div>

                            {/* Method Selector */}
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                <button onClick={() => setPaymentMethod('cash')} className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition ${paymentMethod === 'cash' ? 'border-brand-500 bg-brand-50 text-brand-700 font-extrabold shadow-sm' : 'border-gray-100 text-gray-400 hover:border-gray-300'}`}>
                                    <Banknote size={24} className="lg:w-7 lg:h-7"/>
                                    <span className="font-bold text-xs lg:text-sm">CASH</span>
                                </button>
                                <button onClick={() => setPaymentMethod('qr_transfer')} className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition ${paymentMethod === 'qr_transfer' ? 'border-brand-500 bg-brand-50 text-brand-700 font-extrabold shadow-sm' : 'border-gray-100 text-gray-400 hover:border-gray-300'}`}>
                                    <QrCode size={24} className="lg:w-7 lg:h-7"/>
                                    <span className="font-bold text-xs lg:text-sm">SCAN QR</span>
                                </button>
                                <button onClick={() => setPaymentMethod('thai_chuay_thai')} className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition ${paymentMethod === 'thai_chuay_thai' ? 'border-sky-500 bg-sky-50 text-sky-750 font-extrabold shadow-sm' : 'border-gray-100 text-gray-400 hover:border-gray-300'}`}>
                                    <Sparkles size={24} className={`lg:w-7 lg:h-7 ${paymentMethod === 'thai_chuay_thai' ? 'text-sky-600 animate-pulse' : 'text-gray-400'}`}/>
                                    <span className="font-bold text-xs lg:text-sm whitespace-nowrap">ไทยช่วยไทย</span>
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 flex flex-col justify-center mb-4 min-h-[220px]">
                                {paymentMethod === 'cash' ? (
                                    <div className="space-y-4 animate-fade-in">
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Cash Received</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">฿</span>
                                                <input type="number" autoFocus className="w-full pl-10 pr-4 py-4 text-4xl font-bold border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none" value={cashReceived} onChange={e => setCashReceived(e.target.value)} placeholder="0"/>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <span className="font-bold text-gray-500 uppercase text-sm">Change</span>
                                            <span className={`text-4xl font-bold ${change < 0 ? 'text-red-500' : 'text-green-600'}`}>฿{change >= 0 ? change.toLocaleString() : '0'}</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[100, 500, 1000].map(amt => (
                                                <button key={amt} onClick={() => setCashReceived(String(amt))} className="py-3 bg-gray-100 rounded-lg font-bold text-gray-600 hover:bg-gray-200 text-lg">{amt}</button>
                                            ))}
                                            <button onClick={() => setCashReceived(String(selectedOrder ? selectedOrder.totalAmount : cartTotal))} className="py-3 bg-brand-100 rounded-lg font-bold text-brand-600 hover:bg-brand-200 text-sm">Exact</button>
                                        </div>
                                    </div>
                                ) : paymentMethod === 'qr_transfer' ? (
                                    <div className="flex flex-col items-center animate-fade-in justify-center h-full">
                                        <div className="bg-white p-4 rounded-xl border-2 border-brand-500 shadow-lg mb-4">
                                            <img src={promptPayQRUrl} className="w-56 h-56 lg:w-64 lg:h-64 mix-blend-multiply" />
                                        </div>
                                        <p className="text-center text-gray-500 text-sm font-bold">Scan with any Banking App</p>
                                        <div className="mt-2 text-3xl font-bold text-brand-600">฿{(selectedOrder ? selectedOrder.totalAmount : cartTotal).toLocaleString()}</div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col animate-fade-in justify-center bg-sky-50 border border-sky-100 rounded-2xl p-4 lg:p-5 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-650 font-extrabold shrink-0 animate-bounce">
                                                <Sparkles size={20}/>
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-sky-950 text-xs md:text-sm">บันทึกผ่าน "โครงการไทยช่วยไทย"</p>
                                                <p className="text-[10px] text-sky-700 font-medium leading-none">โครงการช่วยเหลือสวัสดิการสิทธิ์หลัก (แอปถุงเงิน)</p>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-white p-3 rounded-xl border border-sky-200 flex justify-between items-center w-full shadow-sm">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">ยอดระบุชำระสิทธิ์</span>
                                            <span className="text-xl font-black text-sky-605">฿{(selectedOrder ? selectedOrder.totalAmount : cartTotal).toLocaleString()}</span>
                                        </div>

                                        <div className="text-[10.5px] text-gray-650 space-y-1 bg-white/50 p-2.5 rounded-xl border leading-relaxed font-medium">
                                            <p className="font-extrabold text-sky-950">📋 คู่มือสำหรับแคชเชียร์:</p>
                                            <p>1. เปิดแอป <strong className="text-sky-850 font-bold">"ถุงเงิน"</strong> บนโทรศัพท์ของร้านค้า</p>
                                            <p>2. กดสร้างคิวอาร์โค้ดรับชำระเงินสิทธิ์ <strong className="font-bold text-sky-800">"ไทยช่วยไทย"</strong></p>
                                            <p>3. กรอกยอดเงิน <strong className="font-bold text-sky-800">฿{(selectedOrder ? selectedOrder.totalAmount : cartTotal).toLocaleString()}</strong> แล้วให้ลูกค้าสแกนชำระที่หน้าร้าน</p>
                                            <p>4. เมื่อยอดและสิทธิ์ชำระเรียบร้อยในแอปหน้าร้านแล้ว ให้กดปุ่ม <strong>CONFIRM</strong> หน้าจอนี้เพื่อปิดบิล</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tax Invoice Toggle */}
                            <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <label className="flex items-center gap-2 cursor-pointer mb-2">
                                    <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500" checked={taxInvoice.isRequested} onChange={(e) => setTaxInvoice({...taxInvoice, isRequested: e.target.checked})} />
                                    <span className="font-bold text-gray-700 text-sm">ขอใบกำกับภาษีเต็มรูป (Tax Invoice)</span>
                                </label>
                                {taxInvoice.isRequested && (
                                    <div className="space-y-3 mt-3 border-t border-gray-200 pt-3 animate-fade-in">
                                         <div>
                                            <input type="text" placeholder="ชื่อบริษัท / Company Name" className="w-full px-3 py-2 border rounded-lg text-sm" value={taxInvoice.companyName} onChange={e => setTaxInvoice({...taxInvoice, companyName: e.target.value})} />
                                         </div>
                                         <div>
                                            <input type="text" placeholder="เลขประจำตัวผู้เสียภาษี / Tax ID" className="w-full px-3 py-2 border rounded-lg text-sm" value={taxInvoice.taxId} onChange={e => setTaxInvoice({...taxInvoice, taxId: e.target.value})} />
                                         </div>
                                         <div>
                                            <input type="text" placeholder="ที่อยู่ / Address" className="w-full px-3 py-2 border rounded-lg text-sm" value={taxInvoice.address} onChange={e => setTaxInvoice({...taxInvoice, address: e.target.value})} />
                                         </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-auto flex gap-3">
                                <button onClick={handlePrintBill} className="px-6 py-4 rounded-xl font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 transition flex flex-col items-center justify-center">
                                    <Printer size={24}/>
                                </button>
                                <button onClick={handleFinalizePayment} disabled={selectedOrder?.deliveryFee === 'pending'} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
                                    {paymentMethod === 'cash' ? 'PAID' : 'CONFIRM'} <CheckCircle size={24}/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- EDIT ORDER MODAL --- */}
            {showEditOrderModal && editingOrder && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in text-gray-800">
                        <div className="bg-gray-905 px-6 py-4 flex items-center justify-between text-white border-b border-gray-805 bg-brand-650" style={{backgroundColor: '#b91c1c'}}>
                            <h3 className="font-extrabold text-lg flex items-center gap-2">
                                🍕 แก้ไขออเดอร์ #{String(editingOrder.id).slice(-4)}
                            </h3>
                            <button onClick={() => { setShowEditOrderModal(false); setEditingOrder(null); }} className="text-gray-200 hover:text-white font-bold text-2xl p-1 leading-none">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4 max-h-[70vh] text-left">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Customer Name (ชื่อลูกค้า)</label>
                                <input 
                                    type="text" 
                                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 outline-none focus:border-brand-500"
                                    value={editOrderForm.customerName}
                                    onChange={e => setEditOrderForm({...editOrderForm, customerName: e.target.value})}
                                />
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Customer Phone (เบอร์โทร)</label>
                                <input 
                                    type="text" 
                                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 outline-none focus:border-brand-500"
                                    value={editOrderForm.customerPhone}
                                    onChange={e => setEditOrderForm({...editOrderForm, customerPhone: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Table Number (เลขโต๊ะ)</label>
                                    <input 
                                        type="text" 
                                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 outline-none focus:border-brand-500"
                                        placeholder="เช่น 5"
                                        value={editOrderForm.tableNumber}
                                        onChange={e => setEditOrderForm({...editOrderForm, tableNumber: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Order Source (ช่องทาง)</label>
                                    <select 
                                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 outline-none focus:border-brand-500 bg-white"
                                        value={editOrderForm.source}
                                        onChange={e => setEditOrderForm({...editOrderForm, source: e.target.value as OrderSource})}
                                    >
                                        <option value="store">Store (หน้าร้าน)</option>
                                        <option value="grab">Grab</option>
                                        <option value="lineman">LineMan</option>
                                        <option value="foodpanda">FoodPanda</option>
                                        <option value="robinhood">Robinhood</option>
                                        <option value="shopeefood">ShopeeFood</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Total (ยอดขายรวม ฿)</label>
                                    <input 
                                        type="number" 
                                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 outline-none focus:border-brand-500"
                                        value={editOrderForm.totalAmount}
                                        onChange={e => setEditOrderForm({...editOrderForm, totalAmount: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Net (รายรับหลังหัก GP ฿)</label>
                                    <input 
                                        type="number" 
                                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 outline-none focus:border-brand-500"
                                        value={editOrderForm.netAmount}
                                        onChange={e => setEditOrderForm({...editOrderForm, netAmount: Number(e.target.value)})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Order Status (สถานะคิว)</label>
                                    <select 
                                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 outline-none focus:border-brand-500 bg-white"
                                        value={editOrderForm.status}
                                        onChange={e => setEditOrderForm({...editOrderForm, status: e.target.value as OrderStatus})}
                                    >
                                        <option value="pending">Pending (รอชำระ/รอทำ)</option>
                                        <option value="completed">Completed (เสร็จสิ้น)</option>
                                        <option value="cancelled">Cancelled (ยกเลิก)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Payment (วิธีจ่ายเงิน)</label>
                                    <select 
                                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 outline-none focus:border-brand-500 bg-white"
                                        value={editOrderForm.paymentMethod}
                                        onChange={e => setEditOrderForm({...editOrderForm, paymentMethod: e.target.value as PaymentMethod})}
                                    >
                                        <option value="cash">Cash (เงินสด)</option>
                                        <option value="promptpay">PromptPay (พร้อมเพย์)</option>
                                        <option value="thaihelpthai">โครงการไทยช่วยไทย</option>
                                        <option value="delivery_app">แอปคู่เดลิเวอรี่</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Order Time (วันเวลาไทยของออเดอร์)</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 outline-none focus:border-brand-500"
                                    value={isoToDatetimeLocal(editOrderForm.createdAt)}
                                    onChange={e => setEditOrderForm({...editOrderForm, createdAt: datetimeLocalToIso(e.target.value)})}
                                />
                                <span className="text-[10px] text-gray-400 block mt-1">เวลาในระบบจะถูกบันทึกเป็น UTC และแปลงตามเวลาไทย (GMT+7) เสมอ</span>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Notes (หมายเหตุออเดอร์)</label>
                                <textarea 
                                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 outline-none focus:border-brand-500 h-16"
                                    value={editOrderForm.note}
                                    onChange={e => setEditOrderForm({...editOrderForm, note: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
                            <button 
                                onClick={() => { setShowEditOrderModal(false); setEditingOrder(null); }} 
                                className="flex-1 py-3 rounded-xl font-bold border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition"
                            >
                                Cancel (ยกเลิก)
                            </button>
                            <button 
                                onClick={handleSaveOrderEdit} 
                                className="flex-1 py-3 rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white shadow transition"
                            >
                                Save (บันทึกแก้ไข)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ... (Rest of Modals) ... */}
        </div>
    );
};
