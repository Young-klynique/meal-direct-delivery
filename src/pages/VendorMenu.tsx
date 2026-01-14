import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { MenuItemCard } from "@/components/MenuItemCard";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChefHat, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const VendorMenu = () => {
  const { vendorId } = useParams();
  const { vendors } = useApp();

  const vendor = vendors.find((v) => v.id === vendorId);

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Vendor not found</h1>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to vendors
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Vendor Header */}
      <div className="gradient-warm">
        <div className="container py-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to vendors
            </Button>
          </Link>
          
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
              <ChefHat className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="text-primary-foreground">
              <h1 className="text-2xl md:text-3xl font-bold">{vendor.name}</h1>
              <p className="text-primary-foreground/80 mt-1">{vendor.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="container py-8">
        {!vendor.isOpen && (
          <Alert className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This vendor is currently closed. You cannot place orders at this time.
            </AlertDescription>
          </Alert>
        )}

        {vendor.menuItems.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No menu items yet</h2>
            <p className="text-muted-foreground">
              This vendor hasn't added any items to their menu.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Menu ({vendor.menuItems.length} items)</h2>
            {vendor.menuItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                vendorId={vendor.id}
                vendorName={vendor.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorMenu;
