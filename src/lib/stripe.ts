import Stripe from 'stripe';

import { PrismaClient } from "@prisma/client";
import { auth } from '@clerk/nextjs';

const prisma = new PrismaClient();

//price_1NarR3APMZcBliJSoefCKTi5

export const stripe = new Stripe(String(process.env.STRIPE_SECRET_KEY), {
    apiVersion: '2023-10-16',
});

export async function hasStripeSubscription() {
    const { userId } = auth();
    
    if (userId) {
        try {
            const user = await prisma.user.findFirst({ where: { clerk_id: userId } });
            if (user?.stripe_id) {
                const subscriptions = await stripe.subscriptions.list({
                customer: String(user?.stripe_id)
                })

                return subscriptions.data.length > 0;
            }
            return false;
        } catch (error) {
            console.log(error);
        }
        

    }

    return false;
}

export async function createCheckoutLink(customer: string) {
    const checkout = await stripe.checkout.sessions.create({
        success_url: "http://localhost:3000/dashboard/billing?success=true",
        cancel_url: "http://localhost:3000/dashboard/billing?success=true",
        customer: customer,
        line_items: [
            {
                price: 'price_1NarR3APMZcBliJSoefCKTi5'
            }
        ],
        mode: "subscription"
    })

    return checkout.url;
}

// export async function createStripeCustomerIfNull() {

//     const { sessionId, userId } = useAuth();

//     if (sessionId) {
//         const user = await prisma.user.findFirst({ where: { clerk_id: userId } });

//         if (!user?.stripe_id){
//             const customer = await stripe.customers.create({
//                 email: String(userId),
//             })
//         }
//     }

// }