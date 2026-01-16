import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vendor, CartItem, Order, MenuItem } from '@/types';
import { initialVendors, DELIVERY_FEE } from '@/data/vendors';

interface AppContextType {
  vendors: Vendor[];
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  deliveryFee: number;
  loadingVendors: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('klm-cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('klm-orders');
    return saved ? JSON.parse(saved) : [];
  });

  // Load vendors from database
  useEffect(() => {
    const fetchVendors = async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching vendors:', error);
        // Fall back to localStorage/initial vendors
        const saved = localStorage.getItem('klm-vendors');
        setVendors(saved ? JSON.parse(saved) : initialVendors);
      } else if (data && data.length > 0) {
        // Transform database vendors to match Vendor type
        const transformedVendors: Vendor[] = data.map((v) => ({
          id: v.vendor_id,
          name: v.name,
          description: v.description || '',
          image: v.image || undefined,
          isOpen: v.is_open ?? true,
          menuItems: Array.isArray(v.menu) ? (v.menu as unknown as MenuItem[]) : [],
        }));
        setVendors(transformedVendors);
      } else {
        // No vendors in DB, use initial
        const saved = localStorage.getItem('klm-vendors');
        setVendors(saved ? JSON.parse(saved) : initialVendors);
      }
      setLoadingVendors(false);
    };

    fetchVendors();

    // Subscribe to vendor changes
    const channel = supabase
      .channel('vendors-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendors',
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any;
            setVendors((prev) =>
              prev.map((v) =>
                v.id === updated.vendor_id
                  ? {
                      ...v,
                      name: updated.name,
                      description: updated.description || '',
                      image: updated.image || undefined,
                      isOpen: updated.is_open ?? true,
                      menuItems: Array.isArray(updated.menu) ? (updated.menu as unknown as MenuItem[]) : [],
                    }
                  : v
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Sync vendors to localStorage as backup
  useEffect(() => {
    if (vendors.length > 0) {
      localStorage.setItem('klm-vendors', JSON.stringify(vendors));
    }
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('klm-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('klm-orders', JSON.stringify(orders));
  }, [orders]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => [...prev, item]);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
  };

  const addOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        vendors,
        setVendors,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        orders,
        addOrder,
        updateOrderStatus,
        deliveryFee: DELIVERY_FEE,
        loadingVendors,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
