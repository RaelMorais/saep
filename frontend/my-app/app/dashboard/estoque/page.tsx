"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

type Produto = {
  id: number;
  nome: string;
  sku: string;
  estoque_minimo: number;
  estoque_atual: number;
};

type Estoque = {
  id: number;
  descricao: string;
  setor: string;
};

const movimentacaoSchema = z.object({
  produtoId: z.coerce
    .number({ message: "Selecione um produto" })
    .int("Valor inválido")
    .min(1, { message: "Selecione um produto" }),
  estoqueId: z.coerce
    .number({ message: "Selecione um estoque" })
    .int("Valor inválido")
    .min(1, { message: "Selecione um estoque" }),
  tipo: z.enum(["E", "S"], {
    message: "Selecione o tipo de movimentação",
  }),
  quantidade: z.coerce
    .number({
      message: "Informe a quantidade",
    })
    .int("Quantidade deve ser inteira")
    .min(1, "Quantidade mínima é 1"),
  data_movimentacao: z.string().min(1, "Data obrigatória"),
});

type MovimentacaoFormValues = z.infer<typeof movimentacaoSchema>;

type InfoState = {
  mensagem: string;
  produto: string;
  tipo: "Entrada" | "Saída";
  quantidade: number;
  estoque_atual: number | null;
  estoque_minimo: number | null;
  abaixo_minimo: boolean;
};

function ordenarProdutosPorNome(produtos: Produto[]): Produto[] {
  const arr = [...produtos];
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j].nome.localeCompare(arr[minIndex].nome) < 0) {
        minIndex = j;
      }
    }
    if (minIndex !== i) {
      const temp = arr[i];
      arr[i] = arr[minIndex];
      arr[minIndex] = temp;
    }
  }
  return arr;
}

