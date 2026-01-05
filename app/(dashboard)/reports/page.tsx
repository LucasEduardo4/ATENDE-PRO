'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Stats {
  totalRevenue: number;
  totalAppointments: number;
  newClients: number;
  avgTicket: number;
  completionRate: number;
  cancellationRate: number;
}

interface TopService {
  name: string;
  count: number;
  revenue: number;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalAppointments: 0,
    newClients: 0,
    avgTicket: 0,
    completionRate: 0,
    cancellationRate: 0,
  });
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const supabase = createClient();

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*, services(name)')
      .eq('user_id', user.id)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', now.toISOString());

    // Get new clients
    const { count: newClientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    if (appointments) {
      const completed = appointments.filter(a => a.status === 'completed');
      const cancelled = appointments.filter(a => a.status === 'cancelled');
      const totalRevenue = completed.reduce((sum, a) => sum + (a.price || 0), 0);

      // Group by service
      const serviceStats: Record<string, { count: number; revenue: number }> = {};
      completed.forEach(a => {
        const serviceName = a.services?.name || 'Outros';
        if (!serviceStats[serviceName]) {
          serviceStats[serviceName] = { count: 0, revenue: 0 };
        }
        serviceStats[serviceName].count++;
        serviceStats[serviceName].revenue += a.price || 0;
      });

      const topServicesArray = Object.entries(serviceStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopServices(topServicesArray);
      setStats({
        totalRevenue,
        totalAppointments: appointments.length,
        newClients: newClientsCount || 0,
        avgTicket: completed.length > 0 ? totalRevenue / completed.length : 0,
        completionRate: appointments.length > 0 ? (completed.length / appointments.length) * 100 : 0,
        cancellationRate: appointments.length > 0 ? (cancelled.length / appointments.length) * 100 : 0,
      });
    }

    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="reports-page">
      <style jsx>{`
        .reports-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-4);
        }

        .period-toggle {
          display: flex;
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-lg);
          padding: var(--space-1);
        }

        .period-toggle button {
          padding: var(--space-2) var(--space-4);
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--color-text-secondary);
          background: none;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
        }

        .period-toggle button.active {
          background: var(--color-bg-card);
          color: var(--color-text-primary);
          box-shadow: var(--shadow-sm);
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-4);
        }

        .stat-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .stat-card.highlight {
          background: var(--gradient-primary);
          color: white;
          border: none;
        }

        .stat-card.highlight .stat-label {
          color: rgba(255,255,255,0.8);
        }

        .stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-3);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .stat-icon.green { background: #d1fae5; }
        .stat-icon.blue { background: #dbeafe; }
        .stat-icon.purple { background: #ede9fe; }
        .stat-icon.orange { background: #fed7aa; }
        .stat-icon.pink { background: #fce7f3; }
        .stat-icon.red { background: #fee2e2; }

        .stat-value {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: var(--space-1);
        }

        .stat-card.highlight .stat-value {
          color: white;
        }

        .stat-label {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        /* Content Grid */
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-6);
        }

        .card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }

        .card-header {
          padding: var(--space-5);
          border-bottom: 1px solid var(--color-border);
        }

        .card-title {
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .card-body {
          padding: var(--space-5);
        }

        /* Top Services */
        .services-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .service-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .service-rank {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          background: var(--color-bg-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-text-muted);
        }

        .service-rank.top {
          background: var(--gradient-primary);
          color: white;
        }

        .service-info {
          flex: 1;
        }

        .service-name {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .service-count {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        .service-revenue {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-primary);
        }

        /* Progress Bars */
        .progress-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .progress-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .progress-label {
          display: flex;
          justify-content: space-between;
        }

        .progress-title {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .progress-value {
          font-size: var(--text-sm);
          font-weight: 600;
        }

        .progress-value.success { color: #059669; }
        .progress-value.error { color: #dc2626; }

        .progress-bar {
          height: 8px;
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 0.5s ease;
        }

        .progress-fill.success { background: #10b981; }
        .progress-fill.error { background: #ef4444; }

        /* Empty State */
        .empty-state {
          padding: var(--space-8);
          text-align: center;
          color: var(--color-text-muted);
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .content-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Header */}
      <div className="page-header">
        <span className="text-muted">Visão geral do período selecionado</span>
        <div className="period-toggle">
          <button
            className={period === 'week' ? 'active' : ''}
            onClick={() => setPeriod('week')}
          >
            Semana
          </button>
          <button
            className={period === 'month' ? 'active' : ''}
            onClick={() => setPeriod('month')}
          >
            Mês
          </button>
          <button
            className={period === 'year' ? 'active' : ''}
            onClick={() => setPeriod('year')}
          >
            Ano
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card highlight">
          <div className="stat-header">
            <span style={{ fontSize: '32px' }}>💰</span>
          </div>
          <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
          <div className="stat-label">Receita Total</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue">📅</div>
          </div>
          <div className="stat-value">{stats.totalAppointments}</div>
          <div className="stat-label">Agendamentos</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon purple">👥</div>
          </div>
          <div className="stat-value">{stats.newClients}</div>
          <div className="stat-label">Novos Clientes</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon orange">🎫</div>
          </div>
          <div className="stat-value">{formatCurrency(stats.avgTicket)}</div>
          <div className="stat-label">Ticket Médio</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon green">✓</div>
          </div>
          <div className="stat-value">{stats.completionRate.toFixed(1)}%</div>
          <div className="stat-label">Taxa de Conclusão</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon red">✕</div>
          </div>
          <div className="stat-value">{stats.cancellationRate.toFixed(1)}%</div>
          <div className="stat-label">Taxa de Cancelamento</div>
        </div>
      </div>

      {/* Content */}
      <div className="content-grid">
        {/* Top Services */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Serviços Mais Realizados</h3>
          </div>
          <div className="card-body">
            {topServices.length > 0 ? (
              <div className="services-list">
                {topServices.map((service, index) => (
                  <div key={service.name} className="service-item">
                    <div className={`service-rank ${index === 0 ? 'top' : ''}`}>
                      {index + 1}
                    </div>
                    <div className="service-info">
                      <div className="service-name">{service.name}</div>
                      <div className="service-count">{service.count} atendimentos</div>
                    </div>
                    <div className="service-revenue">
                      {formatCurrency(service.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                Nenhum dado disponível para o período
              </div>
            )}
          </div>
        </div>

        {/* Performance */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Performance</h3>
          </div>
          <div className="card-body">
            <div className="progress-section">
              <div className="progress-item">
                <div className="progress-label">
                  <span className="progress-title">Taxa de Conclusão</span>
                  <span className="progress-value success">{stats.completionRate.toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill success"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              </div>

              <div className="progress-item">
                <div className="progress-label">
                  <span className="progress-title">Taxa de Cancelamento</span>
                  <span className="progress-value error">{stats.cancellationRate.toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill error"
                    style={{ width: `${stats.cancellationRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
