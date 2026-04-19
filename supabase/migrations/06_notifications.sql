-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Enable Realtime for notifications
-- Note: This usually requires being part of the 'supabase_realtime' publication
-- The following command is common in Supabase migrations:
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Function to notify admins of new signups
CREATE OR REPLACE FUNCTION public.notify_admins_of_signup()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.role = 'pending') THEN
        INSERT INTO public.notifications (user_id, type, title, message, metadata)
        SELECT id, 'NEW_SIGNUP', 'New User Signup', 
               NEW.full_name || ' has registered and is awaiting approval.',
               jsonb_build_object('target_user_id', NEW.id)
        FROM public.users
        WHERE role = 'admin';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for signup notifications
CREATE TRIGGER on_user_signup_notify
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admins_of_signup();

-- Function to notify user of role update
CREATE OR REPLACE FUNCTION public.notify_user_of_role_update()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.role = 'pending' AND NEW.role != 'pending') THEN
        INSERT INTO public.notifications (user_id, type, title, message)
        VALUES (NEW.id, 'ROLE_UPDATED', 'Account Approved', 
                'Your account has been approved. You now have ' || NEW.role || ' access.');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for role update notifications
CREATE TRIGGER on_user_role_update_notify
    AFTER UPDATE OF role ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_user_of_role_update();
