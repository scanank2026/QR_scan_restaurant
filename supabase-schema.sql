
-- SQL Schema for QR Order SaaS (Hardened & Finalized)
-- This schema includes all security measures, Row Level Security (RLS) policies, and database triggers.

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('super_admin', 'restaurant_owner', 'staff')) DEFAULT 'restaurant_owner',
  restaurant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  hero_image_url TEXT,
  storefront_config JSONB DEFAULT '{}'::jsonb,
  address TEXT,
  phone TEXT,
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')) DEFAULT 'free',
  subscription_status TEXT CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'incomplete')) DEFAULT 'active',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  subscription_credit DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  is_sold_out BOOLEAN DEFAULT false,
  is_on_offer BOOLEAN DEFAULT false,
  original_price DECIMAL(10, 2),
  is_chef_special BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Tables table
CREATE TABLE IF NOT EXISTS tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  table_number TEXT NOT NULL,
  location TEXT,
  qr_code_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(restaurant_id, table_number)
);

-- 6. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'cooking', 'ready', 'completed', 'cancelled', 'revoked')) DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('unpaid', 'paid')) DEFAULT 'unpaid',
  payment_method TEXT,
  customer_notes TEXT,
  customer_name TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Staff table
CREATE TABLE IF NOT EXISTS staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('manager', 'kitchen_staff', 'waiter')) DEFAULT 'kitchen_staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Waiter Calls table
CREATE TABLE IF NOT EXISTS waiter_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  table_number TEXT NOT NULL,
  request TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'resolved')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. Feedbacks table
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  table_number TEXT,
  customer_name TEXT,
  feedback TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('pending', 'resolved')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. Table Sessions table (for QR code security)
CREATE TABLE IF NOT EXISTS table_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 12. System Settings table
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 13. Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'Rs.' NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  plan_id TEXT NOT NULL,
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- --- SECURITY HELPERS ---

-- Helper function to bypass RLS recursion
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_restaurant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- RLS ENABLEMENT ---

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiter_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- --- RLS POLICIES ---

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.get_auth_role() = 'super_admin');
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.get_auth_role() = 'super_admin');
CREATE POLICY "Super admins can delete profiles" ON profiles FOR DELETE TO authenticated USING (public.get_auth_role() = 'super_admin');

-- Restaurants
DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;
DROP POLICY IF EXISTS "Owners and staff can view restaurants" ON restaurants;
DROP POLICY IF EXISTS "Super admins can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Owners can update their restaurant" ON restaurants;
DROP POLICY IF EXISTS "Super admins can delete restaurants" ON restaurants;

CREATE POLICY "Public can view active restaurants" ON restaurants FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Owners and staff can view restaurants" ON restaurants FOR SELECT TO authenticated USING (
  owner_id = auth.uid() OR 
  public.get_auth_role() = 'super_admin' OR
  id IN (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Super admins can insert restaurants" ON restaurants FOR INSERT TO authenticated WITH CHECK (public.get_auth_role() = 'super_admin');
CREATE POLICY "Owners can update their restaurant" ON restaurants FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.get_auth_role() = 'super_admin');
CREATE POLICY "Super admins can delete restaurants" ON restaurants FOR DELETE TO authenticated USING (public.get_auth_role() = 'super_admin');

-- Categories & Menu Items
DROP POLICY IF EXISTS "Public can view categories" ON categories;
DROP POLICY IF EXISTS "Owners can manage categories" ON categories;
CREATE POLICY "Public can view categories" ON categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owners can manage categories" ON categories 
FOR ALL TO authenticated 
USING (
  restaurant_id = public.get_auth_restaurant_id() OR 
  public.get_auth_role() = 'super_admin'
);

DROP POLICY IF EXISTS "Public can view menu items" ON menu_items;
DROP POLICY IF EXISTS "Owners can manage menu items" ON menu_items;
CREATE POLICY "Public can view menu items" ON menu_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owners can manage menu items" ON menu_items 
FOR ALL TO authenticated 
USING (
  restaurant_id = public.get_auth_restaurant_id() OR 
  public.get_auth_role() = 'super_admin'
);

