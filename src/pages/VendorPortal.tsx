import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Store, ChevronRight } from "lucide-react";

const VendorPortal = () => {
  const { vendors } = useApp();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="h-16 w-16 rounded-2xl gradient-warm mx-auto flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Vendor Portal</h1>
            <p className="text-muted-foreground mt-2">
              Select your vendor profile to manage orders and menu
            </p>
          </div>

          <div className="space-y-3">
            {vendors.map((vendor) => (
              <Link key={vendor.id} to={`/vendor-portal/${vendor.id}`}>
                <Card className="hover:shadow-elevated transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl gradient-warm flex items-center justify-center flex-shrink-0">
                        <Store className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {vendor.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {vendor.menuItems.length} menu items
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={vendor.isOpen ? "default" : "secondary"}>
                        {vendor.isOpen ? "Open" : "Closed"}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPortal;
