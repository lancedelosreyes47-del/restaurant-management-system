-- ============================================================================
-- RESTAURANT MANAGEMENT SYSTEM - SUPABASE DATABASE SCHEMA
-- Execute this script in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ============================================================================

-- 1. Create Menu Items Table
create table if not exists public.menu_items (
    id text primary key,
    name text not null,
    category text not null,
    price numeric not null,
    available boolean default true,
    description text,
    created_at timestamptz default now()
);

-- 2. Create Orders Table
create table if not exists public.orders (
    id text primary key,
    customer_name text not null,
    items jsonb not null,
    subtotal numeric not null,
    total numeric not null,
    payment numeric default 0,
    change numeric default 0,
    status text not null default 'Pending',
    timestamp text not null,
    order_type text default 'Dine-In',
    processed_by text,
    created_at timestamptz default now()
);

-- 3. Enable Row Level Security (RLS)
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;

-- 4. Create Policies allowing Public / Anon read and write operations
-- (Ideal for school development and demonstration projects)
drop policy if exists "Public menu_items access" on public.menu_items;
create policy "Public menu_items access" 
    on public.menu_items 
    for all 
    using (true) 
    with check (true);

drop policy if exists "Public orders access" on public.orders;
create policy "Public orders access" 
    on public.orders 
    for all 
    using (true) 
    with check (true);

-- 5. Insert Sample Seed Menu Items (if not already existing)
insert into public.menu_items (id, name, category, price, available, description)
values
    ('M001', 'Chicken Adobo', 'Main Course', 120, true, 'Savory stewed chicken marinated in soy sauce, vinegar, and garlic.'),
    ('M002', 'Burger', 'Fast Food', 100, true, 'Juicy beef patty served with fresh lettuce, tomatoes, and house sauce.'),
    ('M003', 'Fries', 'Side Dish', 60, true, 'Golden crispy french fries lightly seasoned with salt.'),
    ('M004', 'Soft Drink', 'Beverage', 40, true, 'Refreshing ice-cold carbonated soda in can.'),
    ('M005', 'Pork Sisig w/ Egg', 'Main Course', 150, true, 'Sizzling minced pork seasoned with calamansi, onions, and topped with egg.'),
    ('M006', 'Halo-Halo Special', 'Dessert', 85, true, 'Classic shaved ice dessert with mixed sweetened fruits, leche flan, and ube.'),
    ('M007', 'Fried Chicken w/ Rice', 'Main Course', 130, true, 'Crispy deep-fried chicken served with hot steamed rice and gravy.'),
    ('M008', 'Iced Lemon Tea', 'Beverage', 35, false, 'Freshly brewed black tea infused with natural lemon slices.'),
    ('M009', 'Garlic Butter Rice', 'Side Dish', 25, true, 'Fragrant steamed rice sautéed with toasted garlic and butter.'),
    ('M010', 'Leche Flan', 'Dessert', 70, true, 'Rich and creamy Filipino caramel custard dessert.')
on conflict (id) do nothing;

-- 6. Insert Sample Orders
insert into public.orders (id, customer_name, items, subtotal, total, payment, change, status, timestamp, order_type, processed_by)
values
    ('ORD-1001', 'Juan Dela Cruz (Table 1)', '[{"id":"M001","name":"Chicken Adobo","price":120,"quantity":2,"subtotal":240},{"id":"M003","name":"Fries","price":60,"quantity":1,"subtotal":60},{"id":"M004","name":"Soft Drink","price":40,"quantity":2,"subtotal":80}]'::jsonb, 380, 380, 500, 120, 'Completed', '2026-09-04 11:30 AM', 'Dine-In', 'Staff Cashier'),
    ('ORD-1002', 'Maria Santos (Takeout)', '[{"id":"M002","name":"Burger","price":100,"quantity":2,"subtotal":200},{"id":"M003","name":"Fries","price":60,"quantity":2,"subtotal":120}]'::jsonb, 320, 320, 350, 30, 'Completed', '2026-09-04 12:15 PM', 'Takeout', 'Staff Cashier'),
    ('ORD-1003', 'Pedro Penduko (Table 4)', '[{"id":"M005","name":"Pork Sisig w/ Egg","price":150,"quantity":2,"subtotal":300},{"id":"M009","name":"Garlic Butter Rice","price":25,"quantity":2,"subtotal":50},{"id":"M004","name":"Soft Drink","price":40,"quantity":2,"subtotal":80}]'::jsonb, 430, 430, 500, 70, 'Preparing', '2026-09-04 01:05 PM', 'Dine-In', 'Staff Cashier'),
    ('ORD-1004', 'Customer #8 (Self-Service)', '[{"id":"M007","name":"Fried Chicken w/ Rice","price":130,"quantity":1,"subtotal":130},{"id":"M006","name":"Halo-Halo Special","price":85,"quantity":1,"subtotal":85}]'::jsonb, 215, 215, 0, 0, 'Pending', '2026-09-04 01:20 PM', 'Dine-In', 'Self-Service Kiosk')
on conflict (id) do nothing;

