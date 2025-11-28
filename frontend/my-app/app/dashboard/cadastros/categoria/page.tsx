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

type Categoria = {
  id: number;
  nome: string;
  descricao: string;
};

const categoriaSchema = z.object({
  nome: z.string().min(1, { message: "ss" }),
  descricao: z.string().min(1, { message: "ss" }),
});

type CategoriaFormValues = z.infer<typeof categoriaSchema>;

export default function CadastroCategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [buscaCategoria, setBuscaCategoria] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loadingCategorias, setLoadingCategorias] = useState(true);

  const [categoriaCreateDialogOpen, setCategoriaCreateDialogOpen] =
    useState(false);
  const [categoriaEditDialogOpen, setCategoriaEditDialogOpen] =
    useState(false);

  const [categoriaToEdit, setCategoriaToEdit] = useState<Categoria | null>(null);
  const [categoriaToDelete, setCategoriaToDelete] = useState<Categoria | null>(
    null
  );

  const categoriaForm = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaSchema) as any,
    defaultValues: {
      nome: "",
      descricao: "",
    },
  });

  const categoriaEditForm = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaSchema) as any,
    defaultValues: {
      nome: "",
      descricao: "",
    },
  });

  async function carregarCategorias() {
    try {
      setLoadingCategorias(true);
      setErro(null);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;

      const res = await fetch(`${API_BASE_URL}/categorias/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();

      if (!res.ok) {
        setErro("Falha ao carregar categorias.");
        return;
      }

      const data: Categoria[] = Array.isArray(json)
        ? json
        : json.results ?? [];

      setCategorias(data);
    } catch {
      setErro("Erro ao carregar categorias.");
    } finally {
      setLoadingCategorias(false);
    }
  }

  useEffect(() => {
    carregarCategorias();
  }, []);

  const categoriasFiltradas = useMemo(() => {
    const termo = buscaCategoria.toLowerCase();
    return categorias.filter((c) =>
      [c.nome, c.descricao].join(" ").toLowerCase().includes(termo)
    );
  }, [categorias, buscaCategoria]);

  function abrirModalCreateCategoria() {
    setErro(null);
    setInfo(null);
    categoriaForm.reset({
      nome: "",
      descricao: "",
    });
    setCategoriaCreateDialogOpen(true);
  }

  function fecharModalCreateCategoria() {
    setCategoriaCreateDialogOpen(false);
    categoriaForm.reset({
      nome: "",
      descricao: "",
    });
  }

  function abrirModalEditarCategoria(categoria: Categoria) {
    setCategoriaToEdit(categoria);
    categoriaEditForm.reset({
      nome: categoria.nome,
      descricao: categoria.descricao,
    });
    setCategoriaEditDialogOpen(true);
  }

  function fecharModalEditarCategoria() {
    setCategoriaEditDialogOpen(false);
    setCategoriaToEdit(null);
  }

  async function onSubmitCategoria(values: CategoriaFormValues) {
    try {
      setErro(null);
      setInfo(null);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;
      if (!token) {
        setErro("Usuário não autenticado.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/categorias/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErro(data?.detail ?? "Erro ao salvar categoria.");
        return;
      }

      await carregarCategorias();
      setInfo("Categoria cadastrada com sucesso.");
      fecharModalCreateCategoria();
    } catch {
      setErro("Erro ao salvar categoria.");
    }
  }

  async function onSubmitEditarCategoria(values: CategoriaFormValues) {
    if (!categoriaToEdit) return;

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
        `${API_BASE_URL}/categorias/${categoriaToEdit.id}/`,
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
        setErro(data?.detail ?? "Erro ao atualizar categoria.");
        return;
      }

      await carregarCategorias();
      setInfo("Categoria atualizada com sucesso.");
      fecharModalEditarCategoria();
    } catch {
      setErro("Erro ao atualizar categoria.");
    }
  }

  async function excluirCategoria(id: number) {
    try {
      setErro(null);
      setInfo(null);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;
      if (!token) {
        setErro("Usuário não autenticado.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/categorias/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErro(data?.detail ?? "Erro ao excluir categoria.");
        return;
      }

      await carregarCategorias();
      setInfo("Categoria excluída com sucesso.");
      setCategoriaToDelete(null);
    } catch {
      setErro("Erro ao excluir categoria.");
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
          <CardTitle>Categorias</CardTitle>
          <Button type="button" onClick={abrirModalCreateCategoria}>
            Cadastrar categoria
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                Total de categorias: {categoriasFiltradas.length}
              </p>

              <div className="flex gap-2 w-full md:w-auto">
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={buscaCategoria}
                  onChange={(e) => setBuscaCategoria(e.target.value)}
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBuscaCategoria("")}
                >
                  Limpar
                </Button>
              </div>
            </div>

            {loadingCategorias && <p>Carregando categorias...</p>}

            {!loadingCategorias && categoriasFiltradas.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma categoria encontrada.
              </p>
            )}

            {!loadingCategorias && categoriasFiltradas.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border rounded-md overflow-hidden">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left border-b">ID</th>
                      <th className="px-3 py-2 text-left border-b">Nome</th>
                      <th className="px-3 py-2 text-left border-b">
                        Descrição
                      </th>
                      <th className="px-3 py-2 text-right border-b">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoriasFiltradas.map((c) => (
                      <tr key={c.id} className="border-b last:border-b-0">
                        <td className="px-3 py-2">{c.id}</td>
                        <td className="px-3 py-2">{c.nome}</td>
                        <td className="px-3 py-2">{c.descricao}</td>
                        <td className="px-3 py-2 text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirModalEditarCategoria(c)}
                          >
                            Editar
                          </Button>

                          <AlertDialog
                            open={categoriaToDelete?.id === c.id}
                            onOpenChange={(open) =>
                              open
                                ? setCategoriaToDelete(c)
                                : setCategoriaToDelete(null)
                            }
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setCategoriaToDelete(c)}
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
                                  Tem certeza que deseja excluir a categoria "
                                  {c.nome}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => excluirCategoria(c.id)}
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

      {/* MODAL CRIAR CATEGORIA */}
      <Dialog
        open={categoriaCreateDialogOpen}
        onOpenChange={(open) =>
          open ? setCategoriaCreateDialogOpen(true) : fecharModalCreateCategoria()
        }
      >
        <DialogContent className="sm:max-w-lg backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Cadastrar categoria</DialogTitle>
          </DialogHeader>

          <Form {...categoriaForm}>
            <form
              onSubmit={categoriaForm.handleSubmit(onSubmitCategoria)}
              className="space-y-4"
            >
              <FormField
                control={categoriaForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da categoria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={categoriaForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Descrição da categoria"
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
                  onClick={fecharModalCreateCategoria}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar categoria</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* MODAL EDITAR CATEGORIA */}
      <Dialog
        open={categoriaEditDialogOpen}
        onOpenChange={(open) =>
          open ? setCategoriaEditDialogOpen(true) : fecharModalEditarCategoria()
        }
      >
        <DialogContent className="sm:max-w-lg backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Editar categoria</DialogTitle>
          </DialogHeader>

          <Form {...categoriaEditForm}>
            <form
              onSubmit={categoriaEditForm.handleSubmit(onSubmitEditarCategoria)}
              className="space-y-4"
            >
              <FormField
                control={categoriaEditForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={categoriaEditForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={fecharModalEditarCategoria}
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
