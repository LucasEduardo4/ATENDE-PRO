'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Client, ClientInsert } from '@/lib/database.types';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const supabase = createClient();
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (!error && data) {
      setClients(data);
    }
    setLoading(false);
  };

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        notes: client.notes || '',
      });
    } else {
      setEditingClient(null);
      setFormData({ name: '', email: '', phone: '', notes: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingClient) {
      const { error } = await supabase
        .from('clients')
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingClient.id);

      if (!error) {
        setClients(clients.map(c =>
          c.id === editingClient.id
            ? { ...c, ...formData, updated_at: new Date().toISOString() }
            : c
        ));
        await addNotification(
          'Cliente atualizado',
          `${formData.name} foi atualizado com sucesso.`,
          'success',
          'client_updated',
          editingClient.id
        );
      }
    } else {
      const newClient: ClientInsert = {
        user_id: user.id,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        notes: formData.notes || null,
      };

      const { data, error } = await supabase
        .from('clients')
        .insert(newClient)
        .select()
        .single();

      if (!error && data) {
        setClients([...clients, data]);
        await addNotification(
          'Cliente cadastrado',
          `${formData.name} foi adicionado à sua lista de clientes.`,
          'success',
          'client_created',
          data.id
        );
      }
    }

    setSaving(false);
    setShowModal(false);
  };

  const deleteClient = async (id: string) => {
    const client = clients.find(c => c.id === id);
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (!error) {
      setClients(clients.filter(c => c.id !== id));
      await addNotification(
        'Cliente removido',
        `${client?.name} foi removido da sua lista de clientes.`,
        'info',
        'client_deleted'
      );
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.email?.toLowerCase().includes(search.toLowerCase()) ||
    client.phone?.includes(search)
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="clients-page">
      <style jsx>{`
        .clients-page {
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

        .search-box {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-3) var(--space-4);
          min-width: 300px;
        }

        .search-box input {
          flex: 1;
          border: none;
          background: none;
          font-size: var(--text-sm);
          color: var(--color-text-primary);
        }

        .search-box input:focus {
          outline: none;
        }

        .clients-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--space-4);
        }

        .client-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          transition: all 0.2s ease;
        }

        .client-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .client-header {
          display: flex;
          align-items: flex-start;
          gap: var(--space-4);
          margin-bottom: var(--space-4);
        }

        .client-avatar {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-full);
          background: var(--gradient-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: var(--text-lg);
          flex-shrink: 0;
        }

        .client-info {
          flex: 1;
          min-width: 0;
        }

        .client-name {
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: var(--space-1);
        }

        .client-contact {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .client-contact a {
          color: var(--color-primary);
        }

        .client-details {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-border);
        }

        .client-detail {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .client-actions {
          display: flex;
          gap: var(--space-2);
          margin-top: var(--space-4);
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-4);
        }

        .modal {
          background: var(--color-bg-card);
          border-radius: var(--radius-2xl);
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-xl);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-5);
          border-bottom: 1px solid var(--color-border);
        }

        .modal-title {
          font-size: var(--text-lg);
          font-weight: 600;
        }

        .modal-close {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          font-size: var(--text-lg);
        }

        .modal-close:hover {
          background: var(--color-bg-tertiary);
        }

        .modal-body {
          padding: var(--space-5);
        }

        .form-group {
          margin-bottom: var(--space-5);
        }

        .form-label {
          display: block;
          font-size: var(--text-sm);
          font-weight: 500;
          margin-bottom: var(--space-2);
        }

        .form-input,
        .form-textarea {
          width: 100%;
          padding: var(--space-3) var(--space-4);
          font-size: var(--text-sm);
          background: var(--color-bg-primary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-3);
          padding: var(--space-4) var(--space-5);
          border-top: 1px solid var(--color-border);
          background: var(--color-bg-tertiary);
        }

        .empty-state {
          background: var(--color-bg-card);
          border: 2px dashed var(--color-border);
          border-radius: var(--radius-2xl);
          padding: var(--space-16);
          text-align: center;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: var(--space-4);
          opacity: 0.5;
        }

        .empty-title {
          font-size: var(--text-xl);
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: var(--space-2);
        }

        .empty-description {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin-bottom: var(--space-6);
        }

        @media (max-width: 640px) {
          .search-box {
            min-width: 100%;
          }

          .page-header {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>

      <div className="page-header">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          ➕ Novo Cliente
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>Carregando...</div>
      ) : filteredClients.length > 0 ? (
        <div className="clients-grid">
          {filteredClients.map(client => (
            <div key={client.id} className="client-card">
              <div className="client-header">
                <div className="client-avatar">
                  {getInitials(client.name)}
                </div>
                <div className="client-info">
                  <div className="client-name">{client.name}</div>
                  <div className="client-contact">
                    {client.email && (
                      <a href={`mailto:${client.email}`}>{client.email}</a>
                    )}
                  </div>
                </div>
              </div>
              <div className="client-details">
                {client.phone && (
                  <div className="client-detail">📱 {client.phone}</div>
                )}
                {client.notes && (
                  <div className="client-detail">📝 {client.notes}</div>
                )}
              </div>
              <div className="client-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => openModal(client)}>
                  ✏️ Editar
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => deleteClient(client.id)}>
                  🗑️ Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <div className="empty-title">Nenhum cliente cadastrado</div>
          <div className="empty-description">
            Comece adicionando seu primeiro cliente para gerenciar seus agendamentos.
          </div>
          <button className="btn btn-primary" onClick={() => openModal()}>
            ➕ Adicionar Cliente
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Nome completo"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Observações</label>
                  <textarea
                    className="form-textarea"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Anotações sobre o cliente..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : (editingClient ? 'Salvar' : 'Criar Cliente')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