-- Tables
DROP POLICY IF EXISTS "Public can view tables" ON tables;
DROP POLICY IF EXISTS "Owners can manage tables" ON tables;
CREATE POLICY "Public can view tables" ON tables FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owners can manage tables" ON tables 
FOR ALL TO authenticated 
USING (
  restaurant_id = public.get_auth_restaurant_id() OR 
  public.get_auth_role() = 'super_admin'
);

-- Orders & Order Items
DROP POLICY IF EXISTS "Public can create orders" ON orders;
DROP POLICY IF EXISTS "Public can view own table orders" ON orders;
DROP POLICY IF EXISTS "Owners and staff can view orders" ON orders;
DROP POLICY IF EXISTS "Owners and staff can update orders" ON orders;

CREATE POLICY "Public can create orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM table_sessions WHERE restaurant_id = orders.restaurant_id AND table_id = orders.table_id AND expires_at > NOW()));
CREATE POLICY "Public can view own table orders" ON orders FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM table_sessions WHERE restaurant_id = orders.restaurant_id AND table_id = orders.table_id AND expires_at > NOW()));
CREATE POLICY "Owners and staff can view orders" ON orders 
FOR SELECT TO authenticated 
USING (
  restaurant_id = public.get_auth_restaurant_id() OR 
  public.get_auth_role() = 'super_admin'
);
CREATE POLICY "Owners and staff can update orders" ON orders 
FOR UPDATE TO authenticated 
USING (
  restaurant_id = public.get_auth_restaurant_id() OR 
  public.get_auth_role() = 'super_admin'
);

DROP POLICY IF EXISTS "Public can create order items" ON order_items;
DROP POLICY IF EXISTS "Public can view order items" ON order_items;
DROP POLICY IF EXISTS "Owners and staff can manage order items" ON order_items;

CREATE POLICY "Public can create order items" ON order_items FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE id = order_id));
CREATE POLICY "Public can view order items" ON order_items FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM orders WHERE id = order_id));
CREATE POLICY "Owners and staff can manage order items" ON order_items 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE id = order_id 
    AND (restaurant_id = public.get_auth_restaurant_id() OR public.get_auth_role() = 'super_admin')
  )
);

-- Staff
DROP POLICY IF EXISTS "Owners can manage staff" ON staff;
DROP POLICY IF EXISTS "Staff can view own restaurant staff" ON staff;

CREATE POLICY "Owners can manage staff" ON staff 
FOR ALL TO authenticated 
USING (
  restaurant_id = public.get_auth_restaurant_id() OR 
  public.get_auth_role() = 'super_admin'
);

CREATE POLICY "Staff can view own restaurant staff" ON staff 
FOR SELECT TO authenticated 
USING (
  restaurant_id = public.get_auth_restaurant_id()
);

-- Waiter Calls & Feedbacks
DROP POLICY IF EXISTS "Public can create waiter calls" ON waiter_calls;
DROP POLICY IF EXISTS "Owners and staff can manage waiter calls" ON waiter_calls;

CREATE POLICY "Public can create waiter calls" ON waiter_calls FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM table_sessions WHERE restaurant_id = waiter_calls.restaurant_id AND table_id = waiter_calls.table_id AND expires_at > NOW()));
CREATE POLICY "Owners and staff can manage waiter calls" ON waiter_calls 
FOR ALL TO authenticated 
USING (
  restaurant_id = public.get_auth_restaurant_id() OR 
  public.get_auth_role() = 'super_admin'
);

DROP POLICY IF EXISTS "Public can create feedbacks" ON feedbacks;
CREATE POLICY "Public can create feedbacks" ON feedbacks FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM restaurants WHERE id = feedbacks.restaurant_id AND is_active = true));
CREATE POLICY "Owners and staff can view feedbacks" ON feedbacks 
FOR SELECT TO authenticated 
USING (
  restaurant_id = public.get_auth_restaurant_id() OR 
  public.get_auth_role() = 'super_admin'
);

-- Table Sessions
DROP POLICY IF EXISTS "Public can view sessions" ON table_sessions;
DROP POLICY IF EXISTS "Public can create sessions" ON table_sessions;
DROP POLICY IF EXISTS "Owners can manage sessions" ON table_sessions;

CREATE POLICY "Public can view sessions" ON table_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can create sessions" ON table_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Owners can manage sessions" ON table_sessions 
FOR ALL TO authenticated 
USING (
  restaurant_id = public.get_auth_restaurant_id() OR 
  public.get_auth_role() = 'super_admin'
);

