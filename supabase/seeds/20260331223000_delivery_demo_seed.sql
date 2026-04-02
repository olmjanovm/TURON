begin;

-- Deterministic development/demo seed for the Turon Mini App.
-- Uses fixed UUIDs so the script can be re-applied safely.

delete from public.audit_logs where id in (
  'b0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000004','b0000000-0000-4000-8000-000000000005'
);
delete from public.notifications where id in (
  'a0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000004',
  'a0000000-0000-4000-8000-000000000005','a0000000-0000-4000-8000-000000000006','a0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000008'
);
delete from public.payments where id in (
  '90000000-0000-4000-8000-000000000001','90000000-0000-4000-8000-000000000002','90000000-0000-4000-8000-000000000003','90000000-0000-4000-8000-000000000004',
  '90000000-0000-4000-8000-000000000005','90000000-0000-4000-8000-000000000006','90000000-0000-4000-8000-000000000007'
);
delete from public.courier_assignments where id in (
  '80000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000002','80000000-0000-4000-8000-000000000003','80000000-0000-4000-8000-000000000004','80000000-0000-4000-8000-000000000005'
);
delete from public.order_items where id in (
  '70000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000003','70000000-0000-4000-8000-000000000004',
  '70000000-0000-4000-8000-000000000005','70000000-0000-4000-8000-000000000006','70000000-0000-4000-8000-000000000007','70000000-0000-4000-8000-000000000008',
  '70000000-0000-4000-8000-000000000009','70000000-0000-4000-8000-000000000010','70000000-0000-4000-8000-000000000011','70000000-0000-4000-8000-000000000012',
  '70000000-0000-4000-8000-000000000013','70000000-0000-4000-8000-000000000014'
);
delete from public.orders where id in (
  '60000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000004',
  '60000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000006','60000000-0000-4000-8000-000000000007'
);
delete from public.addresses where id in (
  '20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000005'
);
delete from public.menu_items where id in (
  '40000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000004',
  '40000000-0000-4000-8000-000000000005','40000000-0000-4000-8000-000000000006','40000000-0000-4000-8000-000000000007','40000000-0000-4000-8000-000000000008',
  '40000000-0000-4000-8000-000000000009','40000000-0000-4000-8000-000000000010','40000000-0000-4000-8000-000000000011','40000000-0000-4000-8000-000000000012',
  '40000000-0000-4000-8000-000000000013','40000000-0000-4000-8000-000000000014','40000000-0000-4000-8000-000000000015','40000000-0000-4000-8000-000000000016',
  '40000000-0000-4000-8000-000000000017','40000000-0000-4000-8000-000000000018','40000000-0000-4000-8000-000000000019','40000000-0000-4000-8000-000000000020',
  '40000000-0000-4000-8000-000000000021','40000000-0000-4000-8000-000000000022','40000000-0000-4000-8000-000000000023','40000000-0000-4000-8000-000000000024',
  '40000000-0000-4000-8000-000000000025','40000000-0000-4000-8000-000000000026'
);
delete from public.menu_categories where id in (
  '30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000004',
  '30000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000006','30000000-0000-4000-8000-000000000007','30000000-0000-4000-8000-000000000008'
);
delete from public.promo_codes where id in (
  '50000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000004'
);
delete from public.users where id in (
  '10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000006'
);

insert into public.users (id, telegram_id, full_name, phone, role, language, is_active, created_at, updated_at) values
  ('10000000-0000-4000-8000-000000000001', 7812345001, 'Ibrohim Yuldashev', '+998901112200', 'ADMIN', 'UZ', true, now() - interval '60 days', now() - interval '2 days'),
  ('10000000-0000-4000-8000-000000000002', 7812345002, 'Jasur Rahimov', '+998901112201', 'COURIER', 'UZ', true, now() - interval '45 days', now() - interval '4 hours'),
  ('10000000-0000-4000-8000-000000000003', 7812345003, 'Bekzod Aliev', '+998901112202', 'COURIER', 'RU', true, now() - interval '43 days', now() - interval '30 minutes'),
  ('10000000-0000-4000-8000-000000000004', 7812345004, 'Akmal Karimov', '+998901112203', 'CUSTOMER', 'UZ', true, now() - interval '40 days', now() - interval '10 minutes'),
  ('10000000-0000-4000-8000-000000000005', 7812345005, 'Dilorom Sodiqova', '+998933334455', 'CUSTOMER', 'RU', true, now() - interval '38 days', now() - interval '20 minutes'),
  ('10000000-0000-4000-8000-000000000006', 7812345006, 'Timur Xasanov', '+998977778899', 'CUSTOMER', 'UZ', true, now() - interval '35 days', now() - interval '1 hour');

