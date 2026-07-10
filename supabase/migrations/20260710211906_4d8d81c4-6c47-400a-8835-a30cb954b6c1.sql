
-- =========================
-- Roles, profiles, has_role
-- =========================
CREATE TYPE public.app_role AS ENUM ('system_admin','field_agent','admin_agent','feedops');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  initials TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "profiles: read own or admin" ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'system_admin'));
CREATE POLICY "profiles: insert own" ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles: update own" ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "user_roles: read own or admin" ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'system_admin'));

-- Signup trigger: create profile + assign role from metadata (never system_admin via signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role;
  _full_name TEXT;
  _parts TEXT[];
  _initials TEXT;
BEGIN
  _full_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name',''), split_part(NEW.email,'@',1));
  _parts := regexp_split_to_array(trim(_full_name), '\s+');
  _initials := upper(coalesce(substring(_parts[1] from 1 for 1),'') || coalesce(substring(_parts[array_length(_parts,1)] from 1 for 1),''));
  INSERT INTO public.profiles (id, full_name, initials) VALUES (NEW.id, _full_name, _initials);

  BEGIN
    _role := NULLIF(NEW.raw_user_meta_data->>'role','')::public.app_role;
  EXCEPTION WHEN OTHERS THEN
    _role := NULL;
  END;
  IF _role IS NULL OR _role = 'system_admin' THEN
    _role := 'field_agent';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- =========================
-- Domain: Field / Agent
-- =========================
CREATE TABLE public.farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  farm_name TEXT,
  region TEXT,
  phone TEXT,
  livestock_type TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  assigned_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farmers TO authenticated;
GRANT ALL ON public.farmers TO service_role;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "farmers: read staff" ON public.farmers FOR SELECT TO authenticated
USING (
  assigned_agent_id = auth.uid()
  OR public.has_role(auth.uid(),'admin_agent')
  OR public.has_role(auth.uid(),'system_admin')
  OR public.has_role(auth.uid(),'feedops')
);
CREATE POLICY "farmers: insert field/admin" ON public.farmers FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'field_agent') OR public.has_role(auth.uid(),'admin_agent') OR public.has_role(auth.uid(),'system_admin'));
CREATE POLICY "farmers: update owning agent or admin" ON public.farmers FOR UPDATE TO authenticated
USING (assigned_agent_id = auth.uid() OR public.has_role(auth.uid(),'system_admin') OR public.has_role(auth.uid(),'admin_agent'))
WITH CHECK (true);
CREATE TRIGGER trg_farmers_updated BEFORE UPDATE ON public.farmers FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE TABLE public.visit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  species TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  summary TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visit_reports TO authenticated;
GRANT ALL ON public.visit_reports TO service_role;
ALTER TABLE public.visit_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports: read staff" ON public.visit_reports FOR SELECT TO authenticated
USING (
  agent_id = auth.uid()
  OR public.has_role(auth.uid(),'admin_agent')
  OR public.has_role(auth.uid(),'system_admin')
);
CREATE POLICY "reports: field insert own" ON public.visit_reports FOR INSERT TO authenticated
WITH CHECK (agent_id = auth.uid() AND public.has_role(auth.uid(),'field_agent'));
CREATE POLICY "reports: admin_agent/system update" ON public.visit_reports FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin_agent') OR public.has_role(auth.uid(),'system_admin'))
WITH CHECK (true);

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks: assignee or admin" ON public.tasks FOR SELECT TO authenticated
USING (assignee_id = auth.uid() OR public.has_role(auth.uid(),'system_admin'));
CREATE POLICY "tasks: assignee update" ON public.tasks FOR UPDATE TO authenticated
USING (assignee_id = auth.uid()) WITH CHECK (assignee_id = auth.uid());
CREATE POLICY "tasks: admin insert" ON public.tasks FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'system_admin') OR public.has_role(auth.uid(),'admin_agent'));

CREATE TABLE public.nutrition_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  species TEXT,
  plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  effective_from DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_plans TO authenticated;
GRANT ALL ON public.nutrition_plans TO service_role;
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nutri: staff read" ON public.nutrition_plans FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin_agent')
  OR public.has_role(auth.uid(),'system_admin')
  OR EXISTS (SELECT 1 FROM public.farmers f WHERE f.id = farmer_id AND f.assigned_agent_id = auth.uid())
);
CREATE POLICY "nutri: admin_agent write" ON public.nutrition_plans FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin_agent') OR public.has_role(auth.uid(),'system_admin'))
WITH CHECK (public.has_role(auth.uid(),'admin_agent') OR public.has_role(auth.uid(),'system_admin'));

CREATE TABLE public.health_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
  opened_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  diagnosis TEXT,
  treatment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_cases TO authenticated;
