import { Vendor } from "@/types";

export const DELIVERY_FEE = 5; // GHC 5

export const initialVendors: Vendor[] = [
  {
    id: "vendor-1",
    name: "Mama Akos Kitchen",
    description: "Traditional Ghanaian dishes made with love",
    isOpen: true,
    menuItems: [
      {
        id: "item-1-1",
        name: "Waakye",
        basePrice: 15,
        description: "Rice and beans cooked together, served with your choice of accompaniments",
        addOns: [
          { id: "addon-1", name: "Stew", price: 3 },
          { id: "addon-2", name: "Shito", price: 2 },
          { id: "addon-3", name: "Macaroni", price: 3 },
          { id: "addon-4", name: "Gari", price: 1 },
          { id: "addon-5", name: "Sausage", price: 5 },
          { id: "addon-6", name: "Salad", price: 3 },
          { id: "addon-7", name: "Chicken", price: 15 },
          { id: "addon-8", name: "Fish", price: 12 },
          { id: "addon-9", name: "Egg", price: 4 },
        ],
      },
      {
        id: "item-1-2",
        name: "Jollof Rice",
        basePrice: 18,
        description: "Famous Ghanaian jollof rice with rich tomato flavor",
        addOns: [
          { id: "addon-10", name: "Chicken", price: 15 },
          { id: "addon-11", name: "Fish", price: 12 },
          { id: "addon-12", name: "Salad", price: 3 },
          { id: "addon-13", name: "Plantain", price: 4 },
        ],
      },
    ],
  },
  {
    id: "vendor-2",
    name: "Auntie Ama's Place",
    description: "Delicious homestyle meals at affordable prices",
    isOpen: true,
    menuItems: [
      {
        id: "item-2-1",
        name: "Rice & Stew",
        basePrice: 12,
        description: "Plain rice with rich tomato stew",
        addOns: [
          { id: "addon-20", name: "Palava Sauce", price: 5 },
          { id: "addon-21", name: "Macaroni", price: 3 },
          { id: "addon-22", name: "Leafs", price: 4 },
          { id: "addon-23", name: "Chicken", price: 15 },
          { id: "addon-24", name: "Sausage", price: 5 },
          { id: "addon-25", name: "Meat", price: 10 },
        ],
      },
      {
        id: "item-2-2",
        name: "Banku & Tilapia",
        basePrice: 35,
        description: "Fresh banku with grilled tilapia and pepper",
        addOns: [
          { id: "addon-26", name: "Extra Pepper", price: 3 },
          { id: "addon-27", name: "Kenkey", price: 5 },
        ],
      },
    ],
  },
  {
    id: "vendor-3",
    name: "Quick Bites Corner",
    description: "Fast and tasty snacks for busy workers",
    isOpen: true,
    menuItems: [
      {
        id: "item-3-1",
        name: "Fried Rice",
        basePrice: 20,
        description: "Stir-fried rice with vegetables",
        addOns: [
          { id: "addon-30", name: "Chicken", price: 15 },
          { id: "addon-31", name: "Shrimp", price: 18 },
          { id: "addon-32", name: "Extra Vegetables", price: 5 },
        ],
      },
    ],
  },
  {
    id: "vendor-4",
    name: "Kofi's Chop Bar",
    description: "Authentic local dishes served fresh",
    isOpen: false,
    menuItems: [],
  },
  {
    id: "vendor-5",
    name: "Fresh & Light",
    description: "Healthy meal options for the health conscious",
    isOpen: true,
    menuItems: [
      {
        id: "item-5-1",
        name: "Salad Bowl",
        basePrice: 15,
        description: "Fresh mixed salad with your choice of protein",
        addOns: [
          { id: "addon-50", name: "Grilled Chicken", price: 15 },
          { id: "addon-51", name: "Boiled Eggs", price: 4 },
          { id: "addon-52", name: "Avocado", price: 8 },
        ],
      },
    ],
  },
];
