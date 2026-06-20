-- =============================================================================
-- EPOS Dashboard — Seed Data
-- Mirrors all mock data from src/data/mockData.js as real database rows.
-- Run this AFTER schema.sql in Supabase → SQL Editor.
-- Designed to be idempotent: safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- LOCATIONS
-- ---------------------------------------------------------------------------
insert into public.locations (id, name, city, address, cuisine)
values
  ('bham', 'Sparkhill',    'Birmingham', '142 Ladypool Road, Birmingham B12 8JS',    'Pizza Takeaway'),
  ('leic', 'Belgrave',     'Leicester',  '7 Belgrave Gate, Leicester LE1 3GA',        'Pizza Takeaway'),
  ('cov',  'City Centre',  'Coventry',   '33 Far Gosford Street, Coventry CV1 5DZ',   'Pizza Takeaway')
on conflict (id) do nothing;


-- ---------------------------------------------------------------------------
-- DAILY SNAPSHOTS  (today's KPIs — uses current_date so the app always sees them)
-- ---------------------------------------------------------------------------
insert into public.daily_snapshots
  (location_id, date, revenue, cogs, labour, overheads, order_count,
   revenue_delta, cogs_delta, labour_delta, overheads_delta, net_profit_delta, order_count_delta)
values
  ('bham', current_date, 3240, 972, 680, 415, 184,
    6.2,  1.1, -2.4, 0, 11.8,  5.1),
  ('leic', current_date, 2180, 698, 511, 360, 142,
   -3.1,  0.4,  1.8, 0, -9.2, -1.4),
  ('cov',  current_date, 1485, 520, 396, 285, 121,
    2.0,  2.6,  0.5, 0,  4.4,  3.3)
on conflict (location_id, date) do nothing;


-- ---------------------------------------------------------------------------
-- HOURLY REVENUE  (intraday curve — shape generated from hourlyCurve() in mockData)
-- ---------------------------------------------------------------------------
insert into public.hourly_revenue (location_id, date, hour, revenue, orders)
values
  -- bham (scale 260)
  ('bham', current_date, '11:00',  91,  5),
  ('bham', current_date, '12:00', 187, 11),
  ('bham', current_date, '13:00', 221, 13),
  ('bham', current_date, '14:00', 130,  7),
  ('bham', current_date, '15:00',  73,  4),
  ('bham', current_date, '16:00',  78,  4),
  ('bham', current_date, '17:00', 143,  8),
  ('bham', current_date, '18:00', 213, 12),
  ('bham', current_date, '19:00', 260, 15),
  ('bham', current_date, '20:00', 247, 14),
  ('bham', current_date, '21:00', 203, 12),
  ('bham', current_date, '22:00', 120,  7),
  ('bham', current_date, '23:00',  52,  3),
  -- leic (scale 175)
  ('leic', current_date, '11:00',  61,  3),
  ('leic', current_date, '12:00', 126,  7),
  ('leic', current_date, '13:00', 149,  8),
  ('leic', current_date, '14:00',  88,  5),
  ('leic', current_date, '15:00',  49,  3),
  ('leic', current_date, '16:00',  53,  3),
  ('leic', current_date, '17:00',  96,  5),
  ('leic', current_date, '18:00', 144,  8),
  ('leic', current_date, '19:00', 175, 10),
  ('leic', current_date, '20:00', 166,  9),
  ('leic', current_date, '21:00', 137,  8),
  ('leic', current_date, '22:00',  81,  5),
  ('leic', current_date, '23:00',  35,  2),
  -- cov (scale 120)
  ('cov',  current_date, '11:00',  42,  2),
  ('cov',  current_date, '12:00',  86,  5),
  ('cov',  current_date, '13:00', 102,  6),
  ('cov',  current_date, '14:00',  60,  3),
  ('cov',  current_date, '15:00',  34,  2),
  ('cov',  current_date, '16:00',  36,  2),
  ('cov',  current_date, '17:00',  66,  4),
  ('cov',  current_date, '18:00',  98,  6),
  ('cov',  current_date, '19:00', 120,  7),
  ('cov',  current_date, '20:00', 114,  6),
  ('cov',  current_date, '21:00',  94,  5),
  ('cov',  current_date, '22:00',  55,  3),
  ('cov',  current_date, '23:00',  24,  1)
on conflict (location_id, date, hour) do nothing;


-- ---------------------------------------------------------------------------
-- DAILY REVENUE SERIES  (last 7 days per location, date ascending)
-- ---------------------------------------------------------------------------
insert into public.daily_revenue_series (location_id, date, day_label, revenue, cogs, labour)
values
  -- bham
  ('bham', current_date - 6, 'Thu', 2980,  920, 642),
  ('bham', current_date - 5, 'Fri', 4120, 1248, 812),
  ('bham', current_date - 4, 'Sat', 4680, 1410, 905),
  ('bham', current_date - 3, 'Sun', 3890, 1190, 770),
  ('bham', current_date - 2, 'Mon', 2510,  790, 588),
  ('bham', current_date - 1, 'Tue', 2740,  845, 610),
  ('bham', current_date,     'Wed', 3240,  972, 680),
  -- leic
  ('leic', current_date - 6, 'Thu', 2050,  660, 498),
  ('leic', current_date - 5, 'Fri', 2810,  905, 612),
  ('leic', current_date - 4, 'Sat', 3240, 1040, 690),
  ('leic', current_date - 3, 'Sun', 2680,  858, 560),
  ('leic', current_date - 2, 'Mon', 1740,  562, 452),
  ('leic', current_date - 1, 'Tue', 1980,  638, 470),
  ('leic', current_date,     'Wed', 2180,  698, 511),
  -- cov
  ('cov',  current_date - 6, 'Thu', 1360,  470, 372),
  ('cov',  current_date - 5, 'Fri', 2240,  800, 520),
  ('cov',  current_date - 4, 'Sat', 2580,  920, 560),
  ('cov',  current_date - 3, 'Sun', 1980,  700, 470),
  ('cov',  current_date - 2, 'Mon', 1180,  410, 340),
  ('cov',  current_date - 1, 'Tue', 1290,  448, 358),
  ('cov',  current_date,     'Wed', 1485,  520, 396)
on conflict (location_id, date) do nothing;


-- ---------------------------------------------------------------------------
-- BEST SELLERS
-- ---------------------------------------------------------------------------
insert into public.best_sellers (location_id, date, name, qty, revenue, rank)
values
  ('bham', current_date, 'Pepperoni (12")',          58, 638, 1),
  ('bham', current_date, 'Margherita (12")',          44, 418, 2),
  ('bham', current_date, 'Meat Feast (12")',          31, 419, 3),
  ('bham', current_date, 'Garlic Bread with Cheese', 62, 279, 4),
  ('bham', current_date, 'BBQ Chicken (12")',         28, 350, 5),
  ('leic', current_date, 'Margherita (12")',          49, 466, 1),
  ('leic', current_date, 'Pepperoni (12")',           41, 451, 2),
  ('leic', current_date, 'Hawaiian (12")',            26, 286, 3),
  ('leic', current_date, 'Loaded Fries',             44, 198, 4),
  ('leic', current_date, 'Chicken Wings (6)',         33, 182, 5),
  ('cov',  current_date, 'Margherita (12")',          38, 361, 1),
  ('cov',  current_date, 'Pepperoni (12")',           33, 363, 2),
  ('cov',  current_date, 'Loaded Fries',             41, 184, 3),
  ('cov',  current_date, 'Meat Feast (12")',          19, 257, 4),
  ('cov',  current_date, 'Garlic Bread',             47, 188, 5)
on conflict (location_id, date, name) do nothing;


-- ---------------------------------------------------------------------------
-- ORDERS  (curated today feed; channel tagged to match orderChannel() logic)
-- ---------------------------------------------------------------------------
insert into public.orders (location_id, reference, date, time, items, qty, total, payment, channel)
values
  -- bham
  ('bham', '#10248', current_date, '20:14', 'Pepperoni 12", Garlic Bread, Coke 1.5L',           3, 17.50, 'Card', 'In-store'),
  ('bham', '#10247', current_date, '20:02', 'Meat Feast 12", Potato Wedges',                    2, 18.00, 'Card', 'Just Eat'),
  ('bham', '#10246', current_date, '19:51', 'Margherita 12", Margherita 12", Garlic Bread w/ Cheese', 3, 23.50, 'Cash', 'In-store'),
  ('bham', '#10245', current_date, '19:43', 'BBQ Chicken 12", Chicken Wings (6), Can',          3, 19.20, 'Card', 'Uber Eats'),
  ('bham', '#10244', current_date, '19:30', 'Vegetable Supreme 12", Mozzarella Sticks',         2, 16.00, 'Card', 'Deliveroo'),
  ('bham', '#10243', current_date, '19:18', 'Garlic Bread w/ Cheese, Coke 1.5L',               2,  7.00, 'Cash', 'In-store'),
  ('bham', '#10242', current_date, '19:05', 'Hawaiian 12", Potato Wedges',                     2, 15.50, 'Card', 'Website'),
  ('bham', '#10241', current_date, '18:52', 'Pepperoni 12", Can',                              2, 12.20, 'Card', 'Just Eat'),
  -- leic
  ('leic', '#08841', current_date, '20:09', 'Margherita 12", Loaded Fries',                   2, 14.00, 'Card', 'In-store'),
  ('leic', '#08840', current_date, '19:55', 'Hawaiian 12", Garlic Bread, Coke 1.5L',          3, 17.50, 'Card', 'Just Eat'),
  ('leic', '#08839', current_date, '19:41', 'Pepperoni 12", Chicken Wings (6)',               2, 16.50, 'Cash', 'Uber Eats'),
  ('leic', '#08838', current_date, '19:28', 'Loaded Fries, Can',                              2,  5.70, 'Card', 'In-store'),
  ('leic', '#08837', current_date, '19:12', 'BBQ Chicken 12", Mozzarella Sticks',             2, 17.00, 'Card', 'Deliveroo'),
  ('leic', '#08836', current_date, '18:58', 'Margherita 12", Garlic Bread w/ Cheese',         2, 14.00, 'Cash', 'Website'),
  -- cov
  ('cov',  '#05512', current_date, '21:22', 'Pepperoni 12", Loaded Fries, Can',               3, 16.70, 'Card', 'In-store'),
  ('cov',  '#05511', current_date, '21:08', 'Margherita 12", Garlic Bread',                   2, 13.50, 'Cash', 'Just Eat'),
  ('cov',  '#05510', current_date, '20:54', 'Meat Feast 12", Coke 1.5L',                      2, 16.00, 'Card', 'Uber Eats'),
  ('cov',  '#05509', current_date, '20:40', 'Loaded Fries, Mozzarella Sticks',                2,  9.00, 'Cash', 'In-store'),
  ('cov',  '#05508', current_date, '20:25', 'Margherita 12", Can',                            2, 10.70, 'Card', 'Deliveroo')
on conflict do nothing;


-- ---------------------------------------------------------------------------
-- INVENTORY ITEMS
-- ---------------------------------------------------------------------------
insert into public.inventory_items (location_id, name, unit, in_stock, par, cost, supplier_name)
values
  -- bham
  ('bham', 'Pizza dough balls',    'each',     120, 200, 0.35,  'DoughPro'),
  ('bham', 'Mozzarella',           'kg',        14,  40, 6.20,  'Dairy Direct'),
  ('bham', 'Pizza sauce (passata)','L',          22,  30, 1.30,  'Italia Wholesale'),
  ('bham', 'Pepperoni',            'kg',          7,  20, 7.80,  'Italia Wholesale'),
  ('bham', 'Cooked chicken',       'kg',          9,  18, 6.50,  'Midlands Meats'),
  ('bham', 'Mixed peppers',        'kg',         11,  15, 2.40,  'Fresh Veg Co'),
  ('bham', 'Mushrooms',            'kg',          6,  12, 2.80,  'Fresh Veg Co'),
  ('bham', 'Pineapple (tinned)',   'case',         3,   8, 8.50,  'Italia Wholesale'),
  ('bham', 'French fries (frozen)','kg',         28,  25, 1.20,  'Catering Supplies'),
  ('bham', 'Chicken wings',        'kg',          5,  15, 4.50,  'Midlands Meats'),
  ('bham', 'Pizza boxes 12"',      'box(100)',    2,   6,18.00,  'Pack-It'),
  ('bham', 'Cans of drink',        'case(24)',    4,  10, 9.60,  'Drinks Co'),
  -- leic
  ('leic', 'Pizza dough balls',    'each',     150, 200, 0.35,  'DoughPro'),
  ('leic', 'Mozzarella',           'kg',        20,  40, 6.20,  'Dairy Direct'),
  ('leic', 'Pizza sauce (passata)','L',           9,  30, 1.30,  'Italia Wholesale'),
  ('leic', 'Pepperoni',            'kg',         11,  20, 7.80,  'Italia Wholesale'),
  ('leic', 'Ham',                  'kg',          6,  15, 5.40,  'Midlands Meats'),
  ('leic', 'Pineapple (tinned)',   'case',         5,   8, 8.50,  'Italia Wholesale'),
  ('leic', 'Sweetcorn (tinned)',   'case',         4,   6, 6.20,  'Italia Wholesale'),
  ('leic', 'French fries (frozen)','kg',         18,  25, 1.20,  'Catering Supplies'),
  ('leic', 'Mozzarella sticks (frozen)', 'kg',    3,  10, 5.20,  'Catering Supplies'),
  ('leic', 'Pizza boxes 12"',      'box(100)',    4,   6,18.00,  'Pack-It'),
  ('leic', 'Cans of drink',        'case(24)',    7,  10, 9.60,  'Drinks Co'),
  -- cov
  ('cov',  'Pizza dough balls',    'each',      90, 200, 0.35,  'DoughPro'),
  ('cov',  'Mozzarella',           'kg',         8,  30, 6.20,  'Dairy Direct'),
  ('cov',  'Pizza sauce (passata)','L',          14,  25, 1.30,  'Italia Wholesale'),
  ('cov',  'Pepperoni',            'kg',          5,  15, 7.80,  'Italia Wholesale'),
  ('cov',  'Beef mince',           'kg',          6,  12, 5.00,  'Midlands Meats'),
  ('cov',  'French fries (frozen)','kg',         20,  25, 1.20,  'Catering Supplies'),
  ('cov',  'Garlic butter',        'kg',          3,   6, 3.20,  'Catering Supplies'),
  ('cov',  'Pizza boxes 12"',      'box(100)',    2,   5,18.00,  'Pack-It'),
  ('cov',  'Cans of drink',        'case(24)',    5,   8, 9.60,  'Drinks Co')
on conflict (location_id, name) do nothing;


-- ---------------------------------------------------------------------------
-- RECIPES
-- ---------------------------------------------------------------------------
insert into public.recipes (location_id, dish, price, portion_cost, ingredients)
values
  -- bham
  ('bham', 'Margherita (12")',      9.50, 2.30, ARRAY['Dough ball', 'Mozzarella 120g', 'Pizza sauce 80ml', 'Basil']),
  ('bham', 'Pepperoni (12")',      11.00, 2.95, ARRAY['Dough ball', 'Mozzarella 120g', 'Pepperoni 60g', 'Sauce']),
  ('bham', 'BBQ Chicken (12")',    12.50, 3.60, ARRAY['Dough ball', 'Mozzarella', 'Chicken 90g', 'BBQ sauce']),
  ('bham', 'Meat Feast (12")',     13.50, 4.20, ARRAY['Dough ball', 'Mozzarella', 'Pepperoni', 'Chicken', 'Beef']),
  ('bham', 'Garlic Bread with Cheese', 4.50, 1.10, ARRAY['Dough ball', 'Garlic butter', 'Mozzarella 40g']),
  ('bham', 'Chicken Wings (6)',     5.50, 2.10, ARRAY['Chicken wings 6', 'Coating', 'Hot sauce']),
  -- leic
  ('leic', 'Margherita (12")',      9.50, 2.30, ARRAY['Dough ball', 'Mozzarella 120g', 'Pizza sauce 80ml', 'Basil']),
  ('leic', 'Hawaiian (12")',       11.00, 3.05, ARRAY['Dough ball', 'Mozzarella', 'Ham 50g', 'Pineapple']),
  ('leic', 'Pepperoni (12")',      11.00, 2.95, ARRAY['Dough ball', 'Mozzarella 120g', 'Pepperoni 60g', 'Sauce']),
  ('leic', 'Vegetable Supreme (12")', 11.50, 3.10, ARRAY['Dough ball', 'Mozzarella', 'Peppers', 'Mushrooms', 'Sweetcorn']),
  ('leic', 'Loaded Fries',          4.50, 1.05, ARRAY['Fries 300g', 'Mozzarella 40g', 'Garlic mayo']),
  ('leic', 'Mozzarella Sticks (6)', 4.50, 1.40, ARRAY['Mozzarella sticks 6', 'Dip']),
  -- cov
  ('cov',  'Margherita (12")',      9.50, 2.30, ARRAY['Dough ball', 'Mozzarella 120g', 'Pizza sauce 80ml', 'Basil']),
  ('cov',  'Pepperoni (12")',      11.00, 2.95, ARRAY['Dough ball', 'Mozzarella 120g', 'Pepperoni 60g', 'Sauce']),
  ('cov',  'Meat Feast (12")',     13.50, 4.20, ARRAY['Dough ball', 'Mozzarella', 'Pepperoni', 'Beef', 'Chicken']),
  ('cov',  'Garlic Bread',          4.00, 0.80, ARRAY['Dough ball', 'Garlic butter']),
  ('cov',  'Loaded Fries',          4.50, 1.05, ARRAY['Fries 300g', 'Mozzarella 40g', 'Garlic mayo']),
  ('cov',  'Coca-Cola 1.5L',        2.50, 1.00, ARRAY['Coca-Cola 1.5L bottle'])
on conflict (location_id, dish) do nothing;


-- ---------------------------------------------------------------------------
-- WASTE LOG
-- ---------------------------------------------------------------------------
insert into public.waste_log (location_id, date, item, qty, reason, cost)
values
  -- bham
  ('bham', current_date,     'Pizza dough balls', '8 each',  'Over-prepped', 2.80),
  ('bham', current_date,     'Margherita 12"',    '2 pizzas','Order error',  4.60),
  ('bham', current_date - 1, 'Mozzarella',        '0.8 kg',  'Expired',      5.00),
  ('bham', current_date - 1, 'Garlic bread',      '6 units', 'Burnt',        4.80),
  ('bham', current_date - 2, 'Mixed peppers',     '1 kg',    'Spoiled',      2.40),
  ('bham', current_date - 2, 'Chicken wings',     '1 kg',    'Over-cooked',  4.50),
  -- leic
  ('leic', current_date,     'Pizza dough balls', '6 each',  'Over-prepped', 2.10),
  ('leic', current_date,     'Hawaiian 12"',      '1 pizza', 'Order error',  3.10),
  ('leic', current_date - 1, 'Loaded fries',      '2 kg',    'End of day',   2.40),
  ('leic', current_date - 1, 'Mozzarella sticks', '8 units', 'Burnt',        2.80),
  ('leic', current_date - 2, 'Ham',               '0.5 kg',  'Expired',      2.70),
  -- cov
  ('cov',  current_date,     'Pizza dough balls', '5 each',  'Over-prepped', 1.80),
  ('cov',  current_date,     'Garlic bread',      '8 units', 'Stale',        1.60),
  ('cov',  current_date - 1, 'French fries',      '2 kg',    'End of day',   2.40),
  ('cov',  current_date - 1, 'Pepperoni',         '0.4 kg',  'Over-portioned',3.10),
  ('cov',  current_date - 2, 'Mozzarella',        '0.3 kg',  'Spoiled',      1.90)
on conflict do nothing;


-- ---------------------------------------------------------------------------
-- STAFF MEMBERS
-- ---------------------------------------------------------------------------
insert into public.staff_members (location_id, name, role, wage, contract, shifts)
values
  -- bham
  ('bham', 'Aisha Khan',    'Front of House',  11.80, 'Part-time',
    '{"Mon":null,"Tue":"16:00 to 23:00","Wed":"16:00 to 23:00","Thu":null,"Fri":"16:00 to 23:30","Sat":"16:00 to 23:30","Sun":"15:00 to 22:00"}'),
  ('bham', 'Daniel Osei',   'Branch Manager',  16.50, 'Full-time',
    '{"Mon":"11:00 to 20:00","Tue":"11:00 to 20:00","Wed":"11:00 to 20:00","Thu":"11:00 to 20:00","Fri":"14:00 to 23:30","Sat":"14:00 to 23:30","Sun":null}'),
  ('bham', 'Marek Kowalski','Head Pizza Chef', 14.00, 'Full-time',
    '{"Mon":"15:00 to 23:00","Tue":"15:00 to 23:00","Wed":"15:00 to 23:00","Thu":null,"Fri":"15:00 to 23:30","Sat":"15:00 to 23:30","Sun":"14:00 to 22:00"}'),
  ('bham', 'Priya Patel',   'Pizza Chef',      13.50, 'Full-time',
    '{"Mon":"16:00 to 23:00","Tue":null,"Wed":"16:00 to 23:00","Thu":"16:00 to 23:00","Fri":"16:00 to 23:30","Sat":"16:00 to 23:30","Sun":"15:00 to 22:00"}'),
  ('bham', 'Tom Reeves',    'Delivery Driver', 11.44, 'Part-time',
    '{"Mon":null,"Tue":"17:00 to 23:00","Wed":"17:00 to 23:00","Thu":"17:00 to 23:00","Fri":"17:00 to 23:30","Sat":"17:00 to 23:30","Sun":"16:00 to 22:00"}'),
  ('bham', 'Sofia Alves',   'Kitchen Porter',  11.44, 'Part-time',
    '{"Mon":"17:00 to 22:00","Tue":"17:00 to 22:00","Wed":null,"Thu":"17:00 to 22:00","Fri":"17:00 to 23:00","Sat":"17:00 to 23:00","Sun":null}'),
  -- leic
  ('leic', 'Mei Lin',    'Front of House',  11.60, 'Part-time',
    '{"Mon":null,"Tue":"16:00 to 23:00","Wed":"16:00 to 23:00","Thu":"16:00 to 23:00","Fri":"16:00 to 23:30","Sat":"16:00 to 23:30","Sun":null}'),
  ('leic', 'Kevin Tran', 'Branch Manager',  16.00, 'Full-time',
    '{"Mon":"12:00 to 21:00","Tue":"12:00 to 21:00","Wed":"12:00 to 21:00","Thu":"12:00 to 21:00","Fri":"15:00 to 23:30","Sat":"15:00 to 23:30","Sun":null}'),
  ('leic', 'Wei Chen',   'Pizza Chef',      14.50, 'Full-time',
    '{"Mon":"16:00 to 23:00","Tue":"16:00 to 23:00","Wed":null,"Thu":"16:00 to 23:00","Fri":"16:00 to 23:30","Sat":"16:00 to 23:30","Sun":"15:00 to 22:00"}'),
  ('leic', 'Jamie Doyle','Delivery Driver', 11.44, 'Part-time',
    '{"Mon":null,"Tue":"17:00 to 23:00","Wed":"17:00 to 23:00","Thu":"17:00 to 23:00","Fri":"17:00 to 23:30","Sat":"17:00 to 23:30","Sun":"16:00 to 22:00"}'),
  ('leic', 'Lucy Ward',  'Kitchen Porter',  11.44, 'Part-time',
    '{"Mon":"17:00 to 22:00","Tue":null,"Wed":"17:00 to 22:00","Thu":"17:00 to 22:00","Fri":"17:00 to 23:00","Sat":"17:00 to 23:00","Sun":null}'),
  -- cov
  ('cov',  'Yusuf Demir',  'Front of House',  11.50, 'Part-time',
    '{"Mon":"16:00 to 23:00","Tue":null,"Wed":"16:00 to 23:00","Thu":"16:00 to 23:00","Fri":"16:00 to 00:00","Sat":"16:00 to 00:00","Sun":"16:00 to 22:00"}'),
  ('cov',  'Rob Skinner',  'Branch Manager',  15.50, 'Full-time',
    '{"Mon":"14:00 to 22:00","Tue":"14:00 to 22:00","Wed":"14:00 to 22:00","Thu":"14:00 to 22:00","Fri":"16:00 to 00:00","Sat":"16:00 to 00:00","Sun":null}'),
  ('cov',  'Hassan Ali',   'Pizza Chef',      13.00, 'Full-time',
    '{"Mon":"16:00 to 23:00","Tue":"16:00 to 23:00","Wed":null,"Thu":"16:00 to 23:00","Fri":"16:00 to 00:00","Sat":"16:00 to 00:00","Sun":"16:00 to 22:00"}'),
  ('cov',  'Chloe Bennett','Delivery Driver', 11.44, 'Part-time',
    '{"Mon":null,"Tue":"17:00 to 23:00","Wed":"17:00 to 23:00","Thu":"17:00 to 23:00","Fri":"17:00 to 00:00","Sat":"17:00 to 00:00","Sun":"17:00 to 22:00"}')
on conflict do nothing;


-- ---------------------------------------------------------------------------
-- BOOKINGS  (today's floor)
-- ---------------------------------------------------------------------------
insert into public.bookings (location_id, date, time, name, size, table_ref, phone, status)
values
  -- bham
  ('bham', current_date, '18:00', 'Hussain (party)',  6, 'T4',    '07700 900181', 'Confirmed'),
  ('bham', current_date, '18:30', 'Walsh',            2, 'T1',    '07700 900142', 'Confirmed'),
  ('bham', current_date, '19:00', 'Begum',            4, 'T6',    '07700 900133', 'Seated'),
  ('bham', current_date, '19:30', 'Clarke',           3, 'T2',    '07700 900128', 'Confirmed'),
  ('bham', current_date, '20:00', 'Patel (birthday)', 8, 'T7+T8', '07700 900119', 'Confirmed'),
  ('bham', current_date, '20:30', 'O''Brien',         2, 'T3',    '07700 900105', 'Pending'),
  -- leic
  ('leic', current_date, '18:15', 'Nguyen',           4, 'T2', '07700 900244', 'Confirmed'),
  ('leic', current_date, '18:45', 'Smith',            2, 'T1', '07700 900231', 'Confirmed'),
  ('leic', current_date, '19:30', 'Cheng (party)',    6, 'T5', '07700 900222', 'Seated'),
  ('leic', current_date, '20:00', 'Hill',             3, 'T3', '07700 900210', 'Pending'),
  -- cov
  ('cov',  current_date, '19:00', 'Taylor',           4, 'T2', '07700 900388', 'Confirmed'),
  ('cov',  current_date, '20:00', 'Khan (party)',     5, 'T4', '07700 900377', 'Pending'),
  ('cov',  current_date, '20:30', 'Morris',           2, 'T1', '07700 900360', 'Confirmed')
on conflict do nothing;


-- ---------------------------------------------------------------------------
-- CHECKLIST SCHEDULES  (global settings)
-- ---------------------------------------------------------------------------
insert into public.checklist_schedules (section, recurrence, reminder, day, assigned_role, active)
values
  ('Opening', 'Daily',  '08:00', null,  'Manager',        true),
  ('Closing', 'Daily',  '22:30', null,  'Manager',        true),
  ('Cleaning','Weekly', '23:00', 'Mon', 'Kitchen Porter', true)
on conflict (section) do nothing;


-- ---------------------------------------------------------------------------
-- CHECKLIST COMPLETIONS
-- ---------------------------------------------------------------------------
insert into public.checklist_completions (location_id, date, section, completed_by, completed_at, done, total)
values
  -- bham
  ('bham', current_date,     'Opening', 'Daniel Osei',     '08:12', 6, 6),
  ('bham', current_date - 1, 'Closing', 'Marek Kowalski',  '23:41', 5, 5),
  ('bham', current_date - 1, 'Opening', 'Daniel Osei',     '08:05', 6, 6),
  ('bham', current_date - 2, 'Cleaning','Sofia Alves',     '23:18', 4, 5),
  ('bham', current_date - 2, 'Closing', 'Priya Patel',     '23:52', 5, 5),
  -- leic
  ('leic', current_date,     'Opening', 'Kevin Tran',      '08:20', 6, 6),
  ('leic', current_date - 1, 'Closing', 'Wei Chen',        '23:36', 5, 5),
  ('leic', current_date - 2, 'Cleaning','Lucy Ward',       '23:05', 5, 5),
  -- cov
  ('cov',  current_date,     'Opening', 'Rob Skinner',     '14:02', 5, 6),
  ('cov',  current_date - 1, 'Closing', 'Hassan Ali',      '00:08', 5, 5),
  ('cov',  current_date - 2, 'Opening', 'Rob Skinner',     '14:10', 6, 6)
on conflict do nothing;


-- ---------------------------------------------------------------------------
-- EXPENSES
-- ---------------------------------------------------------------------------
insert into public.expenses (location_id, reference, date, category, vendor, amount, note)
values
  -- bham
  ('bham', 'EXP-101', '2026-06-01', 'Rent',            'Ladypool Estates', 2400, 'Monthly rent'),
  ('bham', 'EXP-102', '2026-06-03', 'Utilities',       'British Gas',       540, 'Gas & electric'),
  ('bham', 'EXP-103', '2026-06-05', 'Packaging',       'Pack-It',           180, 'Pizza boxes & bags'),
  ('bham', 'EXP-104', '2026-06-06', 'Insurance',       'NFU Mutual',        145, 'Premises & liability'),
  ('bham', 'EXP-105', '2026-06-08', 'Marketing',       'Meta Ads',          160, 'Local boosted posts'),
  ('bham', 'EXP-106', '2026-06-09', 'Software & EPOS', 'NeuroChain Ai',      49, 'Subscription'),
  -- leic
  ('leic', 'EXP-201', '2026-06-01', 'Rent',                 'Belgrave Property', 1950, 'Monthly rent'),
  ('leic', 'EXP-202', '2026-06-04', 'Utilities',            'EDF Energy',         470, 'Gas & electric'),
  ('leic', 'EXP-203', '2026-06-06', 'Packaging',            'Pack-It',            150, 'Pizza boxes'),
  ('leic', 'EXP-204', '2026-06-07', 'Repairs & maintenance','OvenFix Ltd',        220, 'Oven thermostat'),
  ('leic', 'EXP-205', '2026-06-09', 'Software & EPOS',      'NeuroChain Ai',       49, 'Subscription'),
  -- cov
  ('cov',  'EXP-301', '2026-06-01', 'Rent',            'Far Gosford Lettings', 1500, 'Monthly rent'),
  ('cov',  'EXP-302', '2026-06-04', 'Utilities',       'British Gas',           380, 'Gas & electric'),
  ('cov',  'EXP-303', '2026-06-06', 'Cleaning',        'SpotlessPro',           110, 'Weekly deep clean'),
  ('cov',  'EXP-304', '2026-06-09', 'Software & EPOS', 'NeuroChain Ai',          49, 'Subscription')
on conflict do nothing;


-- ---------------------------------------------------------------------------
-- TIME OFF
-- ---------------------------------------------------------------------------
insert into public.time_off (location_id, staff_name, role, type, status, label, week_days, days)
values
  -- bham
  ('bham', 'Sofia Alves',    'Kitchen Porter',  'Holiday', 'Approved', '13 to 14 Jun', ARRAY['Sat','Sun'], 2),
  ('bham', 'Tom Reeves',     'Delivery Driver', 'Sick',    'Approved', '11 Jun',    ARRAY['Wed'],       1),
  ('bham', 'Marek Kowalski', 'Head Pizza Chef', 'Holiday', 'Pending',  '16 to 30 Jun', ARRAY[]::text[],   14),
  -- leic
  ('leic', 'Mei Lin',        'Front of House',  'Holiday', 'Pending',  '12 to 13 Jun', ARRAY['Fri','Sat'], 2),
  -- cov
  ('cov',  'Chloe Bennett',  'Delivery Driver', 'Holiday', 'Approved', '14 Jun',    ARRAY['Sun'],       1)
on conflict do nothing;


-- ---------------------------------------------------------------------------
-- SMS CAMPAIGNS
-- ---------------------------------------------------------------------------
insert into public.sms_campaigns
  (location_id, reference, name, date, audience, sent, delivered, opened, redeemed, status, message)
values
  -- bham
  ('bham', 'C-301', 'Two-for-Tuesday',       '2026-06-04', 'All opted-in',
    1240, 1212, 631, 88, 'Completed',
    '🍕 2-for-1 on all 12" pizzas this Tuesday at Sparkhill! Order online & quote TUES241.'),
  ('bham', 'C-302', 'Weekend Family Bundle',  '2026-05-30', 'Lapsed 30+ days',
     540,  528, 247, 41, 'Completed',
    'Miss us? 2 pizzas + sides + drink £24.99 this weekend only. We saved you a slice 🍕'),
  ('bham', 'C-303', 'Rainy Day 15% Off',      '2026-06-12', 'All opted-in',
       0,    0,   0,  0, 'Scheduled',
    'Grim out? Stay in 🌧️ 15% off delivery today with code COSY15.'),
  -- leic
  ('leic', 'C-401', 'Belgrave Loyalty Launch', '2026-06-02', 'All opted-in',
     880,  861, 402, 57, 'Completed',
    'Belgrave reward club is live 🎉 Collect a stamp on every order, your 6th pizza is on us.'),
  ('leic', 'C-402', 'Match Day Meal Deal',     '2026-06-08', 'Delivery customers',
     610,  598, 281, 49, 'Completed',
    'Big game tonight ⚽ Pizza + wings + drink £14.99. Order before kick-off!'),
  -- cov
  ('cov',  'C-501', 'City Centre Grand Re-open','2026-06-01', 'All opted-in',
     430,  421, 198, 33, 'Completed',
    'We''re back & better 🍕 20% off your next order this week with WELCOME20.')
on conflict do nothing;


-- ---------------------------------------------------------------------------
-- CALL LOG  (today)
-- ---------------------------------------------------------------------------
insert into public.call_log (location_id, date, time, number, caller_name, duration_sec, outcome, type)
values
  -- bham
  ('bham', current_date, '19:42', '07700 900181', 'Hussain',       124, 'Answered',  'Order'),
  ('bham', current_date, '19:28', '07700 900133', 'Begum',           0, 'Missed',    'Enquiry'),
  ('bham', current_date, '19:10', '07700 900142', 'Walsh',          86, 'Answered',  'Order'),
  ('bham', current_date, '18:51', '07911 123456', 'Unknown caller',  0, 'Voicemail', 'Enquiry'),
  ('bham', current_date, '18:33', '07700 900119', 'Patel',         142, 'Answered',  'Booking'),
  -- leic
  ('leic', current_date, '19:55', '07700 900244', 'Nguyen', 98,  'Answered', 'Booking'),
  ('leic', current_date, '19:33', '07700 900231', 'Smith',   0,  'Missed',   'Order'),
  ('leic', current_date, '19:02', '07700 900222', 'Cheng',  110, 'Answered', 'Order'),
  -- cov
  ('cov',  current_date, '20:40', '07700 900388', 'Taylor', 76, 'Answered', 'Order'),
  ('cov',  current_date, '20:12', '07700 900377', 'Khan',    0, 'Missed',   'Booking')
on conflict do nothing;


-- ---------------------------------------------------------------------------
-- PLATFORM ACCOUNTS  (delivery integrations)
-- ---------------------------------------------------------------------------
insert into public.platform_accounts (location_id, platform, account_name, store_id, status, orders_today, last_sync)
values
  -- bham
  ('bham', 'justeat',   'Sparkhill Pizza',        'JE-7741', 'Connected',      23, '2 min ago'),
  ('bham', 'ubereats',  'Sparkhill Pizza',         'UE-9920', 'Connected',      17, '1 min ago'),
  ('bham', 'ubereats',  'Sparkhill: Late Menu',    'UE-9921', 'Action needed',   0, 'Never synced'),
  ('bham', 'deliveroo', 'Sparkhill Pizza',         'DL-3380', 'Connected',      14, '4 min ago'),
  ('bham', 'foodhub',   'Sparkhill Pizza',         'FH-1102', 'Connected',       6, '6 min ago'),
  -- leic
  ('leic', 'justeat',   'Belgrave Pizza',          'JE-5510', 'Connected',      18, '3 min ago'),
  ('leic', 'ubereats',  'Belgrave Pizza',          'UE-7741', 'Connected',      12, '2 min ago'),
  ('leic', 'deliveroo', 'Belgrave Pizza',          'DL-2204', 'Connected',       9, '5 min ago'),
  ('leic', 'foodhub',   'Belgrave Pizza',          'FH-0907', 'Action needed',   0, 'Never synced'),
  -- cov
  ('cov',  'justeat',   'City Centre Pizza',       'JE-9912', 'Connected',      15, '1 min ago'),
  ('cov',  'ubereats',  'City Centre Pizza',       'UE-3318', 'Connected',      11, '3 min ago'),
  ('cov',  'deliveroo', 'City Centre Pizza',       'DL-7740', 'Not connected',   0, 'Never synced')
on conflict do nothing;


-- ---------------------------------------------------------------------------
-- SUPPLIERS
-- ---------------------------------------------------------------------------
insert into public.suppliers (name, email, phone, lead_days, account_ref)
values
  ('DoughPro',          'orders@doughpro.co.uk',           '0121 555 0142', 2, 'NC-DP-118'),
  ('Dairy Direct',      'sales@dairydirect.co.uk',         '0116 555 0188', 1, 'NC-DD-204'),
  ('Italia Wholesale',  'trade@italiawholesale.co.uk',     '0121 555 0233', 3, 'NC-IW-061'),
  ('Midlands Meats',    'orders@midlandsmeats.co.uk',      '0121 555 0410', 2, 'NC-MM-339'),
  ('Fresh Veg Co',      'hello@freshvegco.co.uk',          '0121 555 0177', 1, 'NC-FV-512'),
  ('Catering Supplies', 'orders@cateringsupplies.co.uk',   '0800 555 0199', 3, 'NC-CS-748'),
  ('Pack-It',           'sales@pack-it.co.uk',             '0161 555 0124', 4, 'NC-PK-090'),
  ('Drinks Co',         'trade@drinksco.co.uk',            '0121 555 0666', 2, 'NC-DR-301')
on conflict (name) do nothing;


-- ---------------------------------------------------------------------------
-- INGREDIENT PRICE HISTORY  (5-month trend for key items)
-- ---------------------------------------------------------------------------
insert into public.ingredient_price_history (location_id, item_name, period, cost, supplier_name, source)
values
  -- bham — Mozzarella
  ('bham', 'Mozzarella', 'Feb 2026', 5.65, 'Dairy Direct', 'Receipt OCR'),
  ('bham', 'Mozzarella', 'Mar 2026', 5.85, 'Dairy Direct', 'Receipt OCR'),
  ('bham', 'Mozzarella', 'Apr 2026', 6.10, 'Dairy Direct', 'Receipt OCR'),
  ('bham', 'Mozzarella', 'May 2026', 6.50, 'Dairy Direct', 'Receipt OCR'),
  ('bham', 'Mozzarella', 'Jun 2026', 6.85, 'Dairy Direct', 'Current'),
  -- bham — Pepperoni
  ('bham', 'Pepperoni', 'Feb 2026', 7.10, 'Italia Wholesale', 'Receipt OCR'),
  ('bham', 'Pepperoni', 'Mar 2026', 7.30, 'Italia Wholesale', 'Receipt OCR'),
  ('bham', 'Pepperoni', 'Apr 2026', 7.60, 'Italia Wholesale', 'Receipt OCR'),
  ('bham', 'Pepperoni', 'May 2026', 8.10, 'Italia Wholesale', 'Receipt OCR'),
  ('bham', 'Pepperoni', 'Jun 2026', 8.60, 'Italia Wholesale', 'Current'),
  -- leic — Ham
  ('leic', 'Ham', 'Feb 2026', 4.90, 'Midlands Meats', 'Receipt OCR'),
  ('leic', 'Ham', 'Mar 2026', 5.05, 'Midlands Meats', 'Receipt OCR'),
  ('leic', 'Ham', 'Apr 2026', 5.20, 'Midlands Meats', 'Receipt OCR'),
  ('leic', 'Ham', 'May 2026', 5.60, 'Midlands Meats', 'Receipt OCR'),
  ('leic', 'Ham', 'Jun 2026', 6.10, 'Midlands Meats', 'Current'),
  -- leic — Mozzarella
  ('leic', 'Mozzarella', 'Feb 2026', 5.65, 'Dairy Direct', 'Receipt OCR'),
  ('leic', 'Mozzarella', 'Mar 2026', 5.85, 'Dairy Direct', 'Receipt OCR'),
  ('leic', 'Mozzarella', 'Apr 2026', 6.10, 'Dairy Direct', 'Receipt OCR'),
  ('leic', 'Mozzarella', 'May 2026', 6.50, 'Dairy Direct', 'Receipt OCR'),
  ('leic', 'Mozzarella', 'Jun 2026', 6.85, 'Dairy Direct', 'Current'),
  -- cov — Beef mince
  ('cov',  'Beef mince', 'Feb 2026', 4.55, 'Midlands Meats', 'Receipt OCR'),
  ('cov',  'Beef mince', 'Mar 2026', 4.70, 'Midlands Meats', 'Receipt OCR'),
  ('cov',  'Beef mince', 'Apr 2026', 4.90, 'Midlands Meats', 'Receipt OCR'),
  ('cov',  'Beef mince', 'May 2026', 5.25, 'Midlands Meats', 'Receipt OCR'),
  ('cov',  'Beef mince', 'Jun 2026', 5.70, 'Midlands Meats', 'Current')
on conflict do nothing;


-- ---------------------------------------------------------------------------
-- INGREDIENT TRENDS  (advisor — price movement alerts)
-- ---------------------------------------------------------------------------
insert into public.ingredient_trends (location_id, name, old_cost, new_cost, unit, used_in)
values
  ('bham', 'Mozzarella', 6.20, 6.85, 'kg', 'Margherita (12")'),
  ('bham', 'Pepperoni',  7.80, 8.60, 'kg', 'Pepperoni (12")'),
  ('leic', 'Ham',        5.40, 6.10, 'kg', 'Hawaiian (12")'),
  ('leic', 'Mozzarella', 6.20, 6.85, 'kg', 'Margherita (12")'),
  ('cov',  'Beef mince', 5.00, 5.70, 'kg', 'Meat Feast (12")')
on conflict do nothing;


-- ---------------------------------------------------------------------------
-- ORDER MODIFIERS  (advisor — upsell patterns)
-- ---------------------------------------------------------------------------
insert into public.order_modifiers (location_id, base_item, addon, count, suggestion, suggested_price)
values
  ('bham', 'Margherita (12")', 'extra vegetables',  38, 'Vegetarian Pizza',        10.50),
  ('bham', 'Pepperoni (12")',  'extra cheese',       26, 'Extra-Cheese Pepperoni', 12.00),
  ('leic', 'Margherita (12")', 'added vegetables',   31, 'Vegetarian Pizza',        10.50),
  ('cov',  'Margherita (12")', 'extra vegetables',   22, 'Vegetarian Pizza',        10.50)
on conflict do nothing;


-- ---------------------------------------------------------------------------
-- CLOCK-INS  (advisor — punctuality data)
-- ---------------------------------------------------------------------------
insert into public.clock_ins (location_id, staff_name, role, late_count, avg_late_mins)
values
  ('bham', 'Tom Reeves',     'Delivery Driver', 5, 12),
  ('bham', 'Sofia Alves',    'Kitchen Porter',  3,  7),
  ('leic', 'Jamie Doyle',    'Delivery Driver', 4,  9),
  ('cov',  'Chloe Bennett',  'Delivery Driver', 6, 14)
on conflict do nothing;


-- ---------------------------------------------------------------------------
-- HOLIDAYS  (advisor — upcoming absence)
-- ---------------------------------------------------------------------------
insert into public.holidays (location_id, staff_name, role, start_date, end_date, weeks)
values
  ('bham', 'Marek Kowalski', 'Head Pizza Chef', '16 Jun', '30 Jun', 2),
  ('leic', 'Wei Chen',       'Pizza Chef',      '18 Jun', '25 Jun', 1),
  ('cov',  'Hassan Ali',     'Pizza Chef',      '20 Jun', '04 Jul', 2)
on conflict do nothing;
