import { SignUp } from "@clerk/nextjs";
 
export default function Page() {
  return (
  <div className="mx-auto w-full max-w-md py-24 flex flex-col stretch">
    <SignUp
      path="/sign-up"
      signInUrl="/sign-in"
      afterSignInUrl="/chat"
      afterSignUpUrl="/account"
    />
  </div>
  )
}