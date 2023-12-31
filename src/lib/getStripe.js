import { loadStripe } from '@stripe/stripe-js';

let stripePromise;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

const options = {
    // passing the client secret obtained from the server
    clientSecret: 'sk_test_0XKU7uklmNEKLSPZyia4ps0u00uvUcEMmC',
  };

export { getStripe, options };