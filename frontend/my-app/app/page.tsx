import { AppleHelloEnglishEffect } from "@/components/ui/shadcn-io/apple-hello-effect";
import { Navbar01 } from "@/components/ui/shadcn-io/navbar-01";
import Link from "next/link";

export default function Home() {
  return (
    <>

      <div className="relative w-full">
        <Navbar01 />
      </div>
      <section className="flex flex-col items-center justify-center text-center w-full h-[calc(100vh-80px)] px-6">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">

          <div className="mt-16">
            <AppleHelloEnglishEffect speed={1.1} />
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Bem-vindo ao <span className="text-blue-600">SAEP</span>
          </h1>


          <p className="text-lg md:text-xl text-muted-foreground">
            Sistema inteligente para gestão de estoque, controle e rastreamento completo.
          </p>


          <div className="flex gap-4 mt-4">
            <Link
              href="/login"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Acessar Sistema
            </Link>
          </div>
        </div>


      </section>
    </>
  );
}
