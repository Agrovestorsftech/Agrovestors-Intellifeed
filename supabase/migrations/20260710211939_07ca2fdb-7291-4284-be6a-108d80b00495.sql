
-- has_role must be callable by authenticated because RLS predicates invoke it.
-- It is a safe SECURITY DEFINER: returns only a boolean derived from user_roles.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
