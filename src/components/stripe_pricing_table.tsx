'use client';
import React, { useEffect } from "react";

export const StripePricingTable = (params:any) => {
  console.log("StripePricingTable", params);
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://js.stripe.com/v3/pricing-table.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    }
  }, []);

  return React.createElement("stripe-pricing-table", { 
    "pricing-table-id": process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE,
    "publishable-key": process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    "client-reference-id": params.user.id,
    "customer-email": params.user.email,
   });
}
