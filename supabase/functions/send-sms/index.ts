import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  vendorPhone: string;
  vendorName: string;
  customerName: string;
  customerPhone: string;
  orderItems: string;
  total: number;
  location: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("HUBTEL_CLIENT_ID");
    const clientSecret = Deno.env.get("HUBTEL_CLIENT_SECRET");
    const senderId = Deno.env.get("HUBTEL_SENDER_ID");

    if (!clientId || !clientSecret || !senderId) {
      throw new Error("Hubtel credentials not configured");
    }

    const { vendorPhone, vendorName, customerName, customerPhone, orderItems, total, location }: SMSRequest = await req.json();

    if (!vendorPhone) {
      console.log("No vendor phone provided, skipping SMS");
      return new Response(
        JSON.stringify({ success: true, message: "No vendor phone, SMS skipped" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Format the message
    const message = `KLM Eats Order!\n${customerName} (${customerPhone})\nItems: ${orderItems}\nTotal: GH₵${total.toFixed(2)}\nLocation: ${location}`;

    // Hubtel SMS API
    const credentials = btoa(`${clientId}:${clientSecret}`);
    
    const response = await fetch("https://smsc.hubtel.com/v1/messages/send", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        From: senderId,
        To: vendorPhone,
        Content: message,
      }),
    });

    const result = await response.json();
    console.log("Hubtel SMS response:", result);

    if (!response.ok) {
      throw new Error(`Hubtel API error: ${JSON.stringify(result)}`);
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
