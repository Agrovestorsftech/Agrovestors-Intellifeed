
-- Seed farmers (visible to staff roles)
INSERT INTO public.farmers (name, farm_name, phone, region, livestock_type, status) VALUES
('James Okoro','Green Valley Farm','+2348010000001','Oyo','Broilers','active'),
('Adaeze Umeh','Sunnyvale Farm','+2348010000002','Enugu','Layers','active'),
('Ade Adekunle','Ade''s Farm','+2348010000003','Lagos','Pigs','active'),
('Grace Peter','Riverbend Farm','+2348010000004','Rivers','Catfish','active'),
('Michael James','Hilltop Farm','+2348010000005','Plateau','Layers','active'),
('Fatima Bello','Northgate Farm','+2348010000006','Kano','Broilers','active'),
('David Ojo','Palm Ridge Farm','+2348010000007','Ondo','Layers','active'),
('Chinedu Eze','Blue Lagoon Farm','+2348010000008','Anambra','Catfish','active'),
('Blessing Ade','Sunrise Poultry','+2348010000009','Ogun','Broilers','active'),
('Ibrahim Musa','Savannah Farms','+2348010000010','Kaduna','Pigs','active'),
('Nkechi Obi','Golden Egg Farm','+2348010000011','Imo','Layers','active'),
('Segun Balogun','Delta Aqua','+2348010000012','Delta','Tilapia','active'),
('Amina Yusuf','Northern Broilers','+2348010000013','Kano','Broilers','active'),
('Peter Ndu','Green Acres','+2348010000014','Abia','Pigs','active'),
('Rose Etim','Coastal Fish Farm','+2348010000015','Cross River','Catfish','active'),
('Tunde Alabi','Ibadan Poultry','+2348010000016','Oyo','Layers','active'),
('Kemi Adeyemi','Highland Farm','+2348010000017','Plateau','Broilers','active'),
('Sani Bala','Kaduna Feedlot','+2348010000018','Kaduna','Pigs','active'),
('Chiamaka Nwosu','East Farm Co-op','+2348010000019','Enugu','Layers','active'),
('Bola Ige','Lagos Aquaculture','+2348010000020','Lagos','Tilapia','active'),
('Emeka Okafor','South Poultry','+2348010000021','Anambra','Broilers','active'),
('Zainab Adamu','Middle Belt Pigs','+2348010000022','Nasarawa','Pigs','inactive'),
('Ola Adewale','Riverdale Farm','+2348010000023','Ogun','Catfish','active'),
('Halima Sule','North Layers','+2348010000024','Kano','Layers','active'),
('Uche Nnamdi','Silver Farms','+2348010000025','Imo','Broilers','active');

-- Visit reports (admin_agent/system_admin see all)
INSERT INTO public.visit_reports (farmer_id, agent_id, species, priority, status, summary, submitted_at)
SELECT id, NULL, livestock_type, 
  (ARRAY['high','normal','medium','high','normal'])[1 + floor(random()*5)::int],
  (ARRAY['pending','under_review','pending','pending','under_review'])[1 + floor(random()*5)::int],
  'Field observation report — ' || farm_name,
  now() - (floor(random()*7)::int || ' days')::interval
FROM public.farmers LIMIT 20;

-- Nutrition plans
INSERT INTO public.nutrition_plans (farmer_id, species, status, plan, effective_from)
SELECT id, livestock_type, 
  (ARRAY['active','active','active','draft','active'])[1 + floor(random()*5)::int],
  jsonb_build_object('protein_pct', 18 + floor(random()*8)::int, 'notes', 'Standard ration for ' || livestock_type),
  (now() - (floor(random()*30)::int || ' days')::interval)::date
FROM public.farmers LIMIT 15;

-- Health cases
INSERT INTO public.health_cases (farmer_id, severity, status, diagnosis, treatment)
SELECT id,
  (ARRAY['high','medium','high','medium','critical'])[1 + floor(random()*5)::int],
  (ARRAY['open','open','in_progress','open','resolved'])[1 + floor(random()*5)::int],
  'Suspected respiratory issue',
  'Antibiotic course + hydration'
FROM public.farmers ORDER BY random() LIMIT 10;

-- Feed orders across last 14 days
INSERT INTO public.feed_orders (farmer_id, product_id, quantity, status, placed_at)
SELECT f.id, p.id,
  (5 + floor(random()*40))::int,
  (ARRAY['pending','processing','out_for_delivery','delivered','delivered'])[1 + floor(random()*5)::int],
  now() - (floor(random()*14)::int || ' days')::interval - (floor(random()*24)::int || ' hours')::interval
FROM public.farmers f
CROSS JOIN LATERAL (SELECT id FROM public.feed_products ORDER BY random() LIMIT 1) p
LIMIT 35;

-- Production runs across last 14 days
INSERT INTO public.production_runs (batch_no, product_id, quantity, status, started_at, finished_at)
SELECT
  'B-' || lpad((1000 + n)::text, 4, '0'),
  (SELECT id FROM public.feed_products ORDER BY random() LIMIT 1),
  (500 + floor(random()*3500))::int,
  (ARRAY['completed','completed','running','queued','completed'])[1 + floor(random()*5)::int],
  now() - (n || ' days')::interval,
  CASE WHEN n > 2 THEN now() - (n || ' days')::interval + interval '6 hours' ELSE NULL END
FROM generate_series(0, 19) AS n;

-- Activities feed (visible to any authenticated user)
INSERT INTO public.activities (verb, target_type, target_id, meta, created_at)
SELECT
  (ARRAY['report_submitted','farmer_onboarded','order_placed','health_case_opened','plan_updated','order_delivered'])[1 + floor(random()*6)::int],
  'farmer',
  f.id,
  jsonb_build_object('farm_name', f.farm_name, 'name', f.name),
  now() - (floor(random()*72)::int || ' hours')::interval
FROM public.farmers f
ORDER BY random() LIMIT 20;
