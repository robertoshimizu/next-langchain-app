
import { hasStripeSubscription } from "@/lib/stripe"
import { auth } from '@clerk/nextjs'
// import { withServerSideAuth } from '@clerk/nextjs/api'

// export getServerSideProps = withServerSideAuth();

export default async function InnerLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode
}) {
  const { } = auth();
  
  const stripeSubscribed = await hasStripeSubscription()
  return (
    <section>
      {/* Include shared UI here e.g. a header or sidebar */}
      <nav>Stripe subscribed: {stripeSubscribed}</nav>
 
      {children}
    </section>
  )
}