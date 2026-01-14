import { useState } from "react";
import { MenuItem, AddOn, CartItem } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Plus, Minus, ShoppingCart, Utensils } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

interface MenuItemCardProps {
  item: MenuItem;
  vendorId: string;
  vendorName: string;
}

export const MenuItemCard = ({ item, vendorId, vendorName }: MenuItemCardProps) => {
  const { addToCart } = useApp();
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [customItems, setCustomItems] = useState<{ name: string; price: number }[]>([]);
  const [newCustomName, setNewCustomName] = useState("");
  const [newCustomPrice, setNewCustomPrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleAddOn = (addOn: AddOn) => {
    setSelectedAddOns((prev) =>
      prev.find((a) => a.id === addOn.id)
        ? prev.filter((a) => a.id !== addOn.id)
        : [...prev, addOn]
    );
  };

  const addCustomItem = () => {
    if (newCustomName && newCustomPrice) {
      setCustomItems((prev) => [
        ...prev,
        { name: newCustomName, price: parseFloat(newCustomPrice) || 0 },
      ]);
      setNewCustomName("");
      setNewCustomPrice("");
    }
  };

  const removeCustomItem = (index: number) => {
    setCustomItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const addOnsTotal = selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
    const customTotal = customItems.reduce((sum, item) => sum + item.price, 0);
    return (item.basePrice + addOnsTotal + customTotal) * quantity;
  };

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      menuItemId: item.id,
      menuItemName: item.name,
      vendorId,
      vendorName,
      basePrice: item.basePrice,
      selectedAddOns,
      customItems,
      quantity,
    };
    addToCart(cartItem);
    toast.success(`Added ${item.name} to cart!`);
    
    // Reset selections
    setSelectedAddOns([]);
    setCustomItems([]);
    setQuantity(1);
    setIsExpanded(false);
  };

  return (
    <Card className="overflow-hidden border shadow-card hover:shadow-elevated transition-all duration-300">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-lg gradient-warm flex items-center justify-center flex-shrink-0">
              <Utensils className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">{item.name}</CardTitle>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-lg font-bold text-primary">GH₵{item.basePrice}</span>
            <p className="text-xs text-muted-foreground">base price</p>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 animate-fade-in">
          <div className="space-y-6">
            {/* Add-ons */}
            {item.addOns.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-3 block">Select Add-ons</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {item.addOns.map((addOn) => (
                    <label
                      key={addOn.id}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedAddOns.find((a) => a.id === addOn.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Checkbox
                        checked={selectedAddOns.some((a) => a.id === addOn.id)}
                        onCheckedChange={() => toggleAddOn(addOn)}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">{addOn.name}</span>
                        <span className="text-xs text-muted-foreground">+GH₵{addOn.price}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Custom items */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Special Requests</Label>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Item name"
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={newCustomPrice}
                  onChange={(e) => setNewCustomPrice(e.target.value)}
                  className="w-24"
                />
                <Button type="button" size="icon" onClick={addCustomItem} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {customItems.length > 0 && (
                <div className="space-y-2">
                  {customItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <span className="text-sm">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">GH₵{item.price}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => removeCustomItem(index)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Quantity</Label>
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Total and Add to Cart */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-primary">GH₵{calculateTotal().toFixed(2)}</p>
              </div>
              <Button onClick={handleAddToCart} variant="warm" size="lg">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
