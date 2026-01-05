'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const nextUrl = searchParams.get('next') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError('Email ou senha incorretos');
      setLoading(false);
      return;
    }

    router.push(nextUrl);
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${nextUrl}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Erro no login com Google:', error);
      setError(error.message || 'Erro ao iniciar login com Google');
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Digite seu email para receber o link');
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=${nextUrl}` },
    });

    if (error) {
      setError(error.message);
    } else {
      setError('');
      alert('Link enviado para seu email!');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        }
        
        .auth-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: linear-gradient(135deg, #00d1b2, #00a99d);
          color: white;
        }
        
        .auth-left h1 { font-size: 48px; font-weight: 800; margin-bottom: 16px; }
        .auth-left p { font-size: 18px; opacity: 0.9; max-width: 400px; text-align: center; line-height: 1.6; }
        .auth-logo { font-size: 64px; margin-bottom: 24px; }
        
        .features { margin-top: 40px; text-align: left; }
        .feature { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; font-size: 16px; }
        .feature span { font-size: 20px; }
        
        .auth-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        
        .auth-card {
          width: 100%;
          max-width: 440px;
          background: white;
          border-radius: 24px;
          padding: 48px 40px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .auth-header { text-align: center; margin-bottom: 32px; }
        .auth-title { font-size: 28px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
        .auth-subtitle { font-size: 15px; color: #64748b; }
        
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; font-size: 14px; font-weight: 500; color: #0f172a; margin-bottom: 8px; }
        .form-input {
          width: 100%;
          padding: 14px 16px;
          font-size: 15px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          transition: all 0.2s;
        }
        .form-input:focus { outline: none; border-color: #00d1b2; box-shadow: 0 0 0 3px rgba(0,209,178,0.1); }
        .form-input::placeholder { color: #94a3b8; }
        
        .forgot-link { display: block; text-align: right; font-size: 13px; color: #00d1b2; margin-top: 8px; text-decoration: none; }
        
        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          margin-bottom: 20px;
        }
        
        .btn {
          width: 100%;
          padding: 16px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #00d1b2, #00a99d);
          color: white;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,209,178,0.4); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        
        .btn-secondary {
          background: transparent;
          color: #00d1b2;
          border: 1px solid #00d1b2;
          margin-top: 12px;
        }
        .btn-secondary:hover { background: #f0fdfa; }
        
        .divider { display: flex; align-items: center; gap: 16px; margin: 24px 0; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }
        .divider span { font-size: 13px; color: #94a3b8; }
        
        .btn-google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: white;
          border: 1px solid #e2e8f0;
          color: #0f172a;
        }
        .btn-google:hover { background: #f8fafc; }
        
        .auth-footer { text-align: center; margin-top: 24px; font-size: 14px; color: #64748b; }
        .auth-footer a { color: #00d1b2; font-weight: 500; text-decoration: none; }
        
        @media (max-width: 900px) {
          .auth-left { display: none; }
          .auth-page { background: white; }
        }
      `}</style>

      <div className="auth-left">
        <div className="auth-logo">💅</div>
        <h1>BeautyPro</h1>
        <p>A plataforma que conecta profissionais de beleza e clientes em todo o Brasil</p>

        <div className="features">
          <div className="feature"><span>✨</span> Encontre profissionais qualificados</div>
          <div className="feature"><span>📅</span> Agende de forma rápida e fácil</div>
          <div className="feature"><span>💬</span> Converse diretamente com profissionais</div>
          <div className="feature"><span>⭐</span> Avalie e veja avaliações</div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Bem-vindo de volta!</h1>
            <p className="auth-subtitle">Entre na sua conta para continuar</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <a href="#" className="forgot-link" onClick={(e) => { e.preventDefault(); handleMagicLink(); }}>
                Esqueceu a senha? Enviar link por email
              </a>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="divider"><span>ou</span></div>

          <button className="btn btn-google" onClick={handleGoogleLogin}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            Continuar com Google
          </button>

          <div className="auth-footer">
            Não tem uma conta? <Link href="/signup">Cadastrar grátis</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