insert into public.addresses (id, user_id, label, address_text, latitude, longitude, note, is_default, created_at, updated_at) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 'Uy', 'Toshkent shahri, Chilonzor 9-kvartal, 12-uy', 41.2856800, 69.2034600, 'Domofon ishlamaydi, qongiroq qiling', true, now() - interval '30 days', now() - interval '2 days'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000004', 'Ishxona', 'Toshkent shahri, Shayxontohur tumani, Beruniy kochasi 18', 41.3245400, 69.2286800, 'Biznes markaz, 3-qavat, resepshnga ayting', false, now() - interval '20 days', now() - interval '1 day'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000005', 'Uy', 'Toshkent shahri, Yunusobod 4-mavze, 45-uy', 41.3661800, 69.2887700, 'Lift yonida kutib oling', true, now() - interval '28 days', now() - interval '3 hours'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000006', 'Uy', 'Toshkent shahri, Mirzo Ulugbek tumani, Buyuk Ipak Yoli 102', 41.3381000, 69.3349000, 'Qizil darvoza, qoriqchiga ayting', true, now() - interval '24 days', now() - interval '5 hours'),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000006', 'Ofis', 'Toshkent shahri, Yakkasaroy tumani, Bobur kochasi 7', 41.2924100, 69.2549800, '2-kirish, qabulxona yonida', false, now() - interval '18 days', now() - interval '6 hours');

insert into public.menu_categories (id, name_uz, name_ru, slug, sort_order, is_active, created_at, updated_at) values
  ('30000000-0000-4000-8000-000000000001', 'Donar', 'Doner', 'donar', 1, true, now() - interval '25 days', now() - interval '2 days'),
  ('30000000-0000-4000-8000-000000000002', 'Lavash', 'Lavash', 'lavash', 2, true, now() - interval '25 days', now() - interval '2 days'),
  ('30000000-0000-4000-8000-000000000003', 'Pizza', 'Pitsa', 'pizza', 3, true, now() - interval '25 days', now() - interval '2 days'),
  ('30000000-0000-4000-8000-000000000004', 'Burger', 'Burger', 'burger', 4, true, now() - interval '25 days', now() - interval '2 days'),
  ('30000000-0000-4000-8000-000000000005', 'Ichimliklar', 'Napitki', 'drinks', 5, true, now() - interval '25 days', now() - interval '2 days'),
  ('30000000-0000-4000-8000-000000000006', 'Salatlar', 'Salaty', 'salads', 6, true, now() - interval '25 days', now() - interval '2 days'),
  ('30000000-0000-4000-8000-000000000007', 'Desert', 'Deserty', 'desserts', 7, true, now() - interval '25 days', now() - interval '2 days'),
  ('30000000-0000-4000-8000-000000000008', 'Kombo', 'Kombo', 'combo', 8, true, now() - interval '25 days', now() - interval '2 days');

