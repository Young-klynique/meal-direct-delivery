export interface AddOn {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  basePrice: number;
  description?: string;
  addOns: AddOn[];
  image?: string;
}

export interface Vendor {
  id: string;
  name: string;
  description: string;
  image?: string;
  isOpen: boolean;
  menuItems: MenuItem[];
}

export interface CartItem {
  menuItemId: string;
  menuItemName: string;
  vendorId: string;
  vendorName: string;
  basePrice: number;
  selectedAddOns: AddOn[];
  customItems: { name: string; price: number }[];
  quantity: number;
}

export interface Order {
  id: string;
  vendorId: string;
  vendorName: string;
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  deliveryLocation: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  createdAt: string;
}
