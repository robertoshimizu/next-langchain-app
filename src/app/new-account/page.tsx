// import { createStripeCustomerIfNull } from "@/lib/stripe";

import { useAuth } from "@clerk/nextjs";

const NewAccountPage = async () => {
  const { sessionId, userId } = useAuth();


  return (
    <div>
      <h1>New Account</h1>
    </div>
  );
}

export default NewAccountPage;