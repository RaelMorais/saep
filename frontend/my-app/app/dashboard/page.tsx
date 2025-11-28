"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Gestão de Estoque</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Utilize o menu para acessar o cadastro de produtos e a gestão de estoque.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/produtos">Ir para Cadastro de Produto</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/estoque">Ir para Gestão de Estoque</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
