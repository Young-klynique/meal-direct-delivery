import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, QrCode } from "lucide-react";

interface QRCodeDisplayProps {
  url?: string;
  title?: string;
}

// Use the published URL instead of preview URL
const PUBLISHED_URL = "https://klmeat.vercel.app/";

export const QRCodeDisplay = ({ url, title = "Scan to Order" }: QRCodeDisplayProps) => {
  // Always use the published Vercel URL regardless of any passed `url` prop
  const qrUrl = PUBLISHED_URL;
  const handleDownload = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = "klm-eats-qr-code.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="text-center">
        <div className="h-12 w-12 rounded-xl bg-primary/10 mx-auto flex items-center justify-center mb-2">
          <QrCode className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Print and place this QR code at your office
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <QRCodeSVG
            id="qr-code-svg"
            value={qrUrl}
            size={200}
            level="H"
            includeMargin
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
        <p className="text-xs text-muted-foreground text-center max-w-[200px]">
          Scan with your phone camera to order food
        </p>
        <Button onClick={handleDownload} variant="outline" className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Download QR Code
        </Button>
      </CardContent>
    </Card>
  );
};
