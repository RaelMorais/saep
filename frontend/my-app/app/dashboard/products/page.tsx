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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

const produtoSchema = z.object({
  nome: z.string().min(1, { message: "ss" }),
  descricao: z.string().min(1, { message: "ss" }),
  sku: z.string().min(1, { message: "ss" }),
  estoque_minimo: z.coerce
    .number({ message: "ss" })
    .int("Informe um número inteiro")
    .min(0, "Valor mínimo é 0"),
});

type ProdutoFormValues = z.infer<typeof produtoSchema>;

export default function CadastroProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [produtoToEdit, setProdutoToEdit] = useState<Produto | null>(null);
  const [produtoToDelete, setProdutoToDelete] = useState<Produto | null>(null);

  const createForm = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoSchema) as any,
    defaultValues: {
      nome: "",
      descricao: "",
      sku: "",
      estoque_minimo: 0,
    },
  });

  const editForm = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoSchema) as any,
    defaultValues: {
      nome: "",
      descricao: "",
      sku: "",
      estoque_minimo: 0,
    },
  });

  async function carregarProdutos() {
    try {
      setLoading(true);
      setErro(null);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;

      const res = await fetch(`${API_BASE_URL}/produtos/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();

      if (!res.ok) {
        setErro("Falha ao carregar produtos.");
        return;
      }

      const data: Produto[] = Array.isArray(json)
        ? json
        : json.results ?? [];
      setProdutos(data);
    } catch {
      setErro("Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase();
    return produtos.filter((p) =>
      [p.nome, p.descricao, p.sku].join(" ").toLowerCase().includes(termo)
    );
  }, [produtos, busca]);

  function abrirModalCreate() {
    setErro(null);
    setInfo(null);
    createForm.reset({
      nome: "",
      descricao: "",
      sku: "",
      estoque_minimo: 0,
    });
    setCreateDialogOpen(true);
  }

  function fecharModalCreate() {
    setCreateDialogOpen(false);
    createForm.reset({
      nome: "",
      descricao: "",
      sku: "",
      estoque_minimo: 0,
    });
  }

  function abrirModalEditar(produto: Produto) {
    setProdutoToEdit(produto);
    editForm.reset({
      nome: produto.nome,
      descricao: produto.descricao,
      sku: produto.sku,
      estoque_minimo: produto.estoque_minimo,
    });
    setEditDialogOpen(true);
  }

  function fecharModalEditar() {
    setEditDialogOpen(false);
    setProdutoToEdit(null);
  }

  async function onSubmitCreate(values: ProdutoFormValues) {
    try {
      setErro(null);
      setInfo(null);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;
      if (!token) {
        setErro("Usuário não autenticado.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/produtos/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErro(data?.detail ?? "Erro ao salvar produto.");
        return;
      }

      await carregarProdutos();
      setInfo("Produto cadastrado com sucesso.");
      fecharModalCreate();
    } catch {
      setErro("Erro ao salvar produto.");
    }
  }

  async function onSubmitEdit(values: ProdutoFormValues) {
    if (!produtoToEdit) return;

    try {
      setErro(null);
      setInfo(null);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;
      if (!token) {
        setErro("Usuário não autenticado.");
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/produtos/${produtoToEdit.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(values),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErro(data?.detail ?? "Erro ao salvar produto.");
        return;
      }

      await carregarProdutos();
      setInfo("Produto atualizado com sucesso.");
      fecharModalEditar();
    } catch {
      setErro("Erro ao salvar produto.");
    }
  }

  async function excluirProduto(id: number) {
    try {
      setErro(null);
      setInfo(null);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;
      if (!token) {
        setErro("Usuário não autenticado.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/produtos/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErro(data?.detail ?? "Erro ao excluir produto.");
        return;
      }

      await carregarProdutos();
      setInfo("Produto excluído com sucesso.");
      setProdutoToDelete(null);
    } catch {
      setErro("Erro ao excluir produto.");
    }
  }

  return (
    <div className="space-y-8">
      {erro && (
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      {info && (
        <Alert>
          <AlertTitle>Informação</AlertTitle>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex items-center justify-between gap-2">
          <CardTitle>Produtos</CardTitle>
          <Button type="button" onClick={abrirModalCreate}>
            Cadastrar produto
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              Total: {produtosFiltrados.length}
            </p>
            <div className="flex gap-2 w-full md:w-auto">
              <Input
                placeholder="Buscar por nome, descrição ou SKU..."
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
                    <th className="px-3 py-2 text-left border-b">ID</th>
                    <th className="px-3 py-2 text-left border-b">Nome</th>
                    <th className="px-3 py-2 text-left border-b">SKU</th>
                    <th className="px-3 py-2 text-left border-b">
                      Estoque atual
                    </th>
                    <th className="px-3 py-2 text-left border-b">
                      Estoque mínimo
                    </th>
                    <th className="px-3 py-2 text-right border-b">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.map((p) => (
                    <tr key={p.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2">{p.id}</td>
                      <td className="px-3 py-2">{p.nome}</td>
                      <td className="px-3 py-2">{p.sku}</td>
                      <td className="px-3 py-2">{p.estoque_atual}</td>
                      <td className="px-3 py-2">{p.estoque_minimo}</td>
                      <td className="px-3 py-2 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => abrirModalEditar(p)}
                        >
                          Editar
                        </Button>

                        <AlertDialog
                          open={produtoToDelete?.id === p.id}
                          onOpenChange={(open) =>
                            open
                              ? setProdutoToDelete(p)
                              : setProdutoToDelete(null)
                          }
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setProdutoToDelete(p)}
                            >
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="backdrop-blur-sm">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Confirmar exclusão
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o produto "
                                {p.nome}"?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => excluirProduto(p.id)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL CRIAR PRODUTO */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) =>
          open ? setCreateDialogOpen(true) : fecharModalCreate()
        }
      >
        <DialogContent className="sm:max-w-lg backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Cadastrar produto</DialogTitle>
          </DialogHeader>

          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(onSubmitCreate)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <FormField
                control={createForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Descrição do produto"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Código SKU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="estoque_minimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque mínimo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
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

              <DialogFooter className="md:col-span-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={fecharModalCreate}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar produto</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* MODAL EDITAR PRODUTO */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) =>
          open ? setEditDialogOpen(true) : fecharModalEditar()
        }
      >
        <DialogContent className="sm:max-w-lg backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Editar produto</DialogTitle>
          </DialogHeader>

          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onSubmitEdit)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <FormField
                control={editForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Descrição do produto"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Código SKU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="estoque_minimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque mínimo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
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

              <DialogFooter className="md:col-span-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={fecharModalEditar}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar alterações</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
