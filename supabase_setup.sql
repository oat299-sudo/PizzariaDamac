-- ==========================================
-- SUPABASE SCHEMA SETUP FOR POS v2.1
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Store Settings Table
CREATE TABLE store_settings (
    id SERIAL PRIMARY KEY,
    is_open BOOLEAN DEFAULT true,
    closed_message TEXT,
    promo_banner_url TEXT,
    promo_content_type TEXT,
    review_links JSONB DEFAULT '[]'::jsonb,
    vibe_links JSONB DEFAULT '[]'::jsonb,
    event_gallery_urls JSONB DEFAULT '[]'::jsonb,
    holiday_start TEXT,
    holiday_end TEXT,
    review_url TEXT,
    facebook_url TEXT,
    line_url TEXT,
    map_url TEXT,
    contact_phone TEXT,
    prompt_pay_number TEXT,
    news_items JSONB DEFAULT '[]'::jsonb
);

-- Initialize the first row for settings
INSERT INTO store_settings (id, is_open) VALUES (1, true);

-- 2. Menu Items Table
CREATE TABLE menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_th TEXT,
    description TEXT,
    description_th TEXT,
    base_price NUMERIC NOT NULL,
    image TEXT,
    available BOOLEAN DEFAULT true,
    category TEXT,
    combo_count INTEGER,
    is_best_seller BOOLEAN DEFAULT false
);

-- 3. Toppings Table
CREATE TABLE toppings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_th TEXT,
    price NUMERIC NOT NULL,
    category TEXT,
    image TEXT,
    available BOOLEAN DEFAULT true
);

-- 4. Customers Table (Loyalty Program)
CREATE TABLE customers (
    phone TEXT PRIMARY KEY,
    name TEXT,
    address TEXT,
    birthday TEXT,
    password TEXT,
    loyalty_points INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'bronze',
    saved_favorites JSONB DEFAULT '[]'::jsonb,
    order_history JSONB DEFAULT '[]'::jsonb,
    pdpa_accepted BOOLEAN DEFAULT true,
    saved_addresses JSONB DEFAULT '[]'::jsonb
);

-- 5. Orders Table
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT,
    customer_phone TEXT,
    type TEXT,
    source TEXT,
    status TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC,
    net_amount NUMERIC,
    created_at TEXT,
    note TEXT,
    delivery_address TEXT,
    delivery_zone TEXT,
    delivery_fee NUMERIC,
    payment_method TEXT,
    pickup_time TEXT,
    table_number TEXT,
    rating INTEGER,
    comment TEXT
);

-- 6. Expenses Table
CREATE TABLE expenses (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT,
    date TEXT NOT NULL,
    note TEXT
);

-- Set generous payload size limit to prevent PostgREST errors for large base64 images
-- Wait, we can't alter role like this often without superuser, but it's safe to include inside Supabase SQL editor.
-- Note: If you have problems with inserting large base64 images, contact Supabase Support to increase max_request_size.
