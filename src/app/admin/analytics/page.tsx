"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { LineChart } from "@/components/admin/LineChart";
import { Skeleton } from "@/components/skeleton/Skeleton";
import type { AdminAnalyticsData } from "@/lib/admin-analytics";
import { TIMEZONE } from "@/lib/timezone";

function formatChartDate(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
  }).format(d);
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border-base bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-52 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/analytics")
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) {
          throw new Error(body.error ?? "Erro ao carregar métricas");
        }
        setData(body as AdminAnalyticsData);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin — Métricas</h1>
          <p className="mt-1 text-sm text-muted">
            Saúde do produto nos últimos 30 dias (fuso {TIMEZONE}).
          </p>
        </div>
        <AdminNav />
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-xl bg-red-600/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-400">{error}</p>
          <button
            type="button"
            onClick={load}
            className="rounded-lg bg-surface-2 px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-surface"
          >
            Tentar outra vez
          </button>
        </div>
      )}

      {loading && <AnalyticsSkeleton />}

      {!loading && data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard label="Total utilizadores" value={data.kpis.total_users} />
            <KpiCard label="Utilizadores activos" value={data.kpis.activated_users} />
            <KpiCard label="Sessões hoje" value={data.kpis.sessions_today} />
            <KpiCard label="Page views hoje" value={data.kpis.page_views_today} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="Registos por dia">
              <LineChart
                label="Registos por dia"
                formatDate={formatChartDate}
                data={data.charts.map((p) => ({
                  date: p.date,
                  value: p.registrations,
                }))}
              />
            </ChartCard>
            <ChartCard title="Sessões por dia">
              <LineChart
                label="Sessões por dia"
                formatDate={formatChartDate}
                data={data.charts.map((p) => ({
                  date: p.date,
                  value: p.sessions,
                }))}
              />
            </ChartCard>
            <ChartCard title="Page views por dia">
              <LineChart
                label="Page views por dia"
                formatDate={formatChartDate}
                data={data.charts.map((p) => ({
                  date: p.date,
                  value: p.page_views,
                }))}
              />
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TableCard title="Top 20 páginas">
              {data.top_pages.length === 0 ? (
                <EmptyTable message="Ainda sem visitas registadas." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-base text-left text-xs uppercase tracking-wider text-muted">
                        <th className="pb-2 pr-4 font-semibold">Página</th>
                        <th className="pb-2 text-right font-semibold">Visitas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_pages.map((row) => (
                        <tr
                          key={row.page}
                          className="border-b border-border-base/60 last:border-0"
                        >
                          <td className="py-2 pr-4 font-mono text-xs text-foreground">
                            {row.page}
                          </td>
                          <td className="py-2 text-right tabular-nums text-foreground">
                            {row.visits}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TableCard>

            <TableCard title="Últimos utilizadores">
              {data.latest_users.length === 0 ? (
                <EmptyTable message="Sem utilizadores registados." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-base text-left text-xs uppercase tracking-wider text-muted">
                        <th className="pb-2 pr-3 font-semibold">Nome</th>
                        <th className="pb-2 pr-3 font-semibold">Email</th>
                        <th className="pb-2 font-semibold">Registo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.latest_users.map((user, i) => (
                        <tr
                          key={`${user.email ?? "user"}-${i}`}
                          className="border-b border-border-base/60 last:border-0"
                        >
                          <td className="py-2 pr-3 text-foreground">
                            {user.display_name ?? "—"}
                          </td>
                          <td className="max-w-[140px] truncate py-2 pr-3 text-muted sm:max-w-none">
                            {user.email ?? "—"}
                          </td>
                          <td className="whitespace-nowrap py-2 text-xs text-muted">
                            {formatDateTime(user.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TableCard>
          </div>
        </>
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border-base bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  );
}

function TableCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border-base bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  );
}

function EmptyTable({ message }: { message: string }) {
  return <p className="py-6 text-center text-sm text-muted">{message}</p>;
}