insert into public.menu_items (id, category_id, name_uz, name_ru, description_uz, description_ru, price, image_url, is_active, availability_status, stock_quantity, created_at, updated_at) values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Klassik donar', 'Klassicheskiy doner', 'Mol goshti, yangi sabzavot va maxsus sous bilan.', 'Govyadina, svezhie ovoschi i firmennyy sous.', 32000, 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 40, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'Achchiq donar', 'Ostryy doner', 'Jalapeno va achchiq sousli shirador donar.', 'Sochnyy doner s halapeno i ostrym sousom.', 34000, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 24, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'Pishloqli donar', 'Doner s syrom', 'Qovurilgan pishloq qatlamli toyimli donar.', 'Sytnyy doner s rasplavlennym syrom.', 36000, 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 18, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000002', 'Tovuq lavash', 'Lavash s kuritsej', 'Tovuq filesi, fri va sarimsoqli sousli lavash.', 'Lavash s kurinym file, kartofelem fri i chesnochnym sousom.', 30000, 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 35, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000002', 'Mol goshtli lavash', 'Lavash s govyadinoy', 'Mol goshti va kokatlar bilan tayyorlanadi.', 'Gotovitsya s govyadinoy i svezhey zelenyu.', 34000, 'https://images.unsplash.com/photo-1530469912745-a215c6b256ea?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 28, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000002', 'Mini lavash', 'Mini lavash', 'Yengil tamaddi uchun ixcham variant.', 'Kompaktnyy variant dlya legkogo perekusa.', 23000, 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 21, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000002', 'Katta lavash', 'Bolshoy lavash', 'Qoshimcha gosht va ikki karra sous bilan.', 'S dopolnitelnym myasom i dvoynym sousom.', 39000, 'https://images.unsplash.com/photo-1530469912745-a215c6b256ea?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 15, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000003', 'Pepperoni pizza', 'Pitsa pepperoni', 'Pepperoni kolbasa va mol pishloq bilan.', 'Pepperoni i mnogo syra.', 85000, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 12, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000003', 'Margarita pizza', 'Pitsa margarita', 'Pomidor, mozzarella va bazilik uygunligi.', 'Tomaty, motsarella i bazilik.', 76000, 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 10, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000003', 'Goshtli pizza', 'Myasnaya pitsa', 'Kolbasa, dudlangan gosht va mol goshti bilan.', 'S kolbasoy, kopchenym myasom i govyadinoy.', 92000, 'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 8, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000003', 'Tovuq qozikorin pizza', 'Pitsa s kuritsey i gribami', 'Tovuq filesi, qozikorin va qaymoqli sous.', 'Kurinoe file, griby i slivochnyy sous.', 88000, 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 6, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000004', 'Klassik burger', 'Klassicheskiy burger', 'Mol goshti kotleti, salat va sous bilan.', 'Kotleta iz govyadiny, salat i sous.', 42000, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 22, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000004', 'Double cheeseburger', 'Dvoynoy chizburger', 'Ikki qavat kotlet va cheddar pishlogi bilan.', 'Dve kotlety i syr cheddar.', 56000, 'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 14, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000004', 'Tovuq burger', 'Kurinyy burger', 'Qarsildoq tovuq filesi va coleslaw bilan.', 'Hrastyaschee kurinoe file i koul slou.', 39000, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 20, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000015', '30000000-0000-4000-8000-000000000005', 'Coca-Cola 0.5L', 'Coca-Cola 0.5L', 'Sovuq gazli ichimlik.', 'Holodnyy gazirovannyy napitok.', 9000, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 60, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000016', '30000000-0000-4000-8000-000000000005', 'Fanta 0.5L', 'Fanta 0.5L', 'Apelsin tamli ichimlik.', 'Apelsinovyy napitok.', 9000, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 40, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000017', '30000000-0000-4000-8000-000000000005', 'Gazsiz suv', 'Voda bez gaza', 'Tabiiy ichimlik suvi.', 'Pitievaya voda bez gaza.', 5000, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 100, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000018', '30000000-0000-4000-8000-000000000005', 'Ayran', 'Ayran', 'Muzdek ayran.', 'Holodnyy ayran.', 8000, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 35, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000019', '30000000-0000-4000-8000-000000000006', 'Sezar salat', 'Salat Tsezar', 'Tovuq, salat bargi va sous bilan.', 'Kuritsa, listya salata i sous.', 33000, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 16, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000020', '30000000-0000-4000-8000-000000000006', 'Achchiq-chuchuk', 'Ostryy sladkiy salat', 'Sabzavotli yengil salat.', 'Legkiy ovoschnoy salat.', 18000, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 18, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000021', '30000000-0000-4000-8000-000000000006', 'Grek salati', 'Grek salat', 'Feta va yangi sabzavot bilan.', 'S fetoy i svezhimi ovoschami.', 30000, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1200&q=80', true, 'TEMPORARILY_UNAVAILABLE', 0, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000022', '30000000-0000-4000-8000-000000000007', 'Medovik', 'Medovik', 'Uy usulidagi asal tort.', 'Domashniy medovik.', 22000, 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 12, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000023', '30000000-0000-4000-8000-000000000007', 'Brauni', 'Brauni', 'Shokoladli desert.', 'Shokoladnyy desert.', 24000, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=80', false, 'AVAILABLE', 10, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000024', '30000000-0000-4000-8000-000000000007', 'Chizkeyk', 'Chizkeyk', 'Qaymoqli pishloqli desert.', 'Nezhnyy syirnyy desert.', 28000, 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 8, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000025', '30000000-0000-4000-8000-000000000008', 'Oilaviy kombo', 'Semeynyy kombo', 'Katta buyurtmalar uchun oilaviy toplam.', 'Semeynyy nabor dlya bolshogo zakaza.', 149000, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80', true, 'OUT_OF_STOCK', 0, now() - interval '20 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000026', '30000000-0000-4000-8000-000000000008', 'Lunch kombo', 'Lunch kombo', 'Tushlik uchun qulay kombo.', 'Udobnyy kombo dlya obeda.', 69000, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80', true, 'AVAILABLE', 18, now() - interval '20 days', now() - interval '1 day');

