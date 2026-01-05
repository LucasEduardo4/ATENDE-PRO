'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function SignupForm() {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<'client' | 'professional' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    // Professional fields
    businessName: '',
    bio: '',
    city: '',
    state: '',
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const handleUserTypeSelect = (type: 'client' | 'professional') => {
    setUserType(type);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
          phone: formData.phone,
          user_type: userType,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create profile
      const profileData: any = {
        id: data.user.id,
        name: formData.name,
        phone: formData.phone,
        user_type: userType,
        is_public: userType === 'professional',
      };

      if (userType === 'professional') {
        profileData.business_name = formData.businessName;
        profileData.bio = formData.bio;
        profileData.city = formData.city;
        profileData.state = formData.state;
      }

      await supabase.from('profiles').upsert(profileData);
    }

    setLoading(false);

    if (userType === 'professional') {
      router.push('/dashboard');
    } else {
      router.push('/marketplace');
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Erro no cadastro com Google:', error);
      setError(error.message || 'Erro ao iniciar cadastro com Google');
    }
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
        .auth-left p { font-size: 18px; opacity: 0.9; max-width: 400px; text-align: center; }
        .auth-logo { font-size: 64px; margin-bottom: 24px; }
        
        .auth-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        
        .auth-card {
          width: 100%;
          max-width: 480px;
          background: white;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .auth-header { text-align: center; margin-bottom: 32px; }
        .auth-title { font-size: 28px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
        .auth-subtitle { font-size: 15px; color: #64748b; }
        
        .step-indicator { display: flex; justify-content: center; gap: 8px; margin-bottom: 32px; }
        .step-dot { width: 10px; height: 10px; border-radius: 50%; background: #e2e8f0; }
        .step-dot.active { background: #00d1b2; width: 32px; border-radius: 5px; }
        
        .type-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .type-card {
          padding: 32px 24px;
          border: 2px solid #e2e8f0;
          border-radius: 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .type-card:hover { border-color: #00d1b2; background: #f0fdfa; }
        .type-card.selected { border-color: #00d1b2; background: #f0fdfa; }
        .type-icon { font-size: 48px; margin-bottom: 16px; }
        .type-title { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
        .type-desc { font-size: 13px; color: #64748b; }
        
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
        
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        
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
        
        .btn-back {
          background: none;
          color: #64748b;
          margin-bottom: 16px;
          padding: 8px;
          width: auto;
        }
        .btn-back:hover { color: #0f172a; }
        
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
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="step-indicator">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
          </div>

          {step === 1 && (
            <>
              <div className="auth-header">
                <h1 className="auth-title">Criar conta</h1>
                <p className="auth-subtitle">Como você quer usar o BeautyPro?</p>
              </div>

              <div className="type-selector">
                <div className="type-card" onClick={() => handleUserTypeSelect('client')}>
                  <div className="type-icon">🙋‍♀️</div>
                  <div className="type-title">Sou Cliente</div>
                  <div className="type-desc">Quero encontrar e agendar serviços de beleza</div>
                </div>
                <div className="type-card" onClick={() => handleUserTypeSelect('professional')}>
                  <div className="type-icon">💅</div>
                  <div className="type-title">Sou Profissional</div>
                  <div className="type-desc">Quero oferecer meus serviços e gerenciar agenda</div>
                </div>
              </div>

              <div className="divider"><span>ou</span></div>

              <button className="btn btn-google" onClick={handleGoogleSignup}>
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                Continuar com Google
              </button>

              <div className="auth-footer">
                Já tem uma conta? <Link href="/login">Entrar</Link>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <button className="btn btn-back" onClick={() => setStep(1)}>← Voltar</button>

              <div className="auth-header">
                <h1 className="auth-title">
                  {userType === 'professional' ? 'Cadastro Profissional' : 'Cadastro Cliente'}
                </h1>
                <p className="auth-subtitle">Preencha seus dados para continuar</p>
              </div>

              {error && <div className="error-message">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Nome completo *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Seu nome"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp *</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>

                {userType === 'professional' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Nome do seu negócio *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.businessName}
                        onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                        placeholder="Ex: Studio Maria Beleza"
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Cidade *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.city}
                          onChange={e => setFormData({ ...formData, city: e.target.value })}
                          placeholder="São Paulo"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Estado *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.state}
                          onChange={e => setFormData({ ...formData, state: e.target.value })}
                          placeholder="SP"
                          maxLength={2}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Sobre você / seu trabalho</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.bio}
                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Conte um pouco sobre seus serviços..."
                      />
                    </div>
                  </>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Senha *</label>
                    <input
                      type="password"
                      className="form-input"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirmar *</label>
                    <input
                      type="password"
                      className="form-input"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Criando conta...' : 'Criar minha conta'}
                </button>
              </form>

              <div className="auth-footer">
                Já tem uma conta? <Link href="/login">Entrar</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Carregando...</div>}>
      <SignupForm />
    </Suspense>
  );
}