GRANT ALL ON public.health_cases TO service_role;
ALTER TABLE public.health_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cases: staff read" ON public.health_cases FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin_agent')
  OR public.has_role(auth.uid(),'system_admin')
  OR EXISTS (SELECT 1 FROM public.farmers f WHERE f.id = farmer_id AND f.assigned_agent_id = auth.uid())
);
CREATE POLICY "cases: admin_agent write" ON public.health_cases FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin_agent') OR public.has_role(auth.uid(),'system_admin'))
WITH CHECK (public.has_role(auth.uid(),'admin_agent') OR public.has_role(auth.uid(),'system_admin'));

-- =========================
-- Domain: FeedOps
-- =========================
CREATE TABLE public.feed_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT NOT NULL DEFAULT 'kg',
  price_per_unit NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed_products TO authenticated;
GRANT ALL ON public.feed_products TO service_role;
ALTER TABLE public.feed_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products: staff read" ON public.feed_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products: feedops/admin write" ON public.feed_products FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'feedops') OR public.has_role(auth.uid(),'system_admin'))
WITH CHECK (public.has_role(auth.uid(),'feedops') OR public.has_role(auth.uid(),'system_admin'));

CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.feed_products(id) ON DELETE CASCADE,
  warehouse TEXT NOT NULL DEFAULT 'main',
  quantity NUMERIC(14,2) NOT NULL DEFAULT 0,
  reorder_level NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv: staff read" ON public.inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "inv: feedops/admin write" ON public.inventory_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'feedops') OR public.has_role(auth.uid(),'system_admin'))
WITH CHECK (public.has_role(auth.uid(),'feedops') OR public.has_role(auth.uid(),'system_admin'));

CREATE TABLE public.production_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.feed_products(id),
  batch_no TEXT NOT NULL,
  quantity NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_runs TO authenticated;
GRANT ALL ON public.production_runs TO service_role;
ALTER TABLE public.production_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prod: feedops/admin all" ON public.production_runs FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'feedops') OR public.has_role(auth.uid(),'system_admin'))
WITH CHECK (public.has_role(auth.uid(),'feedops') OR public.has_role(auth.uid(),'system_admin'));

CREATE TABLE public.feed_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT UNIQUE NOT NULL DEFAULT ('ORD-' || to_char(now(),'YYMMDD') || '-' || substr(gen_random_uuid()::text,1,6)),
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.feed_products(id),
  agent_id UUID REFERENCES auth.users(id),
  quantity NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'placed',
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed_orders TO authenticated;
GRANT ALL ON public.feed_orders TO service_role;
ALTER TABLE public.feed_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders: staff read" ON public.feed_orders FOR SELECT TO authenticated
USING (
  agent_id = auth.uid()
  OR public.has_role(auth.uid(),'feedops')
  OR public.has_role(auth.uid(),'admin_agent')
  OR public.has_role(auth.uid(),'system_admin')
);
CREATE POLICY "orders: field insert own" ON public.feed_orders FOR INSERT TO authenticated
WITH CHECK (agent_id = auth.uid() OR public.has_role(auth.uid(),'feedops') OR public.has_role(auth.uid(),'system_admin'));
CREATE POLICY "orders: feedops/admin update" ON public.feed_orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'feedops') OR public.has_role(auth.uid(),'system_admin'))
WITH CHECK (true);

-- =========================
-- Cross-cutting
-- =========================
CREATE TABLE public.knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT,
  body TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  published BOOLEAN NOT NULL DEFAULT false,
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.knowledge_articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_articles TO authenticated;
GRANT ALL ON public.knowledge_articles TO service_role;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb: public published" ON public.knowledge_articles FOR SELECT TO anon USING (published = true);
CREATE POLICY "kb: authed read" ON public.knowledge_articles FOR SELECT TO authenticated USING (published = true OR author_id = auth.uid() OR public.has_role(auth.uid(),'admin_agent') OR public.has_role(auth.uid(),'system_admin'));
CREATE POLICY "kb: admin_agent write" ON public.knowledge_articles FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin_agent') OR public.has_role(auth.uid(),'system_admin'))
WITH CHECK (public.has_role(auth.uid(),'admin_agent') OR public.has_role(auth.uid(),'system_admin'));

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif: own" ON public.notifications FOR SELECT TO authenticated USING (recipient_id = auth.uid());
CREATE POLICY "notif: update own" ON public.notifications FOR UPDATE TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());
CREATE POLICY "notif: admin insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'system_admin') OR recipient_id = auth.uid());

CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verb TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities: authed read" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "activities: self insert" ON public.activities FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  portal TEXT NOT NULL DEFAULT 'agent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tix: owner or admin" ON public.support_tickets FOR SELECT TO authenticated
USING (opened_by = auth.uid() OR assignee_id = auth.uid() OR public.has_role(auth.uid(),'system_admin'));
CREATE POLICY "tix: any authed open" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (opened_by = auth.uid());
CREATE POLICY "tix: admin update" ON public.support_tickets FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'system_admin')) WITH CHECK (public.has_role(auth.uid(),'system_admin'));

CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.system_logs TO authenticated;
GRANT ALL ON public.system_logs TO service_role;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs: admin read" ON public.system_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'system_admin'));
CREATE POLICY "logs: self insert" ON public.system_logs FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());
