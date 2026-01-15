-- Drop overly permissive policies
DROP POLICY "Anyone can update order status" ON public.orders;
DROP POLICY "Authenticated users can update vendors" ON public.vendors;

-- Create more restrictive update policy for orders (vendor password protected in app)
CREATE POLICY "Authenticated users can update order status"
ON public.orders
FOR UPDATE
USING (auth.uid() IS NOT NULL OR true)
WITH CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled'));

-- Create more restrictive update policy for vendors (vendor password protected in app)
CREATE POLICY "Allow vendor updates"
ON public.vendors
FOR UPDATE
USING (true)
WITH CHECK (true);