insert into public.promo_codes (id, code, title, discount_type, discount_value, min_order_amount, usage_limit, used_count, starts_at, expires_at, is_active, created_at, updated_at) values
  ('50000000-0000-4000-8000-000000000001', 'WELCOME10', 'Yangi mijozlar uchun 10 foiz chegirma', 'PERCENTAGE', 10, 50000, 100, 0, now() - interval '10 days', now() + interval '90 days', true, now() - interval '10 days', now() - interval '1 day'),
  ('50000000-0000-4000-8000-000000000002', 'KOMBO15000', 'Katta buyurtma uchun 15000 so`m chegirma', 'FIXED_AMOUNT', 15000, 90000, 50, 0, now() - interval '5 days', now() + interval '30 days', true, now() - interval '5 days', now() - interval '1 day'),
  ('50000000-0000-4000-8000-000000000003', 'RAMADAN20', 'Ramazon aksiyasi 20 foiz', 'PERCENTAGE', 20, 70000, 200, 0, now() - interval '60 days', now() - interval '10 days', false, now() - interval '60 days', now() - interval '10 days'),
  ('50000000-0000-4000-8000-000000000004', 'NEWYEAR30000', 'Yangi yil uchun 30000 so`m chegirma', 'FIXED_AMOUNT', 30000, 150000, 300, 0, now() + interval '120 days', now() + interval '150 days', true, now() - interval '2 days', now() - interval '2 days');

