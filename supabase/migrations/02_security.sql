-- 02_security.sql
-- Row Level Security (RLS) policies for Lennox project

-- Enable RLS on all tables
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Branches Policies
CREATE POLICY "Admins can do everything on branches" ON public.branches FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Everyone can read branches" ON public.branches FOR SELECT USING (true);

-- Users Policies
CREATE POLICY "Admins can manage all users" ON public.users FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Users can read their own profile" ON public.users FOR SELECT USING (
    id = auth.uid()
);

-- Transactions Policies
CREATE POLICY "Admins can view and manage all transactions" ON public.transactions FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Branch users can insert transactions" ON public.transactions FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'branch_user'
);

CREATE POLICY "Branch users can view their branch transactions" ON public.transactions FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'branch_user' AND
    (
      branch_origin = (SELECT branch_id FROM public.users WHERE id = auth.uid()) OR
      branch_claimed = (SELECT branch_id FROM public.users WHERE id = auth.uid())
    )
);

CREATE POLICY "Branch users can view pending cross-branch transactions" ON public.transactions FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'branch_user' AND
    status = 'PENDING'
);

CREATE POLICY "Branch users can update transactions to claim" ON public.transactions FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'branch_user'
);

-- Logs Policies
CREATE POLICY "Admins can view and manage all logs" ON public.logs FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Branch users can insert logs" ON public.logs FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'branch_user'
);
CREATE POLICY "Branch users can view their own logs" ON public.logs FOR SELECT USING (
    user_id = auth.uid()
);