export default function GestaoEstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [estoques, setEstoques] = useState<Estoque[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<InfoState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  const [movDialogOpen, setMovDialogOpen] = useState(false);

  const form = useForm<MovimentacaoFormValues>({
    resolver: zodResolver(movimentacaoSchema) as any,
    defaultValues: {
      produtoId: 0,
      estoqueId: 0,
      tipo: "E",
      quantidade: 1,
      data_movimentacao: "",
    },
  });

  async function carregarDados() {
    try {
      setLoading(true);
      setErro(null);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;

      const [resProdutos, resEstoques] = await Promise.all([
        fetch(`${API_BASE_URL}/produtos/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
        fetch(`${API_BASE_URL}/estoques/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
      ]);

      const jsonProdutos = await resProdutos.json();
      const jsonEstoques = await resEstoques.json();

      if (!resProdutos.ok || !resEstoques.ok) {
        setErro("Falha ao carregar dados de produtos/estoques.");
        return;
      }

      const produtosData: Produto[] = Array.isArray(jsonProdutos)
        ? jsonProdutos
        : jsonProdutos.results ?? [];
      const estoquesData: Estoque[] = Array.isArray(jsonEstoques)
        ? jsonEstoques
        : jsonEstoques.results ?? [];

      setProdutos(ordenarProdutosPorNome(produtosData));
      setEstoques(estoquesData);
    } catch (e) {
      setErro("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase();
    return produtos.filter((p) =>
      [p.nome, p.sku].join(" ").toLowerCase().includes(termo)
    );
  }, [produtos, busca]);

  function abrirModalMovimentacao() {
    setErro(null);
    setInfo(null);
    form.reset({
      produtoId: 0,
      estoqueId: 0,
      tipo: "E",
      quantidade: 1,
      data_movimentacao: "",
    });
    setMovDialogOpen(true);
  }

  function fecharModalMovimentacao() {
    setMovDialogOpen(false);
    form.reset({
      produtoId: 0,
      estoqueId: 0,
      tipo: "E",
      quantidade: 1,
      data_movimentacao: "",
    });
  }

  async function onSubmit(values: MovimentacaoFormValues) {
    try {
      setErro(null);
      setInfo(null);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;
      if (!token) {
        setErro("Usuário não autenticado.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/movimentacoes/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_produto: values.produtoId,
          id_estoque: values.estoqueId,
          quantidade: values.quantidade,
          tipo: values.tipo,
          movimentedAt: values.data_movimentacao + "T00:00:00Z",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data?.detail ?? "Erro ao registrar movimentação.");
        return;
      }

      await carregarDados();

      const abaixoMinimo = Boolean(data.estoque_abaixo_minimo);
      const estoqueAtual =
        data.quantidade_atual ?? data.estoque_atual ?? null;
      const estoqueMinimo = data.estoque_minimo ?? null;

      const produtoNome =
        data.produto?.nome ??
        produtos.find((p) => p.id === values.produtoId)?.nome ??
        "Produto selecionado";

      setInfo({
        mensagem: abaixoMinimo
          ? "Estoque abaixo do mínimo após movimentação"
          : "Movimentação registrada com sucesso",
        produto: produtoNome,
        tipo: values.tipo === "E" ? "Entrada" : "Saída",
        quantidade: values.quantidade,
        estoque_atual: estoqueAtual,
        estoque_minimo: estoqueMinimo,
        abaixo_minimo: abaixoMinimo,
      });

      fecharModalMovimentacao();
    } catch (e) {
      setErro("Erro ao registrar movimentação.");
    }
  }

  const produtoSelecionadoId = form.watch("produtoId");
  const tipoSelecionado = form.watch("tipo");

  function getInfoAlertClasses(infoState: InfoState) {
    const atual = infoState.estoque_atual ?? 0;
    const minimo = infoState.estoque_minimo ?? 0;
    const diff = atual - minimo;

    if (infoState.abaixo_minimo) {
      return "border-red-500/60 bg-red-500/5";
    }
    if (minimo > 0 && diff <= 3) {
      return "border-amber-500/60 bg-amber-500/5";
    }
    return "border-emerald-500/60 bg-emerald-500/5";
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex items-center justify-between gap-2">
          <CardTitle>Gestão de Estoque</CardTitle>
          <Button type="button" onClick={abrirModalMovimentacao}>
            Registrar movimentação
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {erro && (
            <Alert variant="destructive">
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          {info && (
            <Alert
              variant={info.abaixo_minimo ? "destructive" : "default"}
              className={`border ${getInfoAlertClasses(info)}`}
            >
              <AlertTitle>{info.mensagem}</AlertTitle>
              <AlertDescription className="space-y-1">
                <p>
                  <strong>Produto:</strong> {info.produto}
                </p>
                <p>
                  <strong>Tipo:</strong> {info.tipo}
                </p>
                <p>
                  <strong>Quantidade movimentada:</strong> {info.quantidade}
                </p>
                {info.estoque_atual !== null && (
                  <p>
                    <strong>Estoque atual:</strong> {info.estoque_atual}
                  </p>
                )}
                {info.estoque_minimo !== null && (
                  <p>
                    <strong>Estoque mínimo:</strong> {info.estoque_minimo}
                  </p>
                )}
                {info.abaixo_minimo && (
                  <p className="text-red-600 font-semibold mt-1">
                    ⚠ Estoque abaixo do mínimo! Repor o quanto antes.
                  </p>
                )}
                {!info.abaixo_minimo &&
                  info.estoque_atual !== null &&
                  info.estoque_minimo !== null &&
                  info.estoque_atual - info.estoque_minimo <= 3 && (
                    <p className="text-amber-600 font-semibold mt-1">
                      ⚠ Estoque baixo! Atingindo o limite mínimo.
                    </p>
                  )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
            <h2 className="text-lg font-semibold">
              Produtos cadastrados (ordem alfabética)
            </h2>
            <div className="flex gap-2 w-full md:w-auto">
              <Input
                placeholder="Buscar por nome ou SKU..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setBusca("")}
              >
                Limpar
              </Button>
            </div>
          </div>

          {loading && <p>Carregando produtos...</p>}

          {!loading && produtosFiltrados.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum produto encontrado.
            </p>
          )}

          {!loading && produtosFiltrados.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-md overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-3 py-2 border-b">ID</th>
                    <th className="text-left px-3 py-2 border-b">Nome</th>
                    <th className="text-left px-3 py-2 border-b">SKU</th>
                    <th className="text-left px-3 py-2 border-b">
                      Estoque atual
                    </th>
                    <th className="text-left px-3 py-2 border-b">
                      Estoque mínimo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.map((p) => (
                    <tr
                      key={p.id}
                      className={
                        "border-b last:border-b-0 " +
                        (produtoSelecionadoId === p.id
                          ? "bg-primary/10"
                          : "hover:bg-muted/60 cursor-pointer")
                      }
                      onClick={() =>
                        form.setValue("produtoId", p.id, {
                          shouldValidate: true,
                        })
                      }
                    >
                      <td className="px-3 py-2">{p.id}</td>
                      <td className="px-3 py-2">{p.nome}</td>
                      <td className="px-3 py-2">{p.sku}</td>
                      <td className="px-3 py-2">{p.estoque_atual}</td>
                      <td className="px-3 py-2">{p.estoque_minimo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={movDialogOpen}
        onOpenChange={(open) =>
          open ? setMovDialogOpen(true) : fecharModalMovimentacao()
        }
      >
        <DialogContent className="sm:max-w-lg backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Registrar movimentação</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <FormField
                control={form.control}
                name="produtoId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Produto</FormLabel>
                    <FormControl>
                      <select
                        className="border border-input rounded-md px-3 py-2 text-sm bg-background w-full"
                        value={field.value ?? 0}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "0"
                              ? 0
                              : Number(e.target.value)
                          )
                        }
                      >
                        <option value={0}>Selecione um produto</option>
                        {produtos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome} — SKU: {p.sku}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estoqueId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local de estoque</FormLabel>
                    <FormControl>
                      <select
                        className="border border-input rounded-md px-3 py-2 text-sm bg-background w-full"
                        value={field.value ?? 0}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "0"
                              ? 0
                              : Number(e.target.value)
                          )
                        }
                      >
                        <option value={0}>Selecione um estoque</option>
                        {estoques.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.setor} - {e.descricao}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de movimentação</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={field.value === "E" ? "default" : "outline"}
                          onClick={() => field.onChange("E")}
                        >
                          Entrada
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === "S" ? "default" : "outline"}
                          onClick={() => field.onChange("S")}
                        >
                          Saída
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_movimentacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da movimentação</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="md:col-span-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={fecharModalMovimentacao}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Registrar {tipoSelecionado === "E" ? "entrada" : "saída"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
