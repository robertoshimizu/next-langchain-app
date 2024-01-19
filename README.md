# Vercel AI SDK, Next.js, LangChain, OpenAI Chat Example

This example shows how to use the [Vercel AI SDK](https://sdk.vercel.ai/docs) with [Next.js](https://nextjs.org/), [LangChain](https://js.langchain.com), and [OpenAI](https://openai.com) to create a ChatGPT-like AI-powered streaming chat bot.

## Add Clerk Authentication

The properties in `.env` overrides the others.

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/chat
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/new-account

```
It important to add config in the middleware to protect routes and leave other public:
```javascript
import { authMiddleware } from "@clerk/nextjs";
 
// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
export default authMiddleware({
  publicRoutes: ['/','sign-in','sign-up','/api/webhooks'],
  debug: false,
});
 
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```
There are hooks for client side and for server-side:
```javascript
'use-client'
 const { isLoaded, userId, sessionId, getToken } = useAuth();
```

```javascript
const { userId } = auth();
```
- https://clerk.com/docs/references/nextjs/custom-signup-signin-pages

- https://clerk.com/docs/quickstarts/nextjs

- https://clerk.com/docs/references/nextjs/overview#client-side-helpers

## Stripe

There are several ways to deploy. 1) using predefined UI or 2) custom UI with links.
We have used an embed link. This link needs to be wrapped in react.

```javascript
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
```
Then use it in a component. We use props to send metadata to stripe so we reconcile it in the callback.

```javascript
<div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
  <div className="rounded-2xl py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
    <StripePricingTable user={payload} />
    <button 
      className='bg-red-700 text-white max-w-sm p-3 text-base border border-zinc-200 rounded-md w-48 mx-auto'
      onClick={cancelarConta}
      >
      Não tenho interesse 
    </button>
  </div> 
</div>
```
For that, we need to define a webhook ('/api/webhooks'):

```javascript
// webhook to handle stripe events
import { prisma } from '@/lib/db';
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
```

In order to test locally the webhook, we need to use these commands:
https://dashboard.stripe.com/test/webhooks


![alt text](/public/webhook_stripe.png "webhooks commands")

## Prisma

In order to keep track of customers, to check if it has a valid subscription, we decided to record customers in a `vercel postgres db` and used `prisma` as ORM. In order to visualize the db, we used `datagrip`.

We created an `inner-layout` and check if the user has subcription in order to allow use app.

```javascript
export const stripe = new Stripe(String(process.env.STRIPE_SECRET_KEY), {
    apiVersion: '2023-10-16',
});

export async function hasStripeSubscription() {
    const { userId } = auth();
    
    if (userId) {
        try {
            const user = await prisma.user.findFirst({ where: { clerk_id: userId } });
            if (user?.stripe_subscription_id){
                return true;
            } else return false;
        } catch (error) {
            console.log(error);
        }
    } else return false;
}
```





## Deploy your own

Deploy the example using [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=ai-sdk-example):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai%2Ftree%2Fmain%2Fexamples%2Fnext-langchain&env=OPENAI_API_KEY&envDescription=OpenAI%20API%20Key&envLink=https%3A%2F%2Fplatform.openai.com%2Faccount%2Fapi-keys&project-name=ai-chat-langchain&repository-name=next-ai-chat-langchain)

## How to use

Execute [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) with [npm](https://docs.npmjs.com/cli/init), [Yarn](https://yarnpkg.com/lang/en/docs/cli/create/), or [pnpm](https://pnpm.io) to bootstrap the example:

```bash
pnpm create next-app --example https://github.com/vercel/ai/tree/main/examples/next-langchain next-langchain-app
```

To run the example locally you need to:

1. Sign up at [OpenAI's Developer Platform](https://platform.openai.com/signup).
2. Go to [OpenAI's dashboard](https://platform.openai.com/account/api-keys) and create an API KEY.
3. Set the required OpenAI environment variable as the token value as shown [the example env file](./.env.local.example) but in a new file called `.env.local`.
4. `pnpm install` to install the required dependencies.
5. `pnpm dev` to launch the development server.

## Learn More

To learn more about LangChain, OpenAI, Next.js, and the Vercel AI SDK take a look at the following resources:

- [Vercel AI SDK docs](https://sdk.vercel.ai/docs) - learn mode about the Vercel AI SDK
- [Vercel AI Playground](https://play.vercel.ai) - compare and tune 20+ AI models side-by-side
- [LangChain Documentation](https://js.langchain.com/docs) - learn about LangChain
- [OpenAI Documentation](https://platform.openai.com/docs) - learn about OpenAI features and API.
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.


# Python Hello World

This example shows how to use Python on Vercel with Serverless Functions using the [Python Runtime](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/python).


## Install python 3.9 using pipenv, to generate Pipfile
```bash
pipenv --python 3.9
pipenv shell
```

## Running Locally

```bash
pnpm i -g vercel
npx vercel dev
```

Your Python API is now available at `http://localhost:3000/api/python`.