insert into public.orders (
  id, user_id, address_id, courier_id, promo_code_id, order_number, status, subtotal, discount_amount, delivery_fee, total_amount,
  payment_method, payment_status, note, customer_latitude, customer_longitude, created_at, updated_at
) values
  ('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', null, null, 100001, 'PENDING', 39000, 0, 12000, 51000, 'CASH', 'PENDING', 'Tezroq yetkazib bering, iltimos.', 41.2856800, 69.2034600, now() - interval '2 hours', now() - interval '2 hours'),
  ('60000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000003', null, '50000000-0000-4000-8000-000000000001', 100002, 'PREPARING', 103000, 10300, 15000, 107700, 'MANUAL_TRANSFER', 'PENDING', 'Qo`ng`iroq qilmasdan yetkazsangiz yaxshi.', 41.3661800, 69.2887700, now() - interval '90 minutes', now() - interval '35 minutes'),
  ('60000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000002', 100003, 'READY_FOR_PICKUP', 102000, 15000, 12000, 99000, 'EXTERNAL_PAYMENT', 'COMPLETED', 'Ofis uchun buyurtma.', 41.3381000, 69.3349000, now() - interval '80 minutes', now() - interval '20 minutes'),
  ('60000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003', null, 100004, 'DELIVERING', 102000, 0, 16000, 118000, 'CASH', 'PENDING', 'Qo`riqchiga aytmang, o`zim tushaman.', 41.3245400, 69.2286800, now() - interval '50 minutes', now() - interval '8 minutes'),
  ('60000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', null, 100005, 'DELIVERING', 77000, 0, 12000, 89000, 'MANUAL_TRANSFER', 'PENDING', 'Lift oldida kutaman.', 41.3661800, 69.2887700, now() - interval '35 minutes', now() - interval '6 minutes'),
  ('60000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000001', 100006, 'DELIVERED', 115000, 11500, 14000, 117500, 'EXTERNAL_PAYMENT', 'COMPLETED', 'Recepshnga qoldirish mumkin.', 41.2924100, 69.2549800, now() - interval '1 day', now() - interval '18 hours'),
  ('60000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', null, 100007, 'CANCELLED', 149000, 0, 15000, 164000, 'MANUAL_TRANSFER', 'FAILED', 'Mijoz manzilni o`zgartirgani uchun bekor qilingan.', 41.2856800, 69.2034600, now() - interval '3 days', now() - interval '3 days');

insert into public.order_items (id, order_id, menu_item_id, item_name_snapshot, item_price_snapshot, quantity, total_price, created_at) values
  ('70000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000004', 'Tovuq lavash', 30000, 1, 30000, now() - interval '2 hours'),
  ('70000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000015', 'Coca-Cola 0.5L', 9000, 1, 9000, now() - interval '2 hours'),
  ('70000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000008', 'Pepperoni pizza', 85000, 1, 85000, now() - interval '90 minutes'),
  ('70000000-0000-4000-8000-000000000004', '60000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000015', 'Coca-Cola 0.5L', 9000, 2, 18000, now() - interval '90 minutes'),
  ('70000000-0000-4000-8000-000000000005', '60000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000012', 'Klassik burger', 42000, 2, 84000, now() - interval '80 minutes'),
  ('70000000-0000-4000-8000-000000000006', '60000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000016', 'Fanta 0.5L', 9000, 2, 18000, now() - interval '80 minutes'),
  ('70000000-0000-4000-8000-000000000007', '60000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000010', 'Goshtli pizza', 92000, 1, 92000, now() - interval '50 minutes'),
  ('70000000-0000-4000-8000-000000000008', '60000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000017', 'Gazsiz suv', 5000, 2, 10000, now() - interval '50 minutes'),
  ('70000000-0000-4000-8000-000000000009', '60000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000026', 'Lunch kombo', 69000, 1, 69000, now() - interval '35 minutes'),
  ('70000000-0000-4000-8000-000000000010', '60000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000018', 'Ayran', 8000, 1, 8000, now() - interval '35 minutes'),
  ('70000000-0000-4000-8000-000000000011', '60000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000001', 'Klassik donar', 32000, 2, 64000, now() - interval '1 day'),
  ('70000000-0000-4000-8000-000000000012', '60000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000019', 'Sezar salat', 33000, 1, 33000, now() - interval '1 day'),
  ('70000000-0000-4000-8000-000000000013', '60000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000015', 'Coca-Cola 0.5L', 9000, 2, 18000, now() - interval '1 day'),
  ('70000000-0000-4000-8000-000000000014', '60000000-0000-4000-8000-000000000007', '40000000-0000-4000-8000-000000000025', 'Oilaviy kombo', 149000, 1, 149000, now() - interval '3 days');

insert into public.courier_assignments (
  id, order_id, courier_id, assigned_at, accepted_at, picked_up_at, delivering_at, delivered_at, cancelled_at,
  status, eta_minutes, distance_meters, created_at, updated_at
) values
  ('80000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', now() - interval '50 minutes', now() - interval '45 minutes', null, null, null, null, 'ACCEPTED', 18, 5200, now() - interval '50 minutes', now() - interval '20 minutes'),
  ('80000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000003', now() - interval '35 minutes', now() - interval '30 minutes', now() - interval '20 minutes', null, null, null, 'PICKED_UP', 16, 4300, now() - interval '35 minutes', now() - interval '8 minutes'),
  ('80000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', now() - interval '25 minutes', now() - interval '22 minutes', now() - interval '15 minutes', now() - interval '10 minutes', null, null, 'DELIVERING', 9, 2800, now() - interval '25 minutes', now() - interval '6 minutes'),
  ('80000000-0000-4000-8000-000000000004', '60000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000003', now() - interval '1 day 2 hours', now() - interval '1 day 1 hour 50 minutes', now() - interval '1 day 1 hour 20 minutes', now() - interval '1 day 55 minutes', now() - interval '1 day 30 minutes', null, 'DELIVERED', 0, 0, now() - interval '1 day 2 hours', now() - interval '18 hours'),
  ('80000000-0000-4000-8000-000000000005', '60000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', now() - interval '3 days 2 hours', null, null, null, null, now() - interval '3 days 1 hour 45 minutes', 'CANCELLED', null, null, now() - interval '3 days 2 hours', now() - interval '3 days');

