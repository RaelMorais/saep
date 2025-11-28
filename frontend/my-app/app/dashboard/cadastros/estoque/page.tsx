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

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

type Estoque = {
  id: number;
  descricao: string;
  setor: string;
};

const estoqueSchema = z.object({
  setor: z.string().min(1, { message: "ss" }),
  descricao: z.string().min(1, { message: "ss" }),
});

type EstoqueFormValues = z.infer<typeof estoqueSchema>;

export default function CadastroLocaisEstoquePage() {
  const [estoques, setEstoques] = useState<Estoque[]>([]);
  const [buscaEstoque, setBuscaEstoque] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loadingEstoques, setLoadingEstoques] = useState(true);

  const [estoqueCreateDialogOpen, setEstoqueCreateDialogOpen] =
    useState(false);
  const [estoqueEditDialogOpen, setEstoqueEditDialogOpen] =
    useState(false);

  const [estoqueToEdit, setEstoqueToEdit] = useState<Estoque | null>(null);
  const [estoqueToDelete, setEstoqueToDelete] = useState<Estoque | null>(null);

  const estoqueForm = useForm<EstoqueFormValues>({
    resolver: zodResolver(estoqueSchema) as any,
    defaultValues: {
      setor: "",
      descricao: "",
    },
  });

  const estoqueEditForm = useForm<EstoqueFormValues>({
    resolver: zodResolver(estoqueSchema) as any,
    defaultValues: {
      setor: "",
      descricao: "",
    },
  });

  async function carregarEstoques() {
    try {
      setLoadingEstoques(true);
      setErro(null);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;

      const res = await fetch(`${API_BASE_URL}/estoques/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();

      if (!res.ok) {
        setErro("Falha ao carregar estoques.");
        return;
      }

      const data: Estoque[] = Array.isArray(json) ? json : json.results ?? [];

      setEstoques(data);
    } catch {
      setErro("Erro ao carregar estoques.");
    } finally {
      setLoadingEstoques(false);
    }
  }

  useEffect(() => {
    carregarEstoques();
  }, []);

  const estoquesFiltrados = useMemo(() => {
    const termo = buscaEstoque.toLowerCase();
    return estoques.filter((e) =>
      [e.setor, e.descricao].join(" ").toLowerCase().includes(termo)
    );
  }, [estoques, buscaEstoque]);

  function abrirModalCreateEstoque() {
    setErro(null);
    setInfo(null);
    estoqueForm.reset({
      setor: "",
      descricao: "",
    });
    setEstoqueCreateDialogOpen(true);
  }

  function fecharModalCreateEstoque() {
    setEstoqueCreateDialogOpen(false);
    estoqueForm.reset({
      setor: "",
      descricao: "",
    });
  }

  function abrirModalEditarEstoque(estoque: Estoque) {
    setEstoqueToEdit(estoque);
    estoqueEditForm.reset({
      setor: estoque.setor,
      descricao: estoque.descricao,
    });
    setEstoqueEditDialogOpen(true);
  }

  function fecharModalEditarEstoque() {
    setEstoqueEditDialogOpen(false);
    setEstoqueToEdit(null);
  }

  async function onSubmitEstoque(values: EstoqueFormValues) {
    try {
      setErro(null);
      setInfo(null);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;
      if (!token) {
        setErro("Usuário não autenticado.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/estoques/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErro(data?.detail ?? "Erro ao salvar estoque.");
        return;
      }

      await carregarEstoques();
      setInfo("Local de estoque cadastrado com sucesso.");
      fecharModalCreateEstoque();
    } catch {
      setErro("Erro ao salvar estoque.");
    }
  }

  async function onSubmitEditarEstoque(values: EstoqueFormValues) {
    if (!estoqueToEdit) return;

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
        `${API_BASE_URL}/estoques/${estoqueToEdit.id}/`,
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
        setErro(data?.detail ?? "Erro ao atualizar estoque.");
        return;
      }

      await carregarEstoques();
      setInfo("Local de estoque atualizado com sucesso.");
      fecharModalEditarEstoque();
    } catch {
      setErro("Erro ao atualizar estoque.");
    }
  }

  async function excluirEstoque(id: number) {
    try {
      setErro(null);
      setInfo(null);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;
      if (!token) {
        setErro("Usuário não autenticado.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/estoques/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErro(data?.detail ?? "Erro ao excluir estoque.");
        return;
      }

      await carregarEstoques();
      setInfo("Local de estoque excluído com sucesso.");
      setEstoqueToDelete(null);
    } catch {
      setErro("Erro ao excluir estoque.");
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
          <CardTitle>Locais de Estoque</CardTitle>
          <Button type="button" onClick={abrirModalCreateEstoque}>
            Cadastrar local
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                Total de estoques: {estoquesFiltrados.length}
              </p>

              <div className="flex gap-2 w-full md:w-auto">
                <Input
                  placeholder="Buscar por setor ou descrição..."
                  value={buscaEstoque}
                  onChange={(e) => setBuscaEstoque(e.target.value)}
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBuscaEstoque("")}
                >
                  Limpar
                </Button>
              </div>
            </div>

            {loadingEstoques && <p>Carregando estoques...</p>}

            {!loadingEstoques && estoquesFiltrados.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum local de estoque encontrado.
              </p>
            )}

            {!loadingEstoques && estoquesFiltrados.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border rounded-md overflow-hidden">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left border-b">ID</th>
                      <th className="px-3 py-2 text-left border-b">Setor</th>
                      <th className="px-3 py-2 text-left border-b">
                        Descrição
                      </th>
                      <th className="px-3 py-2 text-right border-b">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estoquesFiltrados.map((e) => (
                      <tr key={e.id} className="border-b last:border-b-0 ">
                        <td className="px-3 py-2">{e.id}</td>
                        <td className="px-3 py-2">{e.setor}</td>
                        <td className="px-3 py-2">{e.descricao}</td>
                        <td className="px-3 py-2 text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirModalEditarEstoque(e)}
                          >
                            Editar
                          </Button>

                          <AlertDialog
                            open={estoqueToDelete?.id === e.id}
                            onOpenChange={(open) =>
                              open
                                ? setEstoqueToDelete(e)
                                : setEstoqueToDelete(null)
                            }
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setEstoqueToDelete(e)}
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
                                  Tem certeza que deseja excluir o local "
                                  {e.setor}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => excluirEstoque(e.id)}
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
          </div>
        </CardContent>
      </Card>

      {/* MODAL CRIAR ESTOQUE */}
      <Dialog
        open={estoqueCreateDialogOpen}
        onOpenChange={(open) =>
          open ? setEstoqueCreateDialogOpen(true) : fecharModalCreateEstoque()
        }
      >
        <DialogContent className="sm:max-w-lg backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Cadastrar local de estoque</DialogTitle>
          </DialogHeader>

          <Form {...estoqueForm}>
            <form
              onSubmit={estoqueForm.handleSubmit(onSubmitEstoque)}
              className="space-y-4"
            >
              <FormField
                control={estoqueForm.control}
                name="setor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setor</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Depósito 1, Almoxarifado A..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={estoqueForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Descrição do local de estoque"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={fecharModalCreateEstoque}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar local de estoque</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* MODAL EDITAR ESTOQUE */}
      <Dialog
        open={estoqueEditDialogOpen}
        onOpenChange={(open) =>
          open ? setEstoqueEditDialogOpen(true) : fecharModalEditarEstoque()
        }
      >
        <DialogContent className="sm:max-w-lg backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Editar local de estoque</DialogTitle>
          </DialogHeader>

          <Form {...estoqueEditForm}>
            <form
              onSubmit={estoqueEditForm.handleSubmit(onSubmitEditarEstoque)}
              className="space-y-4"
            >
              <FormField
                control={estoqueEditForm.control}
                name="setor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setor</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={estoqueEditForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={fecharModalEditarEstoque}
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
