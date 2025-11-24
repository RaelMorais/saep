"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ----------------------
// Schema de validação
// ----------------------
const schema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  descricao: z.string().min(1, "Descrição obrigatória"),
  sku: z.string().min(1, "SKU obrigatório"),

  quantidade: z.coerce.number().min(1, "Quantidade obrigatória"),

  categoriaExistente: z.string().optional(),
  novaCategoria: z.string().optional(),

  estoqueExistente: z.string().optional(),
  novoEstoque: z.string().optional(),
});

type ProductFormValues = z.infer<typeof schema>;

// ----------------------
// Tipos auxiliares
// ----------------------
interface Categoria {
  id: number;
  nome: string;
  descricao: string;
}

interface Estoque {
  id: number;
  descricao: string;
  setor: string;
}

// ----------------------
// Página de novo produto
// ----------------------
export default function NewProductPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [estoques, setEstoques] = useState<Estoque[]>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      descricao: "",
      sku: "",
      quantidade: 1,
      categoriaExistente: "",
      novaCategoria: "",
      estoqueExistente: "",
      novoEstoque: "",
    },
  });

  // Carregar categorias e estoques existentes
  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("access");

        const [catsRes, estRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/v1/categorias/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://127.0.0.1:8000/api/v1/estoques/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (catsRes.ok) {
          const categoriasJson = await catsRes.json();
          setCategorias(categoriasJson);
        }

        if (estRes.ok) {
          const estoquesJson = await estRes.json();
          setEstoques(estoquesJson);
        }
      } catch (error) {
        console.error("Erro ao carregar categorias/estoques:", error);
      }
    }

    fetchData();
  }, []);

  const onSubmit: SubmitHandler<ProductFormValues> = async (values) => {
    setServerError(null);
    setSuccess(false);

    const token = localStorage.getItem("access");

    if (!token) {
      setServerError("Usuário não autenticado. Faça login novamente.");
      return;
    }

    try {
      // 1️⃣ Resolver categoria (existente ou nova)
      let categoriaId: number | null = null;

      if (values.categoriaExistente) {
        categoriaId = Number(values.categoriaExistente);
      } else if (values.novaCategoria && values.novaCategoria.trim() !== "") {
        const catRes = await fetch("http://127.0.0.1:8000/api/v1/categorias/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nome: values.novaCategoria,
            descricao: values.novaCategoria,
          }),
        });

        if (!catRes.ok) {
          const err = await catRes.json().catch(() => null);
          throw new Error(err?.detail || "Erro ao criar categoria");
        }

        const categoriaCriada = await catRes.json();
        categoriaId = categoriaCriada.id;
      } else {
        throw new Error("Selecione ou cadastre uma categoria.");
      }

      // 2️⃣ Resolver estoque (existente ou novo)
      let estoqueId: number | null = null;

      if (values.estoqueExistente) {
        estoqueId = Number(values.estoqueExistente);
      } else if (values.novoEstoque && values.novoEstoque.trim() !== "") {
        const estRes = await fetch("http://127.0.0.1:8000/api/v1/estoques/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            descricao: values.novoEstoque,
            setor: "Padrão",
          }),
        });

        if (!estRes.ok) {
          const err = await estRes.json().catch(() => null);
          throw new Error(err?.detail || "Erro ao criar estoque");
        }

        const estoqueCriado = await estRes.json();
        estoqueId = estoqueCriado.id;
      } else {
        throw new Error("Selecione ou cadastre um estoque.");
      }

      // 3️⃣ Criar o produto
      const produtoRes = await fetch("http://127.0.0.1:8000/api/v1/produtos/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: values.nome,
          descricao: values.descricao,
          sku: values.sku,
          // id_usuario vem do request.user no backend
        }),
      });

      if (!produtoRes.ok) {
        const error = await produtoRes.json().catch(() => null);
        throw new Error(error?.detail || "Erro ao salvar produto");
      }

      const produto = await produtoRes.json();

      // 4️⃣ Criar movimentação inicial de ENTRADA no estoque
      const movRes = await fetch("http://127.0.0.1:8000/api/v1/movimentacoes/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_produto: produto.id,
          id_estoque: estoqueId,
          id_cliente: null,
          quantidade: values.quantidade,
          tipo: "E", // Entrada
        }),
      });

      if (!movRes.ok) {
        const error = await movRes.json().catch(() => null);
        throw new Error(
          error?.detail || "Erro ao registrar movimentação inicial",
        );
      }

      setSuccess(true);
      form.reset();

      setTimeout(() => {
        router.push("/products");
      }, 1200);
    } catch (err: any) {
      setServerError(err.message ?? "Erro inesperado.");
    }
  };

  return (
    <section className="flex flex-col items-center pt-20">
      <h1 className="text-4xl font-bold text-center mb-6">
        Cadastro de Produto
      </h1>

      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Adicionar Produto</CardTitle>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Nome */}
              <FormField
                name="nome"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Descrição */}
              <FormField
                name="descricao"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição do produto"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SKU */}
              <FormField
                name="sku"
                control={form.control}
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

              {/* Quantidade inicial */}
              <FormField
                name="quantidade"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade inicial</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Categoria existente */}
              <FormField
                name="categoriaExistente"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria (existente)</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="border rounded p-2 w-full bg-background"
                      >
                        <option value="">Selecione uma categoria</option>
                        {categorias.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nome}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nova categoria */}
              <FormField
                name="novaCategoria"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ou cadastrar nova categoria</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome da nova categoria"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estoque existente */}
              <FormField
                name="estoqueExistente"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque (existente)</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="border rounded p-2 w-full bg-background"
                      >
                        <option value="">Selecione um estoque</option>
                        {estoques.map((est) => (
                          <option key={est.id} value={est.id}>
                            {est.descricao} ({est.setor})
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Novo estoque */}
              <FormField
                name="novoEstoque"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ou cadastrar novo estoque</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Descrição do novo estoque"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serverError && (
                <p className="text-red-600 text-sm">{serverError}</p>
              )}

              {success && (
                <p className="text-green-600 text-sm">
                  Produto cadastrado com sucesso!
                </p>
              )}

              <Button type="submit" className="w-full">
                Salvar Produto
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}
