"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const AppSidebar = dynamic(
  () => import("@/components/app-sidebar").then((mod) => mod.AppSidebar),
  {
    ssr: false,
  }
);

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [userName, setUserName] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("access");

    if (!token) {
      router.replace("/login");
      return;
    }

    const storedName = localStorage.getItem("user_nome");
    setUserName(storedName);
    setIsReady(true);
  }, [router]);

  if (!isReady) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 items-center justify-between px-4 border-b bg-background">
          <div className="flex items-center gap-3">
            <SidebarTrigger />

            <div className="flex flex-col leading-tight">
              <span className="text-xs text-muted-foreground">
                Usuário logado:
              </span>
              <span className="font-semibold">
                {userName ?? "Usuário"}
              </span>
            </div>
          </div>
        </header>

        <main className="p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
