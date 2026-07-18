
ALTER TABLE public.farmers ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.farmers ADD COLUMN IF NOT EXISTS notes text;

DROP POLICY IF EXISTS "farmers: read staff" ON public.farmers;
CREATE POLICY "farmers: read staff"
  ON public.farmers FOR SELECT TO authenticated
  USING (
    assigned_agent_id = auth.uid()
    OR (assigned_agent_id IS NULL AND public.has_role(auth.uid(),'field_agent'))
    OR public.has_role(auth.uid(),'admin_agent')
    OR public.has_role(auth.uid(),'system_admin')
    OR public.has_role(auth.uid(),'feedops')
  );

DROP POLICY IF EXISTS "farmers: update owning agent or admin" ON public.farmers;
CREATE POLICY "farmers: update owning agent or admin"
  ON public.farmers FOR UPDATE TO authenticated
  USING (
    assigned_agent_id = auth.uid()
    OR (assigned_agent_id IS NULL AND public.has_role(auth.uid(),'field_agent'))
    OR public.has_role(auth.uid(),'system_admin')
    OR public.has_role(auth.uid(),'admin_agent')
  )
  WITH CHECK (
    assigned_agent_id = auth.uid() OR assigned_agent_id IS NULL
    OR public.has_role(auth.uid(),'system_admin')
    OR public.has_role(auth.uid(),'admin_agent')
  );

INSERT INTO public.farmers (name, farm_name, region, phone, livestock_type, status, avatar_url, notes)
SELECT * FROM (VALUES
  ('Amara Okafor','Sunrise Poultry','Oyo, NG','+234 803 111 2201','Poultry - Layers','active','https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces','Runs 1,200 layer birds.'),
  ('Ibrahim Musa','Green Valley Dairy','Kaduna, NG','+234 802 555 8843','Dairy Cattle','active','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces','12 cows, milking twice daily.'),
  ('Chinwe Adeyemi','Blessed Farms','Enugu, NG','+234 809 233 9910','Poultry - Broilers','active','https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces','New farmer, needs onboarding call.'),
  ('Samuel Bello','Harvest Fisheries','Lagos, NG','+234 806 774 4520','Fish - Catfish','active','https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces','Two ponds, ~8,000 stock.'),
  ('Grace Nwosu','Golden Egg Farm','Anambra, NG','+234 803 900 1122','Poultry - Layers','active','https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces','Interested in premium layer mash.'),
  ('Yusuf Danladi','Kano Cattle Co.','Kano, NG','+234 805 442 8811','Beef Cattle','active','https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces','Ranch of 45 head. Vaccination due.'),
  ('Ruth Ibeh','Ibeh Farms','Abia, NG','+234 807 663 2211','Pigs','at_risk','https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=faces','Feed conversion issues last week.'),
  ('Kwame Mensah','Mensah Poultry','Kumasi, GH','+233 244 118 776','Poultry - Broilers','active','https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces','3-week broiler cycle.'),
  ('Aisha Suleiman','Suleiman Dairy','Kaduna, NG','+234 803 221 5580','Dairy Cattle','active','https://images.unsplash.com/photo-1502764613149-7f1d229e230f?w=200&h=200&fit=crop&crop=faces','On the premium nutrition plan.'),
  ('Peter Okon','Okon Fisheries','Akwa Ibom, NG','+234 802 900 4433','Fish - Tilapia','active','https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&h=200&fit=crop&crop=faces','Monthly weight sampling.'),
  ('Halima Bature','Bature Layers','Zaria, NG','+234 810 445 2266','Poultry - Layers','active','https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=faces','Requests bi-weekly visits.'),
  ('Emmanuel Okeke','Okeke Piggery','Imo, NG','+234 806 331 7789','Pigs','active','https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop&crop=faces','~30 grower pigs.'),
  ('Fatima Bello','Bello Cattle','Bauchi, NG','+234 809 224 1120','Beef Cattle','inactive','https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces','Paused ordering — dry season.'),
  ('Tunde Adekunle','TA Broilers','Ogun, NG','+234 803 776 5544','Poultry - Broilers','active','https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=200&h=200&fit=crop&crop=faces','Runs 3 flocks in rotation.'),
  ('Ngozi Eze','Eze Family Farm','Ebonyi, NG','+234 802 111 3390','Mixed Livestock','active','https://images.unsplash.com/photo-1554151228-14d9def656e4?w=200&h=200&fit=crop&crop=faces','Layers + goats + fish pond.')
) AS s(name, farm_name, region, phone, livestock_type, status, avatar_url, notes)
WHERE (SELECT count(*) FROM public.farmers) < 5;
