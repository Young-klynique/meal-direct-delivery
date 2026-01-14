import { Vendor } from "@/types";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { ChefHat, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface VendorCardProps {
  vendor: Vendor;
  index: number;
}

export const VendorCard = ({ vendor, index }: VendorCardProps) => {
  return (
    <Link to={`/vendor/${vendor.id}`}>
      <Card 
        className="group overflow-hidden border-0 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-fade-in"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <CardContent className="p-0">
          <div className="relative h-36 gradient-warm flex items-center justify-center overflow-hidden">
            <ChefHat className="h-16 w-16 text-primary-foreground/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
            <Badge 
              className={`absolute top-3 right-3 ${
                vendor.isOpen 
                  ? 'bg-secondary text-secondary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {vendor.isOpen ? 'Open' : 'Closed'}
            </Badge>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                  {vendor.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {vendor.description}
                </p>
              </div>
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-muted-foreground">
              <span>{vendor.menuItems.length} items available</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
