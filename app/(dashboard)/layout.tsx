'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { NotificationProvider } from '@/contexts/NotificationContext';
import ToastContainer from '@/components/Toast';
import NotificationDropdown from '@/components/NotificationDropdown';
import type { Profile } from '@/lib/database.types';
import './dashboard.css';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);
      setLoading(false);
    };

    getProfile();
  }, [router, supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Use window.location for a hard redirect to ensure session is fully cleared
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao sair:', error);
      // Force redirect even if signOut fails
      window.location.href = '/login';
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Agendamentos', href: '/appointments', icon: '📅' },
    { name: 'Clientes', href: '/clients', icon: '👥' },
    { name: 'Serviços', href: '/services', icon: '✂️' },
    { name: 'Mensagens', href: '/messages', icon: '💬' },
    { name: 'Relatórios', href: '/reports', icon: '📈' },
    { name: 'Marketplace', href: '/marketplace', icon: '🏪' },
    { name: 'Configurações', href: '/settings', icon: '⚙️' },
  ];

  const getPageTitle = () => {
    const route = navigation.find(item => pathname === item.href);
    return route?.name || 'Dashboard';
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">📅</div>
            <span className="logo-text">AtendePro</span>
          </div>
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {profile?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="user-details">
              <span className="user-name">{profile?.name || 'Usuário'}</span>
              <span className="user-email">{profile?.email}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <h1 className="page-title">{getPageTitle()}</h1>
          </div>
          <div className="header-right">
            <NotificationDropdown />
            <div className="header-avatar">
              {profile?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="main-content">
          {children}
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <DashboardContent>{children}</DashboardContent>
    </NotificationProvider>
  );
}
