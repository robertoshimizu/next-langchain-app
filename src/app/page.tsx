'use client';
import { UserButton } from "@clerk/nextjs";

export default function LandingPage() {

  return (
    <div className="mx-auto w-full max-w-md py-24 flex flex-col stretch">
      <div className="whitespace-pre-wrap">
        Welcome to the landing page!
      </div>
      <div className="h-screen">
        <UserButton afterSignOutUrl="/"/>
      </div>

    </div>
  );
}
