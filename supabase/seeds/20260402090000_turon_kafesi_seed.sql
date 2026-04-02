-- Turon Kafesi single-restaurant seed (categories + products)
-- This seed keeps the app product-first and ensures home page sections render.

-- Categories
insert into menu_categories (slug, name_uz, name_ru, icon_url, sort_order, is_active)
values
  ('osh', 'Osh', null, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80', 1, true),
  ('shorva', 'Sho''rva', null, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80', 2, true),
  ('fast-food', 'Fast food', null, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80', 3, true),
  ('lavash', 'Lavash', null, 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=1200&q=80', 4, true),
  ('burger', 'Burger', null, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80', 5, true),
  ('donar', 'Donar', null, 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80', 6, true),
  ('grill', 'Grill', null, 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=1200&q=80', 7, true),
  ('pitsa', 'Pitsa', null, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80', 8, true),
  ('ichimliklar', 'Ichimliklar', null, 'https://images.unsplash.com/photo-1508253578933-20b529302151?auto=format&fit=crop&w=1200&q=80', 9, true),
  ('shirinliklar', 'Shirinliklar', null, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=80', 10, true),
  ('tortlar', 'Tortlar', null, 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1200&q=80', 11, true),
  ('somsa', 'Somsa', null, 'https://images.unsplash.com/photo-1542826438-4c8b6f1f27a0?auto=format&fit=crop&w=1200&q=80', 12, true),
  ('muzqaymoq', 'Muzqaymoq', null, 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=1200&q=80', 13, true)
on conflict (slug) do update
set name_uz = excluded.name_uz,
    icon_url = excluded.icon_url,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

-- Products
insert into menu_items (
  category_id, slug, name_uz, description_uz, price, old_price, image_url,
  weight_text, badge_text, is_featured, is_new, is_popular, is_discounted, discount_percent,
  is_active, availability_status, sort_order
)
values
  -- Osh
  ((select id from menu_categories where slug='osh'), 'osh-1-kg', 'Osh 1 kg', 'An''anaviy osh, oilaviy hajm.', 110000, 130000, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80', '1 kg', 'Aksiya', true, false, true, true, 15, true, 'AVAILABLE', 1),
  ((select id from menu_categories where slug='osh'), 'osh-1-porsiya', 'Osh 1 porsiya', 'Mazali osh, 1 porsiya.', 30000, null, 'https://images.unsplash.com/photo-1604908177522-022b08b1c6e5?auto=format&fit=crop&w=1200&q=80', '1 porsiya', 'Top', false, false, true, false, null, true, 'AVAILABLE', 2),

  -- Sho'rva
  ((select id from menu_categories where slug='shorva'), 'mastava', 'Mastava', 'Yengil va to''yimli sho''rva.', 24000, null, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80', '1 porsiya', null, false, false, false, false, null, true, 'AVAILABLE', 1),
  ((select id from menu_categories where slug='shorva'), 'shorva-mol', 'Sho''rva mol go''shti', 'Mol go''shtli sho''rva.', 26000, null, 'https://images.unsplash.com/photo-1505253216365-85f98fbcbb76?auto=format&fit=crop&w=1200&q=80', '1 porsiya', null, false, false, false, false, null, true, 'AVAILABLE', 2),
  ((select id from menu_categories where slug='shorva'), 'dolma-shorva', 'Dolma sho''rva', 'Dolma qo''shilgan sho''rva.', 28000, null, 'https://images.unsplash.com/photo-1498579809087-ef1e558fd1da?auto=format&fit=crop&w=1200&q=80', '1 porsiya', 'Yangi', false, true, false, false, null, true, 'AVAILABLE', 3),

  -- Fast food
  ((select id from menu_categories where slug='fast-food'), 'beshteks', 'Beshteks', 'Go''shtli beshteks.', 32000, null, 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1200&q=80', '1 dona', null, false, false, false, false, null, true, 'AVAILABLE', 1),
  ((select id from menu_categories where slug='fast-food'), 'assorti', 'Assorti', 'Turli taomlar jamlanmasi.', 99000, 115000, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80', '1 to''plam', 'Aksiya', true, false, true, true, 14, true, 'AVAILABLE', 2),
  ((select id from menu_categories where slug='fast-food'), 'qozonkabob', 'Qozonkabob', 'Qozonda pishirilgan go''sht.', 75000, null, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80', '1 porsiya', null, false, false, true, false, null, true, 'AVAILABLE', 3),
  ((select id from menu_categories where slug='fast-food'), 'jiz-mol-goshti', 'Jiz mol go''shti', 'Qovurilgan mol go''shti.', 68000, null, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80', '1 porsiya', null, false, false, false, false, null, true, 'AVAILABLE', 4),
  ((select id from menu_categories where slug='fast-food'), 'katlet-1-dona', 'Katlet 1 donasi', 'Uy usulida tayyorlangan katlet.', 9000, null, 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80', '1 dona', null, false, false, false, false, null, true, 'AVAILABLE', 5),
  ((select id from menu_categories where slug='fast-food'), 'dolma-1-dona', 'Dolma 1 dona', 'Uzum bargiga o''ralgan dolma.', 7000, null, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80', '1 dona', null, false, false, false, false, null, true, 'AVAILABLE', 6),
  ((select id from menu_categories where slug='fast-food'), 'xot-dog', 'Xot-dog', 'Klassik xot-dog.', 18000, null, 'https://images.unsplash.com/photo-1619740455993-9c86b1a2a2c8?auto=format&fit=crop&w=1200&q=80', '1 dona', null, false, false, false, false, null, true, 'AVAILABLE', 7),
  ((select id from menu_categories where slug='fast-food'), 'xot-dog-goshtli', 'Xot-dog go''shtli', 'Go''shtli xot-dog.', 22000, null, 'https://images.unsplash.com/photo-1619740455993-9c86b1a2a2c8?auto=format&fit=crop&w=1200&q=80', '1 dona', null, false, false, false, false, null, true, 'AVAILABLE', 8),

  -- Lavash
  ((select id from menu_categories where slug='lavash'), 'lavash-oddiy', 'Lavash oddiy', 'Klassik lavash, tovuq go''shti bilan.', 28000, null, 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=1200&q=80', '1 dona', 'Top', false, false, true, false, null, true, 'AVAILABLE', 1),
  ((select id from menu_categories where slug='lavash'), 'lavash-big', 'Lavash big', 'Katta hajmli lavash.', 34000, 39000, 'https://images.unsplash.com/photo-1530469912745-a215c6b256ea?auto=format&fit=crop&w=1200&q=80', '1 dona', 'Aksiya', false, false, true, true, 13, true, 'AVAILABLE', 2),
  ((select id from menu_categories where slug='lavash'), 'lavash-tandir', 'Lavash tandir', 'Tandir nonli lavash.', 32000, null, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1200&q=80', '1 dona', 'Yangi', false, true, false, false, null, true, 'AVAILABLE', 3),
  ((select id from menu_categories where slug='lavash'), 'lavash-chiz', 'Lavash chiz', 'Pishloqli lavash.', 30000, null, 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=1200&q=80', '1 dona', null, false, false, false, false, null, true, 'AVAILABLE', 4),
  ((select id from menu_categories where slug='lavash'), 'lavash-achiq', 'Lavash achiq', 'Achchiq sousli lavash.', 30000, null, 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=1200&q=80', '1 dona', null, false, false, false, false, null, true, 'AVAILABLE', 5),

  -- Burger
  ((select id from menu_categories where slug='burger'), 'gamburger', 'Gamburger', 'Oddiy gamburger.', 23000, null, 'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=1200&q=80', '1 dona', null, false, false, false, false, null, true, 'AVAILABLE', 1),
  ((select id from menu_categories where slug='burger'), 'dabl-gamburger', 'Dabl gamburger', 'Ikki kotletli burger.', 32000, 36000, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80', '1 dona', 'Aksiya', true, false, true, true, 11, true, 'AVAILABLE', 2),
  ((select id from menu_categories where slug='burger'), 'chiz-burger', 'Chiz burger', 'Pishloqli burger.', 26000, null, 'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=1200&q=80', '1 dona', 'Top', false, false, true, false, null, true, 'AVAILABLE', 3),
  ((select id from menu_categories where slug='burger'), 'non-burger', 'Non burger', 'Nonli burger, ixcham.', 22000, null, 'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=1200&q=80', '1 dona', null, false, false, false, false, null, true, 'AVAILABLE', 4),

  -- Donar
  ((select id from menu_categories where slug='donar'), 'doner', 'Doner', 'Donar go''shti, maxsus sous.', 30000, null, 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80', '1 dona', 'Top', false, false, true, false, null, true, 'AVAILABLE', 1),

  -- Grill / KFC
  ((select id from menu_categories where slug='grill'), 'kfc-1-kg', 'KFC 1 kg', 'KFC tovuq, katta to''plam.', 95000, 110000, 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=1200&q=80', '1 kg', 'Aksiya', true, false, true, true, 14, true, 'AVAILABLE', 1),
  ((select id from menu_categories where slug='grill'), 'kfc-1-porsiya', 'KFC 1 porsiya', 'KFC tovuq, 1 porsiya.', 32000, null, 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=1200&q=80', '1 porsiya', null, false, false, false, false, null, true, 'AVAILABLE', 2),
  ((select id from menu_categories where slug='grill'), 'grill', 'Grill', 'Grill tovuq.', 60000, null, 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=1200&q=80', '1 dona', null, false, false, false, false, null, true, 'AVAILABLE', 3),
  ((select id from menu_categories where slug='grill'), 'grill-1-porsiya', 'Grill 1 porsiya', 'Grill tovuq, 1 porsiya.', 28000, null, 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=1200&q=80', '1 porsiya', 'Yangi', false, true, false, false, null, true, 'AVAILABLE', 4),

  -- Pitsa
  ((select id from menu_categories where slug='pitsa'), 'pitsa-goshtli', 'Pitsa go''shtli', 'Go''shtli pitsa.', 72000, null, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80', '30 sm', null, false, false, false, false, null, true, 'AVAILABLE', 1),
  ((select id from menu_categories where slug='pitsa'), 'pitsa-qaziqli', 'Pitsa qaziqli', 'Qazi qo''shilgan pitsa.', 76000, 86000, 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80', '30 sm', 'Aksiya', false, false, true, true, 12, true, 'AVAILABLE', 2),
  ((select id from menu_categories where slug='pitsa'), 'pitsa-pepperoni', 'Pitsa pepperoni', 'Pepperoni va pishloq.', 78000, null, 'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?auto=format&fit=crop&w=1200&q=80', '30 sm', 'Top', false, true, true, false, null, true, 'AVAILABLE', 3),

  -- Somsa
  ((select id from menu_categories where slug='somsa'), 'somsa-kartoshkali', 'Somsa kartoshkali', 'Kartoshka va piyoz.', 7000, null, 'https://images.unsplash.com/photo-1542826438-4c8b6f1f27a0?auto=format&fit=crop&w=1200&q=80', '1 dona', null, false, false, false, false, null, true, 'AVAILABLE', 1),
  ((select id from menu_categories where slug='somsa'), 'somsa-kokatli', 'Somsa ko''katli', 'Ko''katli somsa.', 7000, null, 'https://images.unsplash.com/photo-1542826438-4c8b6f1f27a0?auto=format&fit=crop&w=1200&q=80', '1 dona', 'Yangi', false, true, false, false, null, true, 'AVAILABLE', 2),

  -- Ichimliklar
  ((select id from menu_categories where slug='ichimliklar'), 'limon-choy', 'Limon choy', 'Limonli choy.', 12000, null, 'https://images.unsplash.com/photo-1508253578933-20b529302151?auto=format&fit=crop&w=1200&q=80', '400 ml', null, false, false, false, false, null, true, 'AVAILABLE', 1),
  ((select id from menu_categories where slug='ichimliklar'), 'matina-choy', 'Matina choy', 'Matina choy.', 12000, null, 'https://images.unsplash.com/photo-1459755486867-b55449bb39ff?auto=format&fit=crop&w=1200&q=80', '400 ml', null, false, false, false, false, null, true, 'AVAILABLE', 2),
  ((select id from menu_categories where slug='ichimliklar'), 'mevali-choy', 'Mevali choy', 'Mevali choy.', 14000, null, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80', '400 ml', 'Yangi', false, true, false, false, null, true, 'AVAILABLE', 3),
  ((select id from menu_categories where slug='ichimliklar'), 'americano', 'Americano', 'Qora qahva.', 16000, null, 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80', '250 ml', null, false, false, false, false, null, true, 'AVAILABLE', 4),
  ((select id from menu_categories where slug='ichimliklar'), 'cappuccino', 'Cappuccino', 'Sutli qahva.', 20000, null, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80', '250 ml', null, false, false, false, false, null, true, 'AVAILABLE', 5),

  -- Shirinliklar / Tortlar / Muzqaymoq
  ((select id from menu_categories where slug='tortlar'), 'tortlar', 'Tortlar', 'Kremli tortlar.', 45000, null, 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1200&q=80', '1 bo''lak', null, false, false, false, false, null, true, 'AVAILABLE', 1),
  ((select id from menu_categories where slug='shirinliklar'), 'pirojniylar', 'Pirojniylar', 'Yengil pirojniy.', 18000, null, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=80', '1 dona', null, false, false, false, false, null, true, 'AVAILABLE', 1),
  ((select id from menu_categories where slug='shirinliklar'), 'desertlar', 'Desertlar', 'Shirin desertlar.', 20000, null, 'https://images.unsplash.com/photo-1481391032119-d89fee407e44?auto=format&fit=crop&w=1200&q=80', '1 dona', 'Yangi', false, true, false, false, null, true, 'AVAILABLE', 2),
  ((select id from menu_categories where slug='muzqaymoq'), 'muzqaymoq', 'Muzqaymoq', 'Sovuq muzqaymoq.', 12000, null, 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=1200&q=80', '120 g', null, false, false, true, false, null, true, 'AVAILABLE', 1)
on conflict (slug) do update
set name_uz = excluded.name_uz,
    description_uz = excluded.description_uz,
    price = excluded.price,
    old_price = excluded.old_price,
    image_url = excluded.image_url,
    weight_text = excluded.weight_text,
    badge_text = excluded.badge_text,
    is_featured = excluded.is_featured,
    is_new = excluded.is_new,
    is_popular = excluded.is_popular,
    is_discounted = excluded.is_discounted,
    discount_percent = excluded.discount_percent,
    is_active = excluded.is_active,
    availability_status = excluded.availability_status,
    sort_order = excluded.sort_order,
    updated_at = now();
