
-- Tighten permissive WITH CHECK (true) policies
DROP POLICY IF EXISTS "farmers: update owning agent or admin" ON public.farmers;
CREATE POLICY "farmers: update owning agent or admin" ON public.farmers FOR UPDATE TO authenticated
USING (assigned_agent_id = auth.uid() OR public.has_role(auth.uid(),'system_admin') OR public.has_role(auth.uid(),'admin_agent'))
WITH CHECK (assigned_agent_id = auth.uid() OR public.has_role(auth.uid(),'system_admin') OR public.has_role(auth.uid(),'admin_agent'));

DROP POLICY IF EXISTS "reports: admin_agent/system update" ON public.visit_reports;
CREATE POLICY "reports: admin_agent/system update" ON public.visit_reports FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin_agent') OR public.has_role(auth.uid(),'system_admin'))
WITH CHECK (public.has_role(auth.uid(),'admin_agent') OR public.has_role(auth.uid(),'system_admin'));

DROP POLICY IF EXISTS "orders: feedops/admin update" ON public.feed_orders;
CREATE POLICY "orders: feedops/admin update" ON public.feed_orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'feedops') OR public.has_role(auth.uid(),'system_admin'))
WITH CHECK (public.has_role(auth.uid(),'feedops') OR public.has_role(auth.uid(),'system_admin'));

-- Lock down helper functions from anon/authenticated direct execution.
-- has_role is used from within other SECURITY DEFINER contexts and via RLS (server-side); revoke direct exec.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
-- authenticated role needs to invoke has_role via RLS; RLS evaluates as the definer, so no grant needed.

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_touch_updated_at() FROM PUBLIC, anon, authenticated;

-- Make sure tg_touch_updated_at has a fixed search path
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