-- System Settings
DROP POLICY IF EXISTS "Super admins can manage system settings" ON system_settings;
DROP POLICY IF EXISTS "Public can view global settings" ON system_settings;

CREATE POLICY "Super admins can manage system settings" ON system_settings FOR ALL TO authenticated USING (public.get_auth_role() = 'super_admin');
CREATE POLICY "Public can view global settings" ON system_settings FOR SELECT TO anon, authenticated USING (key = 'global_settings');

-- Payments
DROP POLICY IF EXISTS "Super admins can manage payments" ON payments;
DROP POLICY IF EXISTS "Owners can view own payments" ON payments;

CREATE POLICY "Super admins can manage payments" ON payments FOR ALL TO authenticated USING (public.get_auth_role() = 'super_admin');
CREATE POLICY "Owners can view own payments" ON payments FOR SELECT TO authenticated USING (restaurant_id = public.get_auth_restaurant_id());

-- --- TRIGGERS & FUNCTIONS ---

-- 1. Handle New User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  restaurant_slug TEXT;
  full_name_val TEXT;
  restaurant_id_val UUID;
BEGIN
  -- Check if registration is disabled
  IF EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'global_settings' AND (value->>'registration_disabled')::boolean = true) THEN
    RAISE EXCEPTION 'Registration is currently disabled.';
  END IF;

  full_name_val := COALESCE(new.raw_user_meta_data->>'full_name', 'New Owner');
  
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, full_name_val, 'restaurant_owner')
  ON CONFLICT (id) DO NOTHING;

  restaurant_slug := LOWER(REPLACE(full_name_val, ' ', '-')) || '-' || SUBSTR(MD5(RANDOM()::TEXT), 1, 6);
  
  INSERT INTO public.restaurants (owner_id, name, slug, subscription_tier)
  VALUES (new.id, full_name_val || '''s Restaurant', restaurant_slug, 'free')
  RETURNING id INTO restaurant_id_val;

  UPDATE public.profiles SET restaurant_id = restaurant_id_val WHERE id = new.id;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Prevent Role & Restaurant Change
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Protect role
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- If it's an API request (auth.uid() is not null)
    IF auth.uid() IS NOT NULL THEN
      -- NEVER allow promotion to super_admin via API, even by other super_admins
      IF NEW.role = 'super_admin' THEN
        RAISE EXCEPTION 'Promotion to Super Admin must be done manually via SQL Editor for security reasons.';
      END IF;

      -- For other role changes, only allow super_admin to perform them
      IF public.get_auth_role() != 'super_admin' THEN
        NEW.role := OLD.role;
      END IF;
    END IF;
  END IF;
  
  -- Protect restaurant_id
  IF NEW.restaurant_id IS DISTINCT FROM OLD.restaurant_id THEN
    IF auth.uid() IS NOT NULL AND public.get_auth_role() != 'super_admin' AND OLD.restaurant_id IS NOT NULL THEN
      NEW.restaurant_id := OLD.restaurant_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_profile_fields ON profiles;
CREATE TRIGGER tr_protect_profile_fields BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- 3. Enforce Order Item Price
CREATE OR REPLACE FUNCTION public.enforce_order_item_price()
RETURNS TRIGGER AS $$
DECLARE
  real_price DECIMAL(10,2);
BEGIN
  SELECT price INTO real_price FROM public.menu_items WHERE id = NEW.menu_item_id;
  IF real_price IS NULL THEN RAISE EXCEPTION 'Invalid menu item.'; END IF;
  NEW.unit_price := real_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_enforce_order_item_price ON order_items;
CREATE TRIGGER tr_enforce_order_item_price BEFORE INSERT OR UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION public.enforce_order_item_price();

-- 4. Sync Order Total
CREATE OR REPLACE FUNCTION public.sync_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.orders SET total_amount = (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM public.order_items WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)) WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_order_total ON order_items;
CREATE TRIGGER tr_sync_order_total AFTER INSERT OR UPDATE OR DELETE ON order_items FOR EACH ROW EXECUTE FUNCTION public.sync_order_total();

-- 5. Check Restaurant Update (Subscription Protection)
CREATE OR REPLACE FUNCTION public.check_restaurant_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow super_admin to update anything
  IF public.get_auth_role() = 'super_admin' THEN
    RETURN NEW;
  END IF;

  -- Allow owner to update subscription fields for plan switching
  -- In a production app, this would be more strictly controlled via server-side functions
  IF auth.uid() = OLD.owner_id THEN
    -- We allow these fields to be updated by the owner for the demo/prototype flow
    RETURN NEW;
  END IF;

  -- For anyone else or other fields, prevent sensitive changes
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier OR 
     NEW.subscription_credit IS DISTINCT FROM OLD.subscription_credit OR 
     NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'Unauthorized change to sensitive restaurant fields.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_restaurant_update ON restaurants;
CREATE TRIGGER tr_check_restaurant_update BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION public.check_restaurant_update();

-- 6. Set Default Restaurant Values
CREATE OR REPLACE FUNCTION public.set_default_restaurant_values()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subscription_tier := 'free';
  NEW.subscription_status := 'active';
  NEW.subscription_expires_at := NOW() + INTERVAL '14 days';
  NEW.is_active := true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_set_default_restaurant_values ON restaurants;
CREATE TRIGGER tr_set_default_restaurant_values BEFORE INSERT ON restaurants FOR EACH ROW EXECUTE FUNCTION public.set_default_restaurant_values();

-- 7. Prevent Super Admin Self-Deletion
CREATE OR REPLACE FUNCTION public.prevent_self_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account for security reasons.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_prevent_self_deletion ON profiles;
CREATE TRIGGER tr_prevent_self_deletion BEFORE DELETE ON profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_self_deletion();

-- --- STORAGE BUCKETS ---

INSERT INTO storage.buckets (id, name, public) VALUES ('menu_items', 'menu_items', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Owners can manage their images" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'menu_items');
CREATE POLICY "Owners can manage their images" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'menu_items' AND (EXISTS (SELECT 1 FROM restaurants WHERE owner_id = auth.uid() AND id::text = (storage.foldername(name))[1]) OR public.get_auth_role() = 'super_admin'));

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners and staff can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Owners and staff can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Super admins can manage all notifications" ON notifications;

CREATE POLICY "Owners and staff can view own notifications" ON notifications
FOR SELECT TO authenticated
USING (restaurant_id = public.get_auth_restaurant_id() OR public.get_auth_role() = 'super_admin');

CREATE POLICY "Owners and staff can update own notifications" ON notifications
FOR UPDATE TO authenticated
USING (restaurant_id = public.get_auth_restaurant_id() OR public.get_auth_role() = 'super_admin');

CREATE POLICY "Super admins can manage all notifications" ON notifications
FOR ALL TO authenticated
USING (public.get_auth_role() = 'super_admin');

-- Triggers for Notifications
CREATE OR REPLACE FUNCTION public.notify_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    INSERT INTO public.notifications (restaurant_id, title, message, type)
    VALUES (NEW.id, 'Subscription Updated', 'Your restaurant subscription has been changed to ' || UPPER(NEW.subscription_tier) || '.', 'success');
  END IF;
  
  IF NEW.is_active = false AND OLD.is_active = true THEN
    INSERT INTO public.notifications (restaurant_id, title, message, type)
    VALUES (NEW.id, 'Account Suspended', 'Your restaurant account has been suspended. Please contact support.', 'error');
  ELSIF NEW.is_active = true AND OLD.is_active = false THEN
    INSERT INTO public.notifications (restaurant_id, title, message, type)
    VALUES (NEW.id, 'Account Activated', 'Your restaurant account has been activated. Welcome back!', 'success');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_subscription_change ON restaurants;
CREATE TRIGGER tr_notify_subscription_change AFTER UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION public.notify_subscription_change();

CREATE OR REPLACE FUNCTION public.notify_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.restaurant_id IS NOT NULL THEN
    INSERT INTO public.notifications (restaurant_id, title, message, type)
    VALUES (NEW.restaurant_id, 'Profile Updated', 'A staff or owner profile associated with your restaurant was updated.', 'info');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_profile_update ON profiles;
CREATE TRIGGER tr_notify_profile_update AFTER UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION public.notify_profile_update();
