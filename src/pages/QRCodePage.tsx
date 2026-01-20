import { Header } from "@/components/Header";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const QRCodePage = () => {
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

        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Office QR Code</h1>
            <p className="text-muted-foreground">
              Download and print this QR code for your office. Staff can scan it to order food directly.
            </p>
          </div>

          <QRCodeDisplay title="KLM Eats - Order Food" />

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Click "Download QR Code" to save the image</li>
              <li>Print the QR code on paper or a poster</li>
              <li>Place it in visible areas (reception, break room, etc.)</li>
              <li>Staff can scan with their phone camera to order</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodePage;
