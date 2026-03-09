import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Users, Clock, MousePointer, Activity, TrendingUp,
  LogIn, ChevronDown, ChevronUp, BarChart2, Eye, Zap,
} from "lucide-react";

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  return (
    <div className="rounded-xl p-4 flex items-center gap-4 shadow-sm"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: color + '18' }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-medium" style={{ color: '#6B7280' }}>{label}</p>
        <p className="text-2xl font-bold" style={{ color: '#111827' }}>{value}</p>
      </div>
    </div>
  );
}

function ActionBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    atendimento_gravado: { label: "Atendimento", color: "#1D4ED8", bg: "#EFF6FF" },
    checklist_item_completed: { label: "Checklist ✓", color: "#059669", bg: "#ECFDF5" },
    checklist_item_uncompleted: { label: "Checklist ✗", color: "#D97706", bg: "#FFFBEB" },
    login: { label: "Login", color: "#7C3AED", bg: "#F5F3FF" },
    logout: { label: "Logout", color: "#6B7280", bg: "#F9FAFB" },
  };
  const style = map[type] ?? { label: type, color: "#374151", bg: "#F3F4F6" };
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: style.bg, color: style.color }}>
      {style.label}
    </span>
  );
}

function PageName({ page }: { page: string }) {
  const names: Record<string, string> = {
    dashboard: "Dashboard", marcos: "Marcos", ongoing: "Ongoing",
    churns: "CHURNs", migracao: "Migração", redflags: "Red Flags",
    ferramentas: "Ferramentas", configuracoes: "Configurações",
    estatisticas: "Estatísticas", painel: "Painel",
  };
  return <>{names[page] ?? page}</>;
}

