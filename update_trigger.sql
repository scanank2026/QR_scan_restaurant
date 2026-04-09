-- Update the restaurant update check function to allow owners to switch plans
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