insert into public.payments (
  id, order_id, method, status, amount, provider, provider_transaction_id, admin_verified_by, verified_at, rejection_reason, created_at, updated_at
) values
  ('90000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 'CASH', 'PENDING', 51000, null, null, null, null, null, now() - interval '2 hours', now() - interval '2 hours'),
  ('90000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000002', 'MANUAL_TRANSFER', 'PENDING', 107700, 'Click QR', null, null, null, null, now() - interval '90 minutes', now() - interval '35 minutes'),
  ('90000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000003', 'EXTERNAL_PAYMENT', 'COMPLETED', 99000, 'Payme', 'payme-demo-100003', null, null, null, now() - interval '80 minutes', now() - interval '20 minutes'),
  ('90000000-0000-4000-8000-000000000004', '60000000-0000-4000-8000-000000000004', 'CASH', 'PENDING', 118000, null, null, null, null, null, now() - interval '50 minutes', now() - interval '8 minutes'),
  ('90000000-0000-4000-8000-000000000005', '60000000-0000-4000-8000-000000000005', 'MANUAL_TRANSFER', 'PENDING', 89000, 'Bank transfer', null, null, null, null, now() - interval '35 minutes', now() - interval '6 minutes'),
  ('90000000-0000-4000-8000-000000000006', '60000000-0000-4000-8000-000000000006', 'EXTERNAL_PAYMENT', 'COMPLETED', 117500, 'Click', 'click-demo-100006', null, null, null, now() - interval '1 day', now() - interval '18 hours'),
  ('90000000-0000-4000-8000-000000000007', '60000000-0000-4000-8000-000000000007', 'MANUAL_TRANSFER', 'FAILED', 164000, 'Payme', null, '10000000-0000-4000-8000-000000000001', now() - interval '3 days 1 hour 30 minutes', 'Tolov cheki tasdiqlanmadi', now() - interval '3 days', now() - interval '3 days');

insert into public.notifications (id, user_id, role_target, type, title, message, related_order_id, is_read, created_at) values
  ('a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 'CUSTOMER', 'ORDER_STATUS_UPDATE', 'Buyurtma qabul qilindi', '100001-raqamli buyurtmangiz qabul qilindi va tez orada tasdiqlanadi.', '60000000-0000-4000-8000-000000000001', false, now() - interval '2 hours'),
  ('a0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000005', 'CUSTOMER', 'ORDER_STATUS_UPDATE', 'Buyurtma tayyorlanmoqda', '100002-raqamli buyurtmangiz oshxonada tayyorlanmoqda.', '60000000-0000-4000-8000-000000000002', false, now() - interval '50 minutes'),
  ('a0000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000006', 'CUSTOMER', 'SUCCESS', 'Buyurtma yetkazildi', '100006-raqamli buyurtmangiz muvaffaqiyatli yetkazildi.', '60000000-0000-4000-8000-000000000006', true, now() - interval '18 hours'),
  ('a0000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', 'COURIER', 'ADMIN_NOTICE', 'Yangi yetkazma biriktirildi', '100005-raqamli buyurtma sizga biriktirildi.', '60000000-0000-4000-8000-000000000005', false, now() - interval '25 minutes'),
  ('a0000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000003', 'COURIER', 'SUCCESS', 'Yetkazma yopildi', '100006-raqamli yetkazma muvaffaqiyatli yopildi.', '60000000-0000-4000-8000-000000000006', true, now() - interval '17 hours'),
  ('a0000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', 'ADMIN', 'ADMIN_NOTICE', 'Tolovni tekshirish kerak', '100002-raqamli buyurtma uchun manual transfer tolovi tekshirilishi kerak.', '60000000-0000-4000-8000-000000000002', false, now() - interval '40 minutes'),
  ('a0000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000004', 'CUSTOMER', 'PROMO_CAMPAIGN', 'WELCOME10 faol', '50 000 somdan yuqori buyurtmalarda 10 foizlik chegirma ishlating.', null, false, now() - interval '12 hours'),
  ('a0000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000002', 'COURIER', 'WARNING', 'Buyurtma bekor qilindi', '100007-raqamli buyurtma bekor qilindi, yangi topshiriqni kuting.', '60000000-0000-4000-8000-000000000007', true, now() - interval '3 days');

insert into public.audit_logs (id, actor_user_id, actor_role, action_type, entity_type, entity_id, before_state, after_state, metadata, created_at) values
  (
    'b0000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'ADMIN',
    'PROMO_CREATED',
    'promo_codes',
    '50000000-0000-4000-8000-000000000001',
    null,
    '{"code":"WELCOME10","discount_type":"PERCENTAGE","discount_value":10}'::jsonb,
    '{"source":"seed","comment":"Admin welcome promo yaratdi"}'::jsonb,
    now() - interval '10 days'
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'ADMIN',
    'COURIER_ASSIGNED',
    'orders',
    '60000000-0000-4000-8000-000000000003',
    '{"courier_id":null}'::jsonb,
    '{"courier_id":"10000000-0000-4000-8000-000000000002"}'::jsonb,
    '{"order_number":100003}'::jsonb,
    now() - interval '50 minutes'
  ),
  (
    'b0000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    'COURIER',
    'ORDER_DELIVERED',
    'courier_assignments',
    '80000000-0000-4000-8000-000000000004',
    '{"status":"DELIVERING"}'::jsonb,
    '{"status":"DELIVERED"}'::jsonb,
    '{"order_id":"60000000-0000-4000-8000-000000000006"}'::jsonb,
    now() - interval '18 hours'
  ),
  (
    'b0000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    'ADMIN',
    'PAYMENT_REJECTED',
    'payments',
    '90000000-0000-4000-8000-000000000007',
    '{"status":"PENDING"}'::jsonb,
    '{"status":"FAILED","rejection_reason":"Tolov cheki tasdiqlanmadi"}'::jsonb,
    '{"order_id":"60000000-0000-4000-8000-000000000007"}'::jsonb,
    now() - interval '3 days 1 hour 30 minutes'
  ),
  (
    'b0000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000001',
    'ADMIN',
    'MENU_AVAILABILITY_CHANGED',
    'menu_items',
    '40000000-0000-4000-8000-000000000021',
    '{"availability_status":"AVAILABLE"}'::jsonb,
    '{"availability_status":"TEMPORARILY_UNAVAILABLE"}'::jsonb,
    '{"reason":"Ingredient yetishmayapti"}'::jsonb,
    now() - interval '1 day'
  );

update public.promo_codes pc
set used_count = (
  select count(*)::integer
  from public.orders o
  where o.promo_code_id = pc.id
    and o.status <> 'CANCELLED'
)
where pc.id in (
  '50000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000002',
  '50000000-0000-4000-8000-000000000003',
  '50000000-0000-4000-8000-000000000004'
);

select setval(
  pg_get_serial_sequence('public.orders', 'order_number'),
  greatest((select coalesce(max(order_number), 1) from public.orders), 1),
  true
);

commit;
