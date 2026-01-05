'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Client, Service } from '@/lib/database.types';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [monthAppointments, setMonthAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ client_id: '', service_id: '', date: '', time: '', notes: '' });
  const supabase = createClient();
  const { addNotification } = useNotifications();

  useEffect(() => { loadMonthData(); }, [currentMonth]);
  useEffect(() => { filterDayAppointments(); }, [selectedDate, monthAppointments]);

  const loadMonthData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const { data: appointmentsData } = await supabase
      .from('appointments')
      .select(`*, clients (id, name, phone), services (id, name, price, duration_minutes)`)
      .eq('user_id', user.id)
      .gte('start_time', startOfMonth.toISOString())
      .lte('start_time', endOfMonth.toISOString())
      .order('start_time', { ascending: true });

    setMonthAppointments(appointmentsData || []);

    const { data: clientsData } = await supabase.from('clients').select('*').eq('user_id', user.id).order('name');
    const { data: servicesData } = await supabase.from('services').select('*').eq('user_id', user.id).eq('active', true).order('name');

    setClients(clientsData || []);
    setServices(servicesData || []);
    setLoading(false);
  };

  const filterDayAppointments = () => {
    const dayAppts = monthAppointments.filter(a => {
      const apptDate = new Date(a.start_time);
      return apptDate.toDateString() === selectedDate.toDateString();
    });
    setAppointments(dayAppts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const service = services.find(s => s.id === formData.service_id);
    const client = clients.find(c => c.id === formData.client_id);
    if (!service) return;

    const startTime = new Date(`${formData.date}T${formData.time}`);
    const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);

    const newAppointment = {
      user_id: user.id,
      client_id: formData.client_id,
      service_id: formData.service_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      price: service.price,
      notes: formData.notes || null,
      status: 'pending',
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert(newAppointment as any)
      .select(`*, clients (id, name, phone), services (id, name, price, duration_minutes)`)
      .single();

    if (!error && data) {
      setMonthAppointments([...monthAppointments, data]);
      await addNotification('Agendamento criado', `${client?.name} agendado para ${new Date(startTime).toLocaleString('pt-BR')}`, 'success', 'appointment_created', (data as any).id);
    }

    setSaving(false);
    setShowModal(false);
    setFormData({ client_id: '', service_id: '', date: '', time: '', notes: '' });
  };

  const updateStatus = async (id: string, status: string, clientName?: string) => {
    await supabase.from('appointments').update({ status } as any).eq('id', id);
    setMonthAppointments(monthAppointments.map(a => a.id === id ? { ...a, status } : a));

    const messages: Record<string, { title: string; msg: string }> = {
      confirmed: { title: 'Confirmado', msg: `${clientName} confirmado.` },
      completed: { title: 'Concluído', msg: `${clientName} concluído.` },
      cancelled: { title: 'Cancelado', msg: `${clientName} cancelado.` },
    };
    const m = messages[status];
    if (m) await addNotification(m.title, m.msg, status === 'cancelled' ? 'warning' : 'success');
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getAppointmentsForDay = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return monthAppointments.filter(a => new Date(a.start_time).toDateString() === date.toDateString());
  };

  const navigateMonth = (delta: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCurrentMonth(newMonth);
  };

  const selectDay = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && currentMonth.getMonth() === selectedDate.getMonth() && currentMonth.getFullYear() === selectedDate.getFullYear();
  };

  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const openNewAppointment = () => { setFormData({ ...formData, date: selectedDate.toISOString().split('T')[0] }); setShowModal(true); };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { pending: '#f59e0b', confirmed: '#10b981', completed: '#3b82f6', cancelled: '#ef4444' };
    return colors[status] || '#94a3b8';
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const days = getDaysInMonth(currentMonth);

  return (
    <div className="appointments-page">
      <style jsx>{`
        .appointments-page { display: flex; gap: 24px; min-height: calc(100vh - 120px); }
        
        /* Calendar */
        .calendar-container { flex: 1; background: white; border-radius: 20px; border: 1px solid #e2e8f0; padding: 24px; }
        .calendar-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .calendar-title { font-size: 20px; font-weight: 600; }
        .calendar-nav { display: flex; gap: 8px; }
        .calendar-nav button { width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; cursor: pointer; font-size: 14px; }
        .calendar-nav button:hover { background: #f8fafc; }
        
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .calendar-weekday { padding: 12px; text-align: center; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; }
        
        .calendar-day { aspect-ratio: 1; padding: 8px; border-radius: 12px; cursor: pointer; transition: all 0.15s; position: relative; display: flex; flex-direction: column; align-items: center; }
        .calendar-day:hover { background: #f8fafc; }
        .calendar-day.empty { pointer-events: none; }
        .calendar-day.today { background: #f0fdfa; }
        .calendar-day.selected { background: linear-gradient(135deg, #00d1b2, #00a99d); color: white; }
        .calendar-day.selected .day-number { color: white; }
        .calendar-day.selected .appointment-dots .dot { background: white; }
        
        .day-number { font-size: 14px; font-weight: 500; color: #0f172a; margin-bottom: 4px; }
        .appointment-dots { display: flex; gap: 3px; flex-wrap: wrap; justify-content: center; }
        .dot { width: 6px; height: 6px; border-radius: 50%; }
        
        .calendar-legend { display: flex; gap: 16px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
        .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b; }
        .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
        
        /* Day Panel */
        .day-panel { width: 400px; background: white; border-radius: 20px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; }
        .day-panel-header { padding: 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .day-panel-title { font-size: 16px; font-weight: 600; }
        .day-panel-date { font-size: 13px; color: #64748b; }
        
        .day-appointments { flex: 1; overflow-y: auto; padding: 16px; }
        .day-appointment { display: flex; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 12px; margin-bottom: 12px; }
        .day-appointment:last-child { margin-bottom: 0; }
        .appt-time { min-width: 56px; padding: 8px; background: linear-gradient(135deg, #00d1b2, #00a99d); border-radius: 10px; color: white; text-align: center; }
        .appt-time-start { font-size: 14px; font-weight: 600; }
        .appt-time-end { font-size: 10px; opacity: 0.8; }
        .appt-info { flex: 1; }
        .appt-client { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
        .appt-service { font-size: 12px; color: #64748b; }
        .appt-actions { display: flex; flex-direction: column; gap: 4px; }
        .status-badge { font-size: 10px; padding: 4px 8px; border-radius: 6px; font-weight: 600; text-transform: uppercase; }
        .status-pending { background: #fef3c7; color: #d97706; }
        .status-confirmed { background: #d1fae5; color: #059669; }
        .status-completed { background: #dbeafe; color: #2563eb; }
        .status-cancelled { background: #fee2e2; color: #dc2626; opacity: 0.5; }
        
        .action-btns { display: flex; gap: 4px; margin-top: 8px; }
        .action-btn { padding: 4px 8px; font-size: 10px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; }
        .action-btn.confirm { background: #d1fae5; color: #059669; }
        .action-btn.complete { background: #dbeafe; color: #2563eb; }
        .action-btn.cancel { background: #fee2e2; color: #dc2626; }
        
        .empty-day { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center; }
        .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.4; }
        .empty-text { font-size: 14px; color: #64748b; margin-bottom: 16px; }
        
        .day-panel-footer { padding: 16px; border-top: 1px solid #e2e8f0; }
        .btn-new { width: 100%; padding: 12px; font-size: 14px; font-weight: 600; color: white; background: linear-gradient(135deg, #00d1b2, #00a99d); border: none; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
        .btn-new:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 209, 178, 0.35); }
        
        /* Modal */
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .modal { background: white; border-radius: 24px; width: 100%; max-width: 480px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; }
        .modal-title { font-size: 18px; font-weight: 600; }
        .modal-close { width: 36px; height: 36px; border-radius: 12px; background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 18px; }
        .modal-body { padding: 24px; }
        .form-group { margin-bottom: 16px; }
        .form-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; }
        .form-input, .form-select, .form-textarea { width: 100%; padding: 10px 14px; font-size: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #e2e8f0; background: #f8fafc; }
        .btn-secondary { padding: 10px 20px; font-size: 14px; font-weight: 500; background: white; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; }
        .btn-primary { padding: 10px 20px; font-size: 14px; font-weight: 600; color: white; background: linear-gradient(135deg, #00d1b2, #00a99d); border: none; border-radius: 10px; cursor: pointer; }
        
        @media (max-width: 900px) {
          .appointments-page { flex-direction: column; }
          .day-panel { width: 100%; }
        }
      `}</style>

      {/* Calendar */}
      <div className="calendar-container">
        <div className="calendar-header">
          <h2 className="calendar-title">
            {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="calendar-nav">
            <button onClick={() => navigateMonth(-1)}>◀</button>
            <button onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}>Hoje</button>
            <button onClick={() => navigateMonth(1)}>▶</button>
          </div>
        </div>

        <div className="calendar-grid">
          {weekDays.map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}

          {days.map((day, index) => {
            if (day === null) return <div key={`empty-${index}`} className="calendar-day empty" />;

            const dayAppts = getAppointmentsForDay(day);
            return (
              <div
                key={day}
                className={`calendar-day ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'selected' : ''}`}
                onClick={() => selectDay(day)}
              >
                <span className="day-number">{day}</span>
                {dayAppts.length > 0 && (
                  <div className="appointment-dots">
                    {dayAppts.slice(0, 4).map((a, i) => (
                      <div key={i} className="dot" style={{ background: getStatusColor(a.status) }} />
                    ))}
                    {dayAppts.length > 4 && <span style={{ fontSize: '10px' }}>+{dayAppts.length - 4}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="calendar-legend">
          <div className="legend-item"><div className="legend-dot" style={{ background: '#f59e0b' }} /> Pendente</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: '#10b981' }} /> Confirmado</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: '#3b82f6' }} /> Concluído</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: '#ef4444' }} /> Cancelado</div>
        </div>
      </div>

      {/* Day Panel */}
      <div className="day-panel">
        <div className="day-panel-header">
          <div>
            <div className="day-panel-title">
              {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
            </div>
            <div className="day-panel-date">
              {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <span style={{ fontSize: '13px', color: '#64748b' }}>{appointments.length} agendamento(s)</span>
        </div>

        <div className="day-appointments">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Carregando...</div>
          ) : appointments.length > 0 ? (
            appointments.map(a => (
              <div key={a.id} className="day-appointment">
                <div className="appt-time">
                  <div className="appt-time-start">{formatTime(a.start_time)}</div>
                  <div className="appt-time-end">{formatTime(a.end_time)}</div>
                </div>
                <div className="appt-info">
                  <div className="appt-client">{a.clients?.name}</div>
                  <div className="appt-service">✂️ {a.services?.name} • {formatCurrency(a.price)}</div>
                  <div className="action-btns">
                    {a.status === 'pending' && <button className="action-btn confirm" onClick={() => updateStatus(a.id, 'confirmed', a.clients?.name)}>✓ Confirmar</button>}
                    {a.status === 'confirmed' && <button className="action-btn complete" onClick={() => updateStatus(a.id, 'completed', a.clients?.name)}>✓ Concluir</button>}
                    {a.status !== 'cancelled' && a.status !== 'completed' && <button className="action-btn cancel" onClick={() => updateStatus(a.id, 'cancelled', a.clients?.name)}>✕</button>}
                  </div>
                </div>
                <div className="appt-actions">
                  <span className={`status-badge status-${a.status}`}>
                    {a.status === 'pending' ? 'Pendente' : a.status === 'confirmed' ? 'Confirmado' : a.status === 'completed' ? 'Concluído' : 'Cancelado'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-day">
              <div className="empty-icon">📅</div>
              <div className="empty-text">Nenhum agendamento<br />para este dia</div>
            </div>
          )}
        </div>

        <div className="day-panel-footer">
          <button className="btn-new" onClick={openNewAppointment}>
            ➕ Novo Agendamento
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Novo Agendamento</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Cliente *</label>
                  <select className="form-select" value={formData.client_id} onChange={e => setFormData({ ...formData, client_id: e.target.value })} required>
                    <option value="">Selecione...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Serviço *</label>
                  <select className="form-select" value={formData.service_id} onChange={e => setFormData({ ...formData, service_id: e.target.value })} required>
                    <option value="">Selecione...</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} - {formatCurrency(s.price)}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Data *</label>
                    <input type="date" className="form-input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Horário *</label>
                    <input type="time" className="form-input" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Observações</label>
                  <textarea className="form-textarea" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Criando...' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
