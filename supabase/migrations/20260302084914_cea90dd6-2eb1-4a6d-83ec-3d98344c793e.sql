ALTER TABLE public.vendors 
  ADD COLUMN order_start_time TEXT DEFAULT '06:00',
  ADD COLUMN order_end_time TEXT DEFAULT '11:45';