import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import './home.css';

const categories = [
  { id: 'manicure', name: 'Manicure', icon: '💅', color: '#ec4899' },
  { id: 'maquiagem', name: 'Maquiagem', icon: '💄', color: '#f43f5e' },
  { id: 'depilacao', name: 'Depilação', icon: '✨', color: '#a855f7' },
  { id: 'cilios', name: 'Cílios', icon: '👁️', color: '#8b5cf6' },
  { id: 'pele', name: 'Skincare', icon: '🧴', color: '#06b6d4' },
  { id: 'harmonizacao', name: 'Harmonização', icon: '💎', color: '#14b8a6' },
  { id: 'massagem', name: 'Massagem', icon: '💆‍♀️', color: '#f97316' },
  { id: 'cabelo', name: 'Cabelo', icon: '💇‍♀️', color: '#eab308' },
];

export default async function HomePage() {
  const supabase = await createClient();

  const { count: providersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_public', true);

  const { count: servicesCount } = await supabase
    .from('services')
    .select('*', { count: 'exact', head: true })
    .eq('active', true);

  return (
    <div className="home">
      {/* Header */}
      <header className="header">
        <div className="container header-inner">
          <Link href="/" className="logo">
            <span className="logo-icon">💅</span>
            <span className="logo-text">BeautyPro</span>
          </Link>
          <nav className="nav">
            <Link href="/marketplace" className="nav-link">Explorar</Link>
            <Link href="/login" className="nav-link">Entrar</Link>
            <Link href="/signup" className="btn-primary">Cadastrar Grátis</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-text">
            <span className="badge">✨ Marketplace de Beleza #1</span>
            <h1>
              Encontre as melhores
              <span className="gradient-text"> profissionais de beleza</span>
              {' '}perto de você
            </h1>
            <p>
              Agende serviços de manicure, maquiagem, design de cílios,
              estética facial e muito mais com profissionais qualificadas.
            </p>

            <form action="/marketplace" method="GET" className="hero-search">
              <input
                type="text"
                name="q"
                placeholder="🔍 O que você procura? Ex: Manicure, Maquiagem..."
              />
              <button type="submit" className="btn-primary">Buscar</button>
            </form>

            <div className="stats">
              <div className="stat">
                <strong>{providersCount || 0}+</strong>
                <span>Profissionais</span>
              </div>
              <div className="stat">
                <strong>{servicesCount || 0}+</strong>
                <span>Serviços</span>
              </div>
              <div className="stat">
                <strong>5.0</strong>
                <span>Avaliação ⭐</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-cards">
              <div className="hero-card card-1">💅</div>
              <div className="hero-card card-2">💄</div>
              <div className="hero-card card-3">💆‍♀️</div>
              <div className="hero-card card-4">✨</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section categories-section">
        <div className="container">
          <div className="section-header">
            <h2>Explore por categoria</h2>
            <p>Encontre o serviço perfeito para você</p>
          </div>
          <div className="categories">
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/marketplace?category=${cat.id}`}
                className="category"
              >
                <span className="category-icon">{cat.icon}</span>
                <span className="category-name">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section how-section">
        <div className="container">
          <div className="section-header">
            <h2>Como funciona</h2>
            <p>Simples e rápido, em 3 passos</p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-icon">🔍</div>
              <h3>Busque</h3>
              <p>Encontre serviços e profissionais na sua região</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-icon">💬</div>
              <h3>Converse</h3>
              <p>Entre em contato direto com a profissional</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-icon">📅</div>
              <h3>Agende</h3>
              <p>Escolha o melhor horário e confirme</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Pro */}
      <section className="section pro-section">
        <div className="container">
          <div className="pro-content">
            <span className="badge badge-dark">Para Profissionais</span>
            <h2>É profissional de beleza?</h2>
            <p>
              Cadastre-se gratuitamente e mostre seus serviços para milhares de clientes.
              Gerencie agendamentos, receba mensagens e aumente seu faturamento.
            </p>
            <div className="pro-features">
              <span>✓ Perfil profissional</span>
              <span>✓ Chat com clientes</span>
              <span>✓ Gestão de agenda</span>
              <span>✓ Relatórios</span>
            </div>
            <Link href="/signup?role=provider" className="btn-primary btn-lg">
              Criar minha conta grátis →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <span className="logo-icon">💅</span>
            <span className="logo-text">BeautyPro</span>
            <p>O marketplace que conecta você às melhores profissionais de beleza.</p>
          </div>
          <div className="footer-links">
            <div>
              <h4>Explorar</h4>
              <Link href="/marketplace">Marketplace</Link>
              <Link href="/marketplace?category=manicure">Manicure</Link>
              <Link href="/marketplace?category=maquiagem">Maquiagem</Link>
            </div>
            <div>
              <h4>Conta</h4>
              <Link href="/signup">Cadastrar</Link>
              <Link href="/login">Entrar</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 BeautyPro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
