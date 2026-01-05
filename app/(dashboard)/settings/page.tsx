'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { addNotification } = useNotifications();

  const [profile, setProfile] = useState<any>({
    name: '',
    email: '',
    phone: '',
    business_name: '',
    bio: '',
    address: '',
    city: '',
    state: '',
    is_public: false,
  });

  const [businessHours, setBusinessHours] = useState({
    monday: { enabled: true, start: '09:00', end: '18:00' },
    tuesday: { enabled: true, start: '09:00', end: '18:00' },
    wednesday: { enabled: true, start: '09:00', end: '18:00' },
    thursday: { enabled: true, start: '09:00', end: '18:00' },
    friday: { enabled: true, start: '09:00', end: '18:00' },
    saturday: { enabled: true, start: '09:00', end: '13:00' },
    sunday: { enabled: false, start: '09:00', end: '18:00' },
  });

  const [notifications, setNotifications] = useState({ email: true, whatsapp: true, sms: false });

  const dayNames: Record<string, string> = {
    monday: 'Segunda-feira', tuesday: 'Terça-feira', wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira', friday: 'Sexta-feira', saturday: 'Sábado', sunday: 'Domingo',
  };

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profileData) setProfile(profileData);

    const { data: settingsData } = await supabase.from('business_settings').select('*').eq('user_id', user.id).single();
    if (settingsData) {
      if (settingsData.business_hours) setBusinessHours(settingsData.business_hours as typeof businessHours);
      setNotifications({ email: settingsData.notification_email, whatsapp: settingsData.notification_whatsapp, sms: settingsData.notification_sms });
    }

    setLoading(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('profiles').update({
      name: profile.name,
      phone: profile.phone,
      business_name: profile.business_name,
      bio: profile.bio,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      is_public: profile.is_public,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    await addNotification('Perfil atualizado', 'Suas informações foram salvas com sucesso.', 'success', 'profile_updated');
    setSaving(false);
  };

  const saveBusinessSettings = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('business_settings').upsert({
      user_id: user.id,
      business_hours: businessHours,
      notification_email: notifications.email,
      notification_whatsapp: notifications.whatsapp,
      notification_sms: notifications.sms,
      updated_at: new Date().toISOString(),
    });

    await addNotification('Configurações salvas', 'Suas configurações foram atualizadas.', 'success', 'settings_updated');
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: '👤' },
    { id: 'marketplace', label: 'Marketplace', icon: '🏪' },
    { id: 'business', label: 'Horários', icon: '🕐' },
    { id: 'notifications', label: 'Notificações', icon: '🔔' },
    { id: 'account', label: 'Conta', icon: '⚙️' },
  ];

  if (loading) return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Carregando...</div>;

  return (
    <div className="settings-page">
      <style jsx>{`
        .settings-page { display: flex; flex-direction: column; gap: var(--space-6); }
        .settings-container { display: grid; grid-template-columns: 240px 1fr; gap: var(--space-6); }
        .settings-tabs { display: flex; flex-direction: column; gap: var(--space-2); }
        .tab-item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); font-size: var(--text-sm); font-weight: 500; color: var(--color-text-secondary); background: none; border: none; border-radius: var(--radius-lg); cursor: pointer; text-align: left; }
        .tab-item:hover { background: var(--color-bg-tertiary); color: var(--color-text-primary); }
        .tab-item.active { background: var(--color-primary-light); color: var(--color-primary); }
        .logout-section { margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
        .logout-btn { width: 100%; display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); font-size: var(--text-sm); font-weight: 500; color: var(--color-error); background: none; border: 1px solid var(--color-error); border-radius: var(--radius-lg); cursor: pointer; }
        .settings-content { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: var(--space-6); }
        .section-title { font-size: var(--text-lg); font-weight: 600; color: var(--color-text-primary); margin-bottom: var(--space-6); }
        .section-description { font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-6); }
        .form-group { margin-bottom: var(--space-5); }
        .form-label { display: block; font-size: var(--text-sm); font-weight: 500; color: var(--color-text-primary); margin-bottom: var(--space-2); }
        .form-input, .form-textarea { width: 100%; max-width: 400px; padding: var(--space-3) var(--space-4); font-size: var(--text-sm); background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); max-width: 400px; }
        .toggle-list { display: flex; flex-direction: column; gap: var(--space-4); }
        .toggle-item { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4); background: var(--color-bg-tertiary); border-radius: var(--radius-lg); }
        .toggle-info { flex: 1; }
        .toggle-title { font-size: var(--text-sm); font-weight: 500; color: var(--color-text-primary); margin-bottom: var(--space-1); }
        .toggle-description { font-size: var(--text-xs); color: var(--color-text-muted); }
        .toggle-switch { width: 48px; height: 24px; background: var(--color-border); border-radius: var(--radius-full); position: relative; cursor: pointer; transition: background 0.2s ease; }
        .toggle-switch.active { background: var(--color-primary); }
        .toggle-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: transform 0.2s ease; }
        .toggle-switch.active::after { transform: translateX(24px); }
        .hours-list { display: flex; flex-direction: column; gap: var(--space-3); }
        .hours-item { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-3) var(--space-4); background: var(--color-bg-tertiary); border-radius: var(--radius-lg); }
        .hours-day { font-size: var(--text-sm); font-weight: 500; min-width: 120px; }
        .hours-inputs { display: flex; align-items: center; gap: var(--space-2); }
        .hours-inputs input { padding: var(--space-2) var(--space-3); font-size: var(--text-sm); background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-md); width: 100px; }
        .hours-closed { font-size: var(--text-sm); color: var(--color-text-muted); }
        .danger-zone { margin-top: var(--space-8); padding: var(--space-5); border: 1px solid #fecaca; border-radius: var(--radius-lg); background: rgba(254, 202, 202, 0.1); }
        .danger-title { font-size: var(--text-base); font-weight: 600; color: #dc2626; margin-bottom: var(--space-2); }
        .danger-description { font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-4); }
        .public-badge { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); background: #d1fae5; color: #059669; border-radius: var(--radius-full); font-size: var(--text-xs); font-weight: 600; }
        @media (max-width: 768px) { .settings-container { grid-template-columns: 1fr; } .settings-tabs { flex-direction: row; overflow-x: auto; } .logout-section { display: none; } .form-row { grid-template-columns: 1fr; } }
      `}</style>

      <div className="settings-container">
        <div className="settings-tabs">
          {tabs.map((tab) => (
            <button key={tab.id} className={`tab-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
          <div className="logout-section">
            <button onClick={handleLogout} className="logout-btn">🚪 Sair da Conta</button>
          </div>
        </div>

        <div className="settings-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="section-title">Informações do Perfil</h2>
              <div className="form-group">
                <label className="form-label">Nome completo</label>
                <input type="text" className="form-input" value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={profile.email || ''} disabled style={{ opacity: 0.6 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input type="tel" className="form-input" value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Nome do Negócio</label>
                <input type="text" className="form-input" value={profile.business_name || ''} onChange={(e) => setProfile({ ...profile, business_name: e.target.value })} />
              </div>
              <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Alterações'}</button>
            </div>
          )}

          {/* Marketplace Tab */}
          {activeTab === 'marketplace' && (
            <div>
              <h2 className="section-title">Configurações do Marketplace</h2>
              <p className="section-description">Configure seu perfil público para aparecer no marketplace e receber clientes.</p>

              <div className="toggle-item" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="toggle-info">
                  <div className="toggle-title">Perfil Público no Marketplace</div>
                  <div className="toggle-description">Ative para que clientes encontrem você no marketplace</div>
                </div>
                <div className={`toggle-switch ${profile.is_public ? 'active' : ''}`} onClick={() => setProfile({ ...profile, is_public: !profile.is_public })} />
              </div>

              {profile.is_public && <span className="public-badge">✓ Visível no Marketplace</span>}

              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginTop: 'var(--space-8)', marginBottom: 'var(--space-4)' }}>Sobre o Negócio</h3>

              <div className="form-group">
                <label className="form-label">Descrição / Bio</label>
                <textarea className="form-textarea" value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} placeholder="Conte um pouco sobre seu negócio..." style={{ maxWidth: '100%' }} />
              </div>

              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginTop: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>Localização</h3>

              <div className="form-group">
                <label className="form-label">Endereço</label>
                <input type="text" className="form-input" value={profile.address || ''} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Rua, número" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cidade</label>
                  <input type="text" className="form-input" value={profile.city || ''} onChange={(e) => setProfile({ ...profile, city: e.target.value })} placeholder="São Paulo" />
                </div>
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <input type="text" className="form-input" value={profile.state || ''} onChange={(e) => setProfile({ ...profile, state: e.target.value })} placeholder="SP" maxLength={2} />
                </div>
              </div>

              <button className="btn btn-primary" onClick={saveProfile} disabled={saving} style={{ marginTop: 'var(--space-4)' }}>{saving ? 'Salvando...' : 'Salvar Configurações'}</button>
            </div>
          )}

          {/* Business Hours Tab */}
          {activeTab === 'business' && (
            <div>
              <h2 className="section-title">Horário de Funcionamento</h2>
              <div className="hours-list">
                {Object.entries(businessHours).map(([day, hours]) => (
                  <div key={day} className="hours-item">
                    <div className={`toggle-switch ${hours.enabled ? 'active' : ''}`} onClick={() => setBusinessHours({ ...businessHours, [day]: { ...hours, enabled: !hours.enabled } })} />
                    <span className="hours-day">{dayNames[day]}</span>
                    {hours.enabled ? (
                      <div className="hours-inputs">
                        <input type="time" value={hours.start} onChange={(e) => setBusinessHours({ ...businessHours, [day]: { ...hours, start: e.target.value } })} />
                        <span>até</span>
                        <input type="time" value={hours.end} onChange={(e) => setBusinessHours({ ...businessHours, [day]: { ...hours, end: e.target.value } })} />
                      </div>
                    ) : <span className="hours-closed">Fechado</span>}
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" onClick={saveBusinessSettings} disabled={saving} style={{ marginTop: 'var(--space-6)' }}>{saving ? 'Salvando...' : 'Salvar Horários'}</button>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className="section-title">Preferências de Notificação</h2>
              <div className="toggle-list">
                <div className="toggle-item">
                  <div className="toggle-info">
                    <div className="toggle-title">Notificações por Email</div>
                    <div className="toggle-description">Receba lembretes e confirmações por email</div>
                  </div>
                  <div className={`toggle-switch ${notifications.email ? 'active' : ''}`} onClick={() => setNotifications({ ...notifications, email: !notifications.email })} />
                </div>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <div className="toggle-title">Notificações por WhatsApp</div>
                    <div className="toggle-description">Envie lembretes automáticos aos clientes</div>
                  </div>
                  <div className={`toggle-switch ${notifications.whatsapp ? 'active' : ''}`} onClick={() => setNotifications({ ...notifications, whatsapp: !notifications.whatsapp })} />
                </div>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <div className="toggle-title">Notificações por SMS</div>
                    <div className="toggle-description">Envie lembretes automáticos por SMS</div>
                  </div>
                  <div className={`toggle-switch ${notifications.sms ? 'active' : ''}`} onClick={() => setNotifications({ ...notifications, sms: !notifications.sms })} />
                </div>
              </div>
              <button className="btn btn-primary" onClick={saveBusinessSettings} disabled={saving} style={{ marginTop: 'var(--space-6)' }}>{saving ? 'Salvando...' : 'Salvar Preferências'}</button>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div>
              <h2 className="section-title">Configurações da Conta</h2>
              <div className="form-group">
                <label className="form-label">Email da conta</label>
                <input type="email" className="form-input" value={profile.email || ''} disabled style={{ opacity: 0.6 }} />
              </div>
              <div className="danger-zone">
                <div className="danger-title">⚠️ Zona de Perigo</div>
                <div className="danger-description">Ações irreversíveis. Tenha cuidado.</div>
                <button className="btn btn-ghost" style={{ color: '#dc2626', borderColor: '#dc2626' }}>Excluir minha conta</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
