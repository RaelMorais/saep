"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

type Produto = {
  id: number;
  nome: string;
  descricao: string;
  sku: string;
  estoque_minimo: number;
  estoque_atual: number;
};

export default function ListaProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function carregarProdutos() {
    try {
      setLoading(true);
      setErro(null);
      setInfo(null);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;

      const url =
        busca.trim().length > 0
          ? `${API_BASE_URL}/produtos/?search=${encodeURIComponent(busca)}`
          : `${API_BASE_URL}/produtos/`;

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setErro(json?.detail ?? "Falha ao carregar produtos.");
        return;
      }

      const data: Produto[] = Array.isArray(json) ? json : json.results ?? [];
      setProdutos(data);

      if (data.length === 0) {
        setInfo("Nenhum produto encontrado para o filtro atual.");
      }
    } catch {
      setErro("Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProdutos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const produtosFiltrados = useMemo(() => {
    if (!busca) return produtos;
    const termo = busca.toLowerCase();
    return produtos.filter((p) =>
      [p.nome, p.descricao, p.sku].join(" ").toLowerCase().includes(termo)
    );
  }, [produtos, busca]);

  const totalComEstoqueBaixo = useMemo(
    () =>
      produtosFiltrados.filter(
        (p) => p.estoque_atual < p.estoque_minimo
      ).length,
    [produtosFiltrados]
  );

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle>Produtos</CardTitle>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="flex gap-2 w-full md:w-auto">
              <Input
                placeholder="Buscar por nome, descrição ou SKU..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={() => setBusca("")}>
                Limpar
              </Button>
            </div>
            <Button type="button" onClick={carregarProdutos}>
              Atualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {erro && (
            <Alert variant="destructive">
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          {info && !erro && (
            <Alert>
              <AlertTitle>Informação</AlertTitle>
              <AlertDescription>{info}</AlertDescription>
            </Alert>
          )}

          {!erro && totalComEstoqueBaixo > 0 && (
            <Alert variant="destructive">
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>
                {totalComEstoqueBaixo}{" "}
                {totalComEstoqueBaixo === 1
                  ? "produto está com estoque abaixo do mínimo."
                  : "produtos estão com estoque abaixo do mínimo."}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Total de produtos listados: {produtosFiltrados.length}
            </p>
          </div>

          {loading && <p>Carregando produtos...</p>}

          {!loading && produtosFiltrados.length === 0 && !erro && (
            <p className="text-sm text-muted-foreground">
              Nenhum produto encontrado.
            </p>
          )}

          {!loading && produtosFiltrados.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-md overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left border-b">ID</th>
                    <th className="px-3 py-2 text-left border-b">Nome</th>
                    <th className="px-3 py-2 text-left border-b">SKU</th>
                    <th className="px-3 py-2 text-left border-b">
                      Estoque atual
                    </th>
                    <th className="px-3 py-2 text-left border-b">
                      Estoque mínimo
                    </th>
                    <th className="px-3 py-2 text-left border-b">
                      Status de estoque
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.map((p) => {
                    const abaixoMinimo = p.estoque_atual < p.estoque_minimo;

                    return (
                      <tr
                        key={p.id}
                        className={
                          "border-b last:border-b-0 " +
                          (abaixoMinimo ? "bg-destructive/5" : "hover:bg-muted/60")
                        }
                      >
                        <td className="px-3 py-2">{p.id}</td>
                        <td className="px-3 py-2">{p.nome}</td>
                        <td className="px-3 py-2">{p.sku}</td>
                        <td className="px-3 py-2">{p.estoque_atual}</td>
                        <td className="px-3 py-2">{p.estoque_minimo}</td>
                        <td className="px-3 py-2">
                          {abaixoMinimo ? (
                            <span className="inline-flex items-center rounded-full bg-destructive/10 text-destructive px-2 py-0.5 text-xs font-medium">
                              Abaixo do mínimo
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-xs font-medium">
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
