import { Globe } from 'lucide-react'

import { Button } from '@/components/ui/button'

const Hero51 = () => {
  return (
    <section className="py-32">
      <div className="">
        <div className="relative container mx-auto max-w-xl py-10 text-center">
          <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,hsl(var(--muted))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted))_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_50%_100%_at_50%_50%,#000_60%,transparent_100%)] bg-[size:64px_64px]"></div>
          <h1 className="mb-3 text-4xl lg:text-7xl">Explore a World of Digital Assets</h1>
          <p className="text-muted-foreground mb-5 text-sm md:text-base">
            Discover the future of asset management, tokenization, and liquidity with our comprehensive marketplace.
          </p>
          <Button>Marketplace</Button>
          <div className="mt-7 flex items-start justify-center gap-2 font-medium md:text-xl">
            <Globe className="mt-0.5 h-auto w-5" />
            Global Partnerships and Innovation
          </div>
        </div>
        <div className="mx-auto mt-14 max-w-7xl overflow-hidden py-8">
          <div className="relative w-full">
            <img
              src="https://elyql1q8be.ufs.sh/f/SidHyTM6vHFNQLWvivzN14QdEPrWYshVng93ZM7HxuzjGcae"
              alt="placeholder"
              className="relative left-1/2 mx-auto max-h-[480px] w-full rounded-xl object-cover shadow-md lg:static lg:max-w-[60vw] xl:max-w-3xl"
            />
            <img
              src="https://elyql1q8be.ufs.sh/f/SidHyTM6vHFNWIMqBG96heqapobuABSCvEXgf9wT2xdRkGM0"
              alt="placeholder"
              className="absolute top-0 right-20 -z-10 hidden max-h-60 -rotate-12 rounded-xl object-cover shadow-md lg:block"
            />
            <img
              src="https://elyql1q8be.ufs.sh/f/SidHyTM6vHFNLR6BVBUkbekxVPThBrLj0XlfsEA21g6FDyWQ"
              alt="placeholder"
              className="absolute right-20 bottom-0 hidden rotate-12 rounded-xl object-cover shadow-md md:max-h-60 lg:block"
            />
            <img
              src="https://elyql1q8be.ufs.sh/f/SidHyTM6vHFNB8oVFuE1doMSevCWuHDn6sZbN9cUk5fByPx4"
              alt="placeholder"
              className="absolute top-0 left-1/4 -z-10 max-h-44 -rotate-12 rounded-xl object-cover shadow-md min-[450px]:max-h-52 sm:left-1/3 md:max-h-60 lg:left-20"
            />
            <img
              src="https://elyql1q8be.ufs.sh/f/SidHyTM6vHFNKhNvzutjgzbv2hSlK6r51N43LuGOpitFsnxM"
              alt="placeholder"
              className="absolute bottom-0 left-1/4 max-h-44 rotate-12 rounded-xl object-cover shadow-md min-[450px]:max-h-52 sm:left-1/3 md:max-h-60 lg:left-20"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export { Hero51 }
