
-- FIX: Infinite Recursion and RLS issues in all tables
-- This script replaces recursive policies with Security Definer functions.

-- 1. Create helper functions that bypass RLS
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

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Owners and staff can view restaurants" ON restaurants;
DROP POLICY IF EXISTS "Super admins can manage restaurants" ON restaurants;
DROP POLICY IF EXISTS "Owners and staff can view orders" ON orders;
DROP POLICY IF EXISTS "Owners and staff can update orders" ON orders;
DROP POLICY IF EXISTS "Owners can manage staff" ON staff;
DROP POLICY IF EXISTS "Staff can view own restaurant staff" ON staff;
DROP POLICY IF EXISTS "Owners can manage categories" ON categories;
DROP POLICY IF EXISTS "Owners can manage menu items" ON menu_items;
DROP POLICY IF EXISTS "Owners can manage tables" ON tables;
DROP POLICY IF EXISTS "Owners and staff can manage waiter calls" ON waiter_calls;
DROP POLICY IF EXISTS "Owners and staff can view feedbacks" ON feedbacks;
DROP POLICY IF EXISTS "Owners and staff can update feedbacks" ON feedbacks;
DROP POLICY IF EXISTS "Public can create feedbacks" ON feedbacks;
DROP POLICY IF EXISTS "Owners and staff can manage order items" ON order_items;

-- 3. Recreate policies using the helper functions

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT TO authenticated 
USING (auth.uid() = id OR public.get_auth_role() = 'super_admin');

CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE TO authenticated 
USING (auth.uid() = id OR public.get_auth_role() = 'super_admin');

CREATE POLICY "Super admins can delete profiles" ON profiles 
FOR DELETE TO authenticated 
USING (public.get_auth_role() = 'super_admin');

-- Restaurants
CREATE POLICY "Owners and staff can view restaurants" ON restaurants 
FOR SELECT TO authenticated 
USING (
  owner_id = auth.uid() OR 
  public.get_auth_role() = 'super_admin' OR
  id = public.get_auth_restaurant_id()
);

CREATE POLICY "Super admins can manage restaurants" ON restaurants 
FOR ALL TO authenticated 
USING (public.get_auth_role() = 'super_admin');

-- Staff
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

-- Categories
CREATE POLICY "Owners can manage categories" ON categories 
FOR ALL TO authenticated 
USING (
  restaurant_id = public.get_auth_restaurant_id() OR 
  public.get_auth_role() = 'super_admin'
);

-- Menu Items
CREATE POLICY "Owners can manage menu items" ON menu_items 
FOR ALL TO authenticated 
USING (
  restaurant_id = public.get_auth_restaurant_id() OR 
  public.get_auth_role() = 'super_admin'
);

-- Tables
CREATE POLICY "Owners can manage tables" ON tables 
FOR ALL TO authenticated 
USING (
  restaurant_id = public.get_auth_restaurant_id() OR 
  public.get_auth_role() = 'super_admin'
);

-- Orders
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

-- Order Items
CREATE POLICY "Owners and staff can manage order items" ON order_items 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE id = order_id 
    AND (restaurant_id = public.get_auth_restaurant_id() OR public.get_auth_role() = 'super_admin')
  )
);

-- Waiter Calls
CREATE POLICY "Owners and staff can manage waiter calls" ON waiter_calls 
FOR ALL TO authenticated 
USING (
  restaurant_id = public.get_auth_restaurant_id() OR 
  public.get_auth_role() = 'super_admin'
);

-- Feedbacks
CREATE POLICY "Owners and staff can view feedbacks" ON feedbacks 
FOR SELECT TO authenticated 
USING (
  restaurant_id = public.get_auth_restaurant_id() OR 
  public.get_auth_role() = 'super_admin'
);

CREATE POLICY "Owners and staff can update feedbacks" ON feedbacks 
FOR UPDATE TO authenticated 
USING (
  restaurant_id = public.get_auth_restaurant_id() OR 
  public.get_auth_role() = 'super_admin'
)
WITH CHECK (
  restaurant_id = public.get_auth_restaurant_id() OR 
  public.get_auth_role() = 'super_admin'
);

CREATE POLICY "Public can create feedbacks" ON feedbacks 
FOR INSERT TO anon, authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE id = feedbacks.restaurant_id 
    AND is_active = true
  )
);
