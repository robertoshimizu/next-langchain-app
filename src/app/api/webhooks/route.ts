// webhook to handle stripe events
import Cors from 'micro-cors';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const secret: string = process.env.STRIPE_WEBHOOK_SECRET!
export const stripe = new Stripe(String(process.env.STRIPE_SECRET_KEY), {
    apiVersion: '2023-10-16',
});

const cors = Cors({
  allowMethods: ["POST", "HEAD"],
});


export async function POST(req: Request) {
  try {
    const body = await req.text();

    const signature = req.headers.get("stripe-signature")!;
    
    const event = stripe.webhooks.constructEvent(body, signature, secret);
    
    console.log("event", event);
    
    return NextResponse.json({ result: event, ok: true });
  } catch (error) {
    
    console.error(error);
    return NextResponse.json(
      {
        message: "something went wrong",
        ok: false,
      },
      { status: 500 }
    );
  }
}