"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// -----------------------
// SCHEMA ZOD
// -----------------------
const productSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  descricao: z.string().min(1, "Descrição obrigatória"),
  sku: z.string().min(1, "SKU obrigatório"),

  quantidade: z.coerce
    .number({
      message: "Error"
    })
    .int("Quantidade deve ser um número inteiro")
    .min(1, "Quantidade obrigatória"),

  // apenas novos
  novaCategoria: z.string().optional(),
  novoEstoque: z.string().optional(),
});

// tipo DO FORM vindo do schema
type ProductFormValues = z.infer<typeof productSchema>;

// tipo para lista de produtos
type ProdutoLista = {
  id: number;
  nome: string;
  descricao: string;
  sku: string;
  quantidade: number;
  categoria?: string;
  estoque?: string;
};

export default function CadastroProdutosPage() {
  const [produtos, setProdutos] = useState<ProdutoLista[]>([]);
  const [nextId, setNextId] = useState(1);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      sku: "",
      quantidade: 1,
      novaCategoria: "",
      novoEstoque: "",
    },
  });

  const onSubmit: SubmitHandler<ProductFormValues> = (data) => {
    const novoProduto: ProdutoLista = {
      id: nextId,
      nome: data.nome,
      descricao: data.descricao,
      sku: data.sku,
      quantidade: data.quantidade,
      categoria: data.novaCategoria,
      estoque: data.novoEstoque,
    };

    setProdutos((prev) => [...prev, novoProduto]);
    setNextId((prev) => prev + 1);

    form.reset({
      nome: "",
      descricao: "",
      sku: "",
      quantidade: 1,
      novaCategoria: "",
      novoEstoque: "",
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-10 space-y-10">
      {/* FORM */}
      <Card>
        <CardHeader>
          <CardTitle>Cadastrar produto</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Nome */}
              <FormField
                control={form.control}
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

              {/* Descrição */}
              <FormField
                control={form.control}
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

              {/* SKU */}
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="SKU do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quantidade */}
              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade em estoque</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        // string -> number via z.coerce
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nova categoria */}
              <FormField
                control={form.control}
                name="novaCategoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Eletrônicos, Medicamentos..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Novo estoque */}
              <FormField
                control={form.control}
                name="novoEstoque"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local de estoque</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Depósito 1, Almoxarifado..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Botão */}
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit">Salvar produto</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* CARDS COM PRODUTOS */}
      {produtos.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            Produtos cadastrados ({produtos.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {produtos.map((p) => (
              <Card key={p.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base">{p.nome}</CardTitle>
                  <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>
                </CardHeader>
                <CardContent className="text-sm space-y-2 flex-1">
                  <p className="line-clamp-3 text-muted-foreground">
                    {p.descricao}
                  </p>

                  <div className="text-xs space-y-1 pt-2 border-t mt-2">
                    {p.categoria && (
                      <p>
                        <span className="font-semibold">Categoria:</span>{" "}
                        {p.categoria}
                      </p>
                    )}
                    {p.estoque && (
                      <p>
                        <span className="font-semibold">Estoque:</span>{" "}
                        {p.estoque}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold">Quantidade:</span>{" "}
                      {p.quantidade}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
