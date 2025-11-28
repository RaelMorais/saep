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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

type Cliente = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
};

const clienteSchema = z.object({
  nome: z.string().min(1, { message: "ss" }),
  email: z.string().email({ message: "ss" }),
  telefone: z.string().min(1, { message: "ss" }),
});

type ClienteFormValues = z.infer<typeof clienteSchema>;

export default function CadastroClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [clienteEmEdicao, setClienteEmEdicao] = useState<Cliente | null>(null);

  const formCreate = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema) as any,
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
    },
  });

  const formEdit = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema) as any,
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
    },
  });

  async function carregarClientes() {
    try {
      setLoading(true);
      setErro(null);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;

      const res = await fetch(`${API_BASE_URL}/clientes/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();

      if (!res.ok) {
        setErro("Falha ao carregar clientes.");
        return;
      }

      const data: Cliente[] = Array.isArray(json) ? json : json.results ?? [];
      setClientes(data);
    } catch {
      setErro("Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  const clientesFiltrados = useMemo(() => {
    const termo = busca.toLowerCase();
    return clientes.filter((c) =>
      [c.nome, c.email, c.telefone].join(" ").toLowerCase().includes(termo)
    );
  }, [clientes, busca]);

  // ---------- CRIAÇÃO (MODAL) ----------

  function abrirModalCreate() {
    setErro(null);
    setInfo(null);
    formCreate.reset({
      nome: "",
      email: "",
      telefone: "",
    });
    setCreateOpen(true);
  }

  function fecharModalCreate() {
    setCreateOpen(false);
    formCreate.reset({
      nome: "",
      email: "",
      telefone: "",
    });
  }

  async function onSubmitCreate(values: ClienteFormValues) {
    try {
      setErro(null);
      setInfo(null);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;
      if (!token) {
        setErro("Usuário não autenticado.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/clientes/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErro(data?.detail ?? "Erro ao salvar cliente.");
        return;
      }

      await carregarClientes();
      setInfo("Cliente cadastrado com sucesso.");
      fecharModalCreate();
    } catch {
      setErro("Erro ao salvar cliente.");
    }
  }

  // ---------- EDIÇÃO (MODAL) ----------

  function abrirModalEdicao(cliente: Cliente) {
    setClienteEmEdicao(cliente);
    formEdit.reset({
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
    });
    setEditOpen(true);
  }

  function fecharModalEdicao() {
    setEditOpen(false);
    setClienteEmEdicao(null);
  }

  async function onSubmitEdit(values: ClienteFormValues) {
    if (!clienteEmEdicao) return;

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
        `${API_BASE_URL}/clientes/${clienteEmEdicao.id}/`,
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
        setErro(data?.detail ?? "Erro ao atualizar cliente.");
        return;
      }

      await carregarClientes();
      setInfo("Cliente atualizado com sucesso.");
      fecharModalEdicao();
    } catch {
      setErro("Erro ao atualizar cliente.");
    }
  }

  // ---------- EXCLUSÃO ----------

  async function excluirCliente(id: number) {
    try {
      setErro(null);
      setInfo(null);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;
      if (!token) {
        setErro("Usuário não autenticado.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/clientes/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErro(data?.detail ?? "Erro ao excluir cliente.");
        return;
      }

      await carregarClientes();
      setInfo("Cliente excluído com sucesso.");

      if (clienteEmEdicao && clienteEmEdicao.id === id) {
        fecharModalEdicao();
      }
    } catch {
      setErro("Erro ao excluir cliente.");
    }
  }

  // ---------- JSX ----------

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Clientes</CardTitle>
          </div>
          <Button type="button" onClick={abrirModalCreate}>
            Cadastrar cliente
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
            <Alert>
              <AlertTitle>Informação</AlertTitle>
              <AlertDescription>{info}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              Total: {clientesFiltrados.length}
            </p>
            <div className="flex gap-2 w-full md:w-auto">
              <Input
                placeholder="Buscar por nome, e-mail ou telefone..."
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

          {loading && <p>Carregando clientes...</p>}

          {!loading && clientesFiltrados.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum cliente encontrado.
            </p>
          )}

          {!loading && clientesFiltrados.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left border-b">ID</th>
                    <th className="px-3 py-2 text-left border-b">Nome</th>
                    <th className="px-3 py-2 text-left border-b">E-mail</th>
                    <th className="px-3 py-2 text-left border-b">Telefone</th>
                    <th className="px-3 py-2 text-right border-b">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((c) => (
                    <tr key={c.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2">{c.id}</td>
                      <td className="px-3 py-2">{c.nome}</td>
                      <td className="px-3 py-2">{c.email}</td>
                      <td className="px-3 py-2">{c.telefone}</td>
                      <td className="px-3 py-2 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => abrirModalEdicao(c)}
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL DE CRIAÇÃO */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            formCreate.reset({
              nome: "",
              email: "",
              telefone: "",
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cadastrar cliente</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar um novo cliente.
            </DialogDescription>
          </DialogHeader>

          <Form {...formCreate}>
            <form
              onSubmit={formCreate.handleSubmit(onSubmitCreate)}
              className="space-y-4"
            >
              <FormField
                control={formCreate.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formCreate.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formCreate.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={fecharModalCreate}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar cliente</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EDIÇÃO */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
            <DialogDescription>
              Altere os dados do cliente selecionado e salve as alterações.
            </DialogDescription>
          </DialogHeader>

          <Form {...formEdit}>
            <form
              onSubmit={formEdit.handleSubmit(onSubmitEdit)}
              className="space-y-4"
            >
              <FormField
                control={formEdit.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formEdit.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formEdit.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={fecharModalEdicao}
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
