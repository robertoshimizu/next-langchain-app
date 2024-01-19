// webhook to handle stripe events
import { prisma } from '@/lib/db';
import Cors from 'micro-cors';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const secret: string = process.env.STRIPE_WEBHOOK_SECRET!
const stripe = new Stripe(String(process.env.STRIPE_SECRET_KEY), {
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
    
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = event.data.object;
        // Then define and call a function to handle the event payment_intent.succeeded
        break;
      // ... handle other event types
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        // Then define and call a function to handle the event invoice.payment_succeeded
        break;
      case 'invoice.paid':
        const invoicePaid = event.data.object;
        // Then define and call a function to handle the event invoice.paid
        break;
      case 'invoice.finalized':
        const invoiceFinalized = event.data.object;
        // Then define and call a function to handle the event invoice.finalized
        break;
      case 'invoice.created':
        const invoiceCreated = event.data.object;
        // Then define and call a function to handle the event invoice.created
        break;
      case 'customer.updated':
        const customerUpdated = event.data.object;
        // Then define and call a function to handle the event customer.updated
        break;
      case 'payment_method.attached':
        const paymentMethodAttached = event.data.object;
        // Then define and call a function to handle the event payment_method.attached
        break;
      case 'customer.created':
        const customerCreated = event.data.object;
        // Then define and call a function to handle the event customer.created
        break;
      case 'checkout.session.completed':
        const checkoutSessionCompleted = event.data.object;
        console.log('************** New Customer subscription **************');
        console.log(checkoutSessionCompleted.customer);
        console.log(checkoutSessionCompleted.status);
        console.log('*******************************************************')
        // Then define and call a function to handle the event checkout.session.completed
        // const payload = {
        //   'client_reference_id': checkoutSessionCompleted.client_reference_id,
        //   'stripe_customer_id': checkoutSessionCompleted.customer,
        //   'stripe_subscription_id': checkoutSessionCompleted.subscription,
        //   'email': checkoutSessionCompleted.customer_details?.email,
        //   'phone': checkoutSessionCompleted.customer_details?.phone,
        //   'name': checkoutSessionCompleted.customer_details?.name,
        //   'created': checkoutSessionCompleted.created,
        // }
        const user = await prisma.user.create({
                    data: {
                      // @ts-ignore
                      email: checkoutSessionCompleted.customer_details?.email,
                      phone: checkoutSessionCompleted.customer_details?.phone,
                      name: checkoutSessionCompleted.customer_details?.name,
                      clerk_id: checkoutSessionCompleted.client_reference_id,
                      // @ts-ignore
                      stripe_customer_id: checkoutSessionCompleted.customer,
                      // @ts-ignore
                      stripe_subscription_id: checkoutSessionCompleted.subscription,
                    },
                  })
                  
        break;
      case 'setup_intent.succeeded':
        const setupIntentSucceeded = event.data.object;
        // Then define and call a function to handle the event setup_intent.succeeded
        break;  
      case 'customer.subscription.created':
        const customerSubscriptionCreated = event.data.object;
        // Then define and call a function to handle the event customer.subscription.created
        break;
      case 'setup_intent.created':
        const setupIntentCreated = event.data.object;
        // Then define and call a function to handle the event setup_intent.created
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
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