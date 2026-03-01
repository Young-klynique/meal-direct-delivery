import { Header } from "@/components/Header";
import { VendorCard } from "@/components/VendorCard";
import { useApp } from "@/context/AppContext";
import { Clock, Truck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { vendors, deliveryFee, loadingVendors } = useApp();

  return (
    <div className="min-h-screen gradient-hero">
      <Header />
      
      {/* Hero Section */}
      <section className="container py-12 md:py-16">
        <div className="max-w-2xl animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Fresh Food,
            <span className="text-primary"> Delivered Fast</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Order from your favorite KLM canteen vendors and get food delivered right to your desk. No more long walks!
          </p>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-card">
              <Truck className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">GH₵{deliveryFee} delivery</span>
            </div>
            <div className="flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-card">
              <Clock className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium">15-30 min</span>
            </div>
          </div>
        </div>
      </section>

      {/* Vendors Section */}
      <section className="container pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Available Vendors</h2>
            <p className="text-muted-foreground">Choose your favorite to start ordering</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingVendors ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </>
          ) : (
            vendors.map((vendor, index) => (
              <VendorCard key={vendor.id} vendor={vendor} index={index} />
            ))
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          <p>KLM Eats - Food Delivery Service</p>
          <p className="mt-1">Pay on delivery • Sign up to order</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
