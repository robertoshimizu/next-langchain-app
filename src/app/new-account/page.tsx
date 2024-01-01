'use client';
import { useUser, useClerk } from '@clerk/nextjs';
import { CheckIcon } from '@heroicons/react/20/solid'
import { StripePricingTable } from '@/components/stripe_pricing_table';
import { useRouter } from 'next/navigation'

const includedFeatures = [
  'Private forum access',
  'Member resources',
  'Entry to annual conference',
  'Official member t-shirt',
]

const NewAccountPage = () => {
  const { signOut } = useClerk();
  const router = useRouter()

  function cancelarConta() {
    console.log("cancelarConta");
    signOut(() => router.push("/"))
    
  }

  const { user } = useUser();
  const payload = {
    "id": user?.id,
    "email": user?.emailAddresses[0].emailAddress,
  }

  return (
    <div className="mx-auto mt-16 max-w-5xl px-6 lg:px-8">
      <div className="py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Olá {user?.firstName}</h1>
          <p className="mt-4 text-lg text-gray-500">Para continuar você deve assinar um plano.</p>
        </div>
      </div>
      <div className="mx-auto mt-16 max-w-2xl rounded-3xl ring-1 ring-gray-200 sm:mt-20 lg:mx-0 lg:flex lg:max-w-none">
          <div className="p-8 sm:p-10 lg:flex-auto">
            <h3 className="text-2xl font-bold tracking-tight text-gray-900">Lifetime membership</h3>
            <p className="mt-6 text-base leading-7 text-gray-600">
              Lorem ipsum dolor sit amet consect etur adipisicing elit. Itaque amet indis perferendis blanditiis
              repellendus etur quidem assumenda.
            </p>
            <div className="mt-10 flex items-center gap-x-4">
              <h4 className="flex-none text-sm font-semibold leading-6 text-indigo-600">What’s included</h4>
              <div className="h-px flex-auto bg-gray-100" />
            </div>
            <ul
              role="list"
              className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6"
            >
              {includedFeatures.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  <CheckIcon className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
 
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
  
        </div>

    </div>
  
  );
}

export default NewAccountPage;