"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

type Log = {
  id: number;
  createdAt: string;
  updateAt: string;
  is_activate: boolean;
};

export default function ListaLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarSomenteAtivos, setMostrarSomenteAtivos] = useState(false);

  async function carregarLogs() {
    try {
      setLoading(true);
      setErro(null);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;

      const res = await fetch(`${API_BASE_URL}/logs/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setErro(json?.detail ?? "Falha ao carregar logs.");
        return;
      }

      const data: Log[] = Array.isArray(json) ? json : json.results ?? [];
      setLogs(data);
    } catch {
      setErro("Erro ao carregar logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarLogs();
  }, []);

  const logsFiltrados = useMemo(
    () =>
      mostrarSomenteAtivos ? logs.filter((l) => l.is_activate) : logs,
    [logs, mostrarSomenteAtivos]
  );

  function formatarData(valor: string) {
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return valor;
    return d.toLocaleString("pt-BR");
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle>Logs do Sistema</CardTitle>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="ativos-switch"
                checked={mostrarSomenteAtivos}
                onCheckedChange={(v) => setMostrarSomenteAtivos(v)}
              />
              <Label htmlFor="ativos-switch" className="text-sm">
                Mostrar apenas ativos
              </Label>
            </div>

            <Button type="button" onClick={carregarLogs}>
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

          <p className="text-sm text-muted-foreground">
            Total de logs listados: {logsFiltrados.length}
          </p>

          {loading && <p>Carregando logs...</p>}

          {!loading && logsFiltrados.length === 0 && !erro && (
            <p className="text-sm text-muted-foreground">
              Nenhum log encontrado.
            </p>
          )}

          {!loading && logsFiltrados.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-md overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left border-b">ID</th>
                    <th className="px-3 py-2 text-left border-b">Criado em</th>
                    <th className="px-3 py-2 text-left border-b">
                      Atualizado em
                    </th>
                    <th className="px-3 py-2 text-left border-b">Ativo</th>
                  </tr>
                </thead>
                <tbody>
                  {logsFiltrados.map((log) => (
                    <tr key={log.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2">{log.id}</td>
                      <td className="px-3 py-2">
                        {formatarData(log.createdAt)}
                      </td>
                      <td className="px-3 py-2">
                        {formatarData(log.updateAt)}
                      </td>
                      <td className="px-3 py-2">
                        {log.is_activate ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-xs font-medium">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-destructive/10 text-destructive px-2 py-0.5 text-xs font-medium">
                            Inativo
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
