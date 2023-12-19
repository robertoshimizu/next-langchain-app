import { SignIn } from "@clerk/nextjs";
 
export default function Page() {
  return (
  <div className="mx-auto w-full max-w-md py-24 flex flex-col stretch">
    <SignIn
      path="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/chat"
      afterSignUpUrl="/account"
    />
  </div>
  )
}