export default function Estatisticas() {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const { data: overview, isLoading: loadingOverview } = trpc.stats.overview.useQuery();
  const { data: userList, isLoading: loadingUsers } = trpc.stats.userList.useQuery();
  const { data: recentSessions, isLoading: loadingSessions } = trpc.stats.recentSessions.useQuery();
  const { data: recentActions, isLoading: loadingActions } = trpc.stats.recentActions.useQuery();
  const { data: topPages, isLoading: loadingPages } = trpc.stats.topPages.useQuery();

  const isLoading = loadingOverview || loadingUsers || loadingSessions || loadingActions || loadingPages;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Estatísticas de Uso</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Monitoramento de acesso e atividade dos usuários do sistema</p>
      </div>

      {/* Cards de visão geral */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={LogIn} label="Total de Sessões" value={overview?.totalSessions ?? 0} color="#1D4ED8" />
        <StatCard icon={Users} label="Usuários Ativos (30d)" value={overview?.activeUsersLast30Days ?? 0} color="#059669" />
        <StatCard icon={Zap} label="Ações Realizadas" value={overview?.totalActions ?? 0} color="#7C3AED" />
        <StatCard icon={Eye} label="Visualizações de Página" value={overview?.totalPageViews ?? 0} color="#D97706" />
      </div>

      {/* Páginas mais visitadas */}
      {topPages && topPages.length > 0 && (
        <div className="rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #F3F4F6' }}>
            <BarChart2 className="w-5 h-5" style={{ color: '#1D4ED8' }} />
            <h2 className="text-base font-semibold" style={{ color: '#111827' }}>Páginas Mais Visitadas</h2>
          </div>
          <div className="p-5">
            <div className="space-y-2">
              {topPages.map((p, i) => {
                const maxCount = topPages[0]?.count ?? 1;
                const pct = Math.round((p.count / maxCount) * 100);
                return (
                  <div key={p.page} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-5 text-right shrink-0" style={{ color: '#9CA3AF' }}>{i + 1}</span>
                    <span className="text-sm font-medium w-28 shrink-0" style={{ color: '#374151' }}>
                      <PageName page={p.page} />
                    </span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#1D4ED8' }} />
                    </div>
                    <span className="text-xs font-semibold w-10 text-right shrink-0" style={{ color: '#374151' }}>{p.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Usuários */}
      <div className="rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #F3F4F6' }}>
          <Users className="w-5 h-5" style={{ color: '#1D4ED8' }} />
          <h2 className="text-base font-semibold" style={{ color: '#111827' }}>Usuários</h2>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
            {userList?.length ?? 0} usuário{(userList?.length ?? 0) !== 1 ? 's' : ''}
          </span>
        </div>

        {!userList || userList.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: '#9CA3AF' }}>
            Nenhum dado de usuário registrado ainda.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
            {userList.map((u) => {
              const isExpanded = expandedUser === u.email;
              return (
                <div key={u.email}>
                  <button
                    onClick={() => setExpandedUser(isExpanded ? null : u.email)}
                    className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
                      style={{ backgroundColor: '#1D4ED8' }}>
                      {(u.name ?? u.email).charAt(0).toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#111827' }}>
                        {u.name ?? u.email}
                      </p>
                      <p className="text-xs truncate" style={{ color: '#6B7280' }}>{u.email}</p>
                    </div>
                    {/* Stats inline */}
                    <div className="hidden md:flex items-center gap-6 shrink-0">
                      <div className="text-center">
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>Sessões</p>
                        <p className="text-sm font-bold" style={{ color: '#111827' }}>{u.totalSessions}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>Tempo total</p>
                        <p className="text-sm font-bold" style={{ color: '#111827' }}>{formatDuration(u.totalDurationSeconds)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>Ações</p>
                        <p className="text-sm font-bold" style={{ color: '#111827' }}>{u.totalActions}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>Páginas</p>
                        <p className="text-sm font-bold" style={{ color: '#111827' }}>{u.totalPageViews}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>Último acesso</p>
                        <p className="text-xs font-medium" style={{ color: '#374151' }}>{formatDate(u.lastLogin)}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 shrink-0" style={{ color: '#9CA3AF' }} />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0" style={{ color: '#9CA3AF' }} />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4"
                      style={{ backgroundColor: '#F9FAFB' }}>
                      {/* Páginas visitadas */}
                      <div className="rounded-lg p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                        <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#374151' }}>
                          <MousePointer className="w-3.5 h-3.5" /> Páginas visitadas
                        </h3>
                        {Object.keys(u.pageBreakdown).length === 0 ? (
                          <p className="text-xs" style={{ color: '#9CA3AF' }}>Nenhuma página registrada</p>
                        ) : (
                          <div className="space-y-1.5">
                            {Object.entries(u.pageBreakdown)
                              .sort(([, a], [, b]) => b - a)
                              .map(([page, count]) => (
                                <div key={page} className="flex justify-between items-center">
                                  <span className="text-xs" style={{ color: '#374151' }}><PageName page={page} /></span>
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>{count}x</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Ações realizadas */}
                      <div className="rounded-lg p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                        <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#374151' }}>
                          <Activity className="w-3.5 h-3.5" /> Ações realizadas
                        </h3>
                        {Object.keys(u.actionBreakdown).length === 0 ? (
                          <p className="text-xs" style={{ color: '#9CA3AF' }}>Nenhuma ação registrada</p>
                        ) : (
                          <div className="space-y-1.5">
                            {Object.entries(u.actionBreakdown)
                              .sort(([, a], [, b]) => b - a)
                              .map(([type, count]) => (
                                <div key={type} className="flex justify-between items-center">
                                  <ActionBadge type={type} />
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: '#F3F4F6', color: '#374151' }}>{count}x</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Stats mobile */}
                      <div className="md:hidden rounded-lg p-4 grid grid-cols-2 gap-3"
                        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                        {[
                          { label: "Sessões", value: u.totalSessions },
                          { label: "Tempo total", value: formatDuration(u.totalDurationSeconds) },
                          { label: "Ações", value: u.totalActions },
                          { label: "Último acesso", value: formatDate(u.lastLogin) },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-xs" style={{ color: '#9CA3AF' }}>{label}</p>
                            <p className="text-sm font-semibold" style={{ color: '#111827' }}>{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sessões recentes */}
      <div className="rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #F3F4F6' }}>
          <Clock className="w-5 h-5" style={{ color: '#1D4ED8' }} />
          <h2 className="text-base font-semibold" style={{ color: '#111827' }}>Sessões Recentes</h2>
          <span className="ml-auto text-xs" style={{ color: '#9CA3AF' }}>Últimas 50</span>
        </div>
        {!recentSessions || recentSessions.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: '#9CA3AF' }}>Nenhuma sessão registrada ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  {["Usuário", "Login", "Logout", "Duração", "IP"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#F3F4F6' }}>
                {recentSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-xs" style={{ color: '#111827' }}>{s.userName ?? s.userEmail}</p>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>{s.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#374151' }}>{formatDate(s.loginAt)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#374151' }}>
                      {s.logoutAt ? formatDate(s.logoutAt) : <span style={{ color: '#059669' }}>● Ativo</span>}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium" style={{ color: '#374151' }}>
                      {formatDuration(s.durationSeconds)}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{s.ipAddress ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ações recentes */}
      <div className="rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #F3F4F6' }}>
          <TrendingUp className="w-5 h-5" style={{ color: '#1D4ED8' }} />
          <h2 className="text-base font-semibold" style={{ color: '#111827' }}>Ações Recentes</h2>
          <span className="ml-auto text-xs" style={{ color: '#9CA3AF' }}>Últimas 100</span>
        </div>
        {!recentActions || recentActions.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: '#9CA3AF' }}>Nenhuma ação registrada ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  {["Usuário", "Ação", "Descrição", "Data/Hora"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#F3F4F6' }}>
                {recentActions.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs font-medium" style={{ color: '#374151' }}>{a.userEmail}</td>
                    <td className="px-4 py-3"><ActionBadge type={a.actionType} /></td>
                    <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: '#6B7280' }}>{a.description ?? "—"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{formatDate(a.performedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
