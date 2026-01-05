'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Client, Service, Appointment } from '@/lib/database.types';

interface Stats {
  todayAppointments: number;
  weekAppointments: number;
  totalClients: number;
  monthRevenue: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    todayAppointments: 0,
    weekAppointments: 0,
    totalClients: 0,
    monthRevenue: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date();
    monthStart.setDate(1);

    // Get today's appointments count
    const { count: todayCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('start_time', today)
      .lt('start_time', new Date(new Date(today).getTime() + 86400000).toISOString());

    // Get week's appointments count
    const { count: weekCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('start_time', weekStart.toISOString());

    // Get total clients
    const { count: clientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get month revenue
    const { data: monthAppointments } = await supabase
      .from('appointments')
      .select('price')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('start_time', monthStart.toISOString());

    const revenue = monthAppointments?.reduce((sum, a) => sum + (a.price || 0), 0) || 0;

    setStats({
      todayAppointments: todayCount || 0,
      weekAppointments: weekCount || 0,
      totalClients: clientsCount || 0,
      monthRevenue: revenue,
    });

    // Get upcoming appointments with client and service info
    const { data: upcoming } = await supabase
      .from('appointments')
      .select(`
        *,
        clients (name),
        services (name)
      `)
      .eq('user_id', user.id)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(5);

    setUpcomingAppointments(upcoming || []);

    // Get recent clients
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentClients(clients || []);
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      pending: { label: 'Pendente', class: 'warning' },
      confirmed: { label: 'Confirmado', class: 'success' },
      completed: { label: 'Concluído', class: 'info' },
      cancelled: { label: 'Cancelado', class: 'error' },
    };
    const { label, class: className } = statusMap[status] || { label: status, class: '' };
    return <span className={`badge badge-${className}`}>{label}</span>;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="skeleton-grid">
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <style jsx>{`
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        /* Welcome Banner */
        .welcome-banner {
          background: var(--gradient-hero);
          border-radius: var(--radius-2xl);
          padding: var(--space-8);
          color: white;
          position: relative;
          overflow: hidden;
        }

        .welcome-banner::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
          border-radius: 50%;
        }

        .welcome-banner::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: 10%;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          border-radius: 50%;
        }

        .welcome-content {
          position: relative;
          z-index: 1;
        }

        .welcome-title {
          font-size: var(--text-2xl);
          font-weight: 700;
          margin-bottom: var(--space-2);
        }

        .welcome-subtitle {
          font-size: var(--text-base);
          opacity: 0.9;
          margin-bottom: var(--space-6);
        }

        .welcome-actions {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .btn-white {
          background: white;
          color: var(--color-primary);
          font-weight: 600;
          box-shadow: var(--shadow-md);
        }

        .btn-white:hover {
          background: #f8fafc;
          transform: translateY(-2px);
        }

        .btn-outline-white {
          background: transparent;
          color: white;
          border: 2px solid rgba(255,255,255,0.5);
        }

        .btn-outline-white:hover {
          background: rgba(255,255,255,0.1);
          border-color: white;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
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

        .stat-icon.blue { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); }
        .stat-icon.green { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); }
        .stat-icon.purple { background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); }
        .stat-icon.orange { background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%); }

        .stat-trend {
          font-size: var(--text-xs);
          font-weight: 600;
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-full);
        }

        .stat-trend.up {
          background: #d1fae5;
          color: #059669;
        }

        .stat-value {
          font-size: var(--text-3xl);
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: var(--space-1);
        }

        .stat-label {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        /* Content Grid */
        .content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: var(--space-6);
        }

        /* Card */
        .card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-5);
          border-bottom: 1px solid var(--color-border);
        }

        .card-title {
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .card-body {
          padding: var(--space-4);
        }

        /* Appointment Item */
        .appointment-item {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          transition: background 0.15s ease;
        }

        .appointment-item:hover {
          background: var(--color-bg-tertiary);
        }

        .appointment-time {
          text-align: center;
          min-width: 70px;
        }

        .appointment-hour {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--color-primary);
        }

        .appointment-date {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        .appointment-info {
          flex: 1;
        }

        .appointment-client {
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: var(--space-1);
        }

        .appointment-service {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        /* Client Item */
        .client-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          border-radius: var(--radius-lg);
          transition: background 0.15s ease;
        }

        .client-item:hover {
          background: var(--color-bg-tertiary);
        }

        .client-avatar {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          background: var(--gradient-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: var(--text-sm);
        }

        .client-info {
          flex: 1;
        }

        .client-name {
          font-weight: 600;
          color: var(--color-text-primary);
          font-size: var(--text-sm);
        }

        .client-contact {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        /* Quick Actions */
        .quick-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-3);
          padding: var(--space-4);
        }

        .quick-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-4);
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-lg);
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .quick-action:hover {
          background: var(--color-primary-light);
          transform: translateY(-2px);
        }

        .quick-action-icon {
          font-size: 24px;
        }

        .quick-action-label {
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--color-text-secondary);
          text-align: center;
        }

        /* Empty State */
        .empty-state {
          padding: var(--space-8);
          text-align: center;
          color: var(--color-text-muted);
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: var(--space-4);
          opacity: 0.5;
        }

        .empty-text {
          font-size: var(--text-sm);
          margin-bottom: var(--space-4);
        }

        /* Responsive */
        @media (max-width: 1200px) {
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

          .welcome-banner {
            padding: var(--space-6);
          }

          .welcome-title {
            font-size: var(--text-xl);
          }
        }
      `}</style>

      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-content">
          <h2 className="welcome-title">Bom dia! 👋</h2>
          <p className="welcome-subtitle">
            Você tem {stats.todayAppointments} agendamento{stats.todayAppointments !== 1 ? 's' : ''} para hoje.
            Vamos começar?
          </p>
          <div className="welcome-actions">
            <Link href="/appointments" className="btn btn-white">
              📅 Ver Agenda
            </Link>
            <Link href="/clients" className="btn btn-outline-white">
              ➕ Novo Cliente
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue">📅</div>
            <span className="stat-trend up">Hoje</span>
          </div>
          <div className="stat-value">{stats.todayAppointments}</div>
          <div className="stat-label">Agendamentos Hoje</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon green">📆</div>
            <span className="stat-trend up">Semana</span>
          </div>
          <div className="stat-value">{stats.weekAppointments}</div>
          <div className="stat-label">Esta Semana</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon purple">👥</div>
          </div>
          <div className="stat-value">{stats.totalClients}</div>
          <div className="stat-label">Total de Clientes</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon orange">💰</div>
            <span className="stat-trend up">Mês</span>
          </div>
          <div className="stat-value">{formatCurrency(stats.monthRevenue)}</div>
          <div className="stat-label">Receita do Mês</div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        {/* Upcoming Appointments */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Próximos Agendamentos</h3>
            <Link href="/appointments" className="btn btn-ghost btn-sm">
              Ver todos →
            </Link>
          </div>
          <div className="card-body">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="appointment-item">
                  <div className="appointment-time">
                    <div className="appointment-hour">
                      {formatTime(appointment.start_time)}
                    </div>
                    <div className="appointment-date">
                      {formatDate(appointment.start_time)}
                    </div>
                  </div>
                  <div className="appointment-info">
                    <div className="appointment-client">
                      {appointment.clients?.name || 'Cliente não informado'}
                    </div>
                    <div className="appointment-service">
                      {appointment.services?.name || 'Serviço não informado'}
                    </div>
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <p className="empty-text">Nenhum agendamento próximo</p>
                <Link href="/appointments" className="btn btn-primary btn-sm">
                  Criar Agendamento
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar-content">
          {/* Recent Clients */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Clientes Recentes</h3>
              <Link href="/clients" className="btn btn-ghost btn-sm">
                Ver todos →
              </Link>
            </div>
            <div className="card-body">
              {recentClients.length > 0 ? (
                recentClients.map((client) => (
                  <div key={client.id} className="client-item">
                    <div className="client-avatar">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="client-info">
                      <div className="client-name">{client.name}</div>
                      <div className="client-contact">
                        {client.phone || client.email || 'Sem contato'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <p className="empty-text">Nenhum cliente cadastrado</p>
                  <Link href="/clients" className="btn btn-primary btn-sm">
                    Adicionar Cliente
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ marginTop: 'var(--space-4)' }}>
            <div className="card-header">
              <h3 className="card-title">Ações Rápidas</h3>
            </div>
            <div className="quick-actions">
              <Link href="/appointments" className="quick-action">
                <span className="quick-action-icon">➕</span>
                <span className="quick-action-label">Novo Agendamento</span>
              </Link>
              <Link href="/clients" className="quick-action">
                <span className="quick-action-icon">👤</span>
                <span className="quick-action-label">Novo Cliente</span>
              </Link>
              <Link href="/services" className="quick-action">
                <span className="quick-action-icon">✂️</span>
                <span className="quick-action-label">Novo Serviço</span>
              </Link>
              <Link href="/reports" className="quick-action">
                <span className="quick-action-icon">📊</span>
                <span className="quick-action-label">Ver Relatórios</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
