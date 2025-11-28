import Image from "next/image";
import { AppleHelloEnglishEffect } from "@/components/ui/shadcn-io/apple-hello-effect";
import { Navbar01 } from '@/components/ui/shadcn-io/navbar-01';

export default function Home() {
  return (
    <>

      <div className="relative w-full">
        <Navbar01 />
      </div>
      <div className="flex w-full h-screen flex-col justify-center items-center gap-16">
        <AppleHelloEnglishEffect speed={1.1} />
      </div>
    </>
  );
}
