'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useNotifications } from '@/contexts/NotificationContext';

const categories = [
  { id: 'manicure', name: 'Manicure & Pedicure' },
  { id: 'maquiagem', name: 'Maquiagem' },
  { id: 'depilacao', name: 'Depilação' },
  { id: 'cilios', name: 'Design de Cílios' },
  { id: 'pele', name: 'Limpeza de Pele' },
  { id: 'harmonizacao', name: 'Harmonização Facial' },
  { id: 'massagem', name: 'Massagem' },
  { id: 'cabelo', name: 'Cabelo & Penteados' },
  { id: 'outros', name: 'Outros Serviços' },
];

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  active: boolean;
  image_url: string;
  category: string;
  images?: string[];
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '30',
    active: true,
    category: 'outros',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const { addNotification } = useNotifications();

  useEffect(() => { loadServices(); }, []);

  const loadServices = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (data) {
      // Load additional images for each service
      const servicesWithImages = await Promise.all(data.map(async (service) => {
        const { data: imagesData } = await supabase
          .from('service_images')
          .select('image_url')
          .eq('service_id', service.id)
          .order('display_order');

        const allImages: string[] = [];
        if (service.image_url) allImages.push(service.image_url);
        (imagesData || []).forEach((img: { image_url: string }) => allImages.push(img.image_url));

        return { ...service, images: allImages };
      }));

      setServices(servicesWithImages);
    }
    setLoading(false);
  };

  const openModal = async (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        price: service.price.toString(),
        duration_minutes: service.duration_minutes.toString(),
        active: service.active,
        category: service.category || 'outros',
      });
      setImages(service.images || []);
    } else {
      setEditingService(null);
      setFormData({ name: '', description: '', price: '', duration_minutes: '30', active: true, category: 'outros' });
      setImages([]);
    }
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_${i}.${fileExt}`;

      const { error } = await supabase.storage
        .from('service-images')
        .upload(fileName, file);

      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('service-images')
          .getPublicUrl(fileName);
        newImages.push(publicUrl);
      }
    }

    setImages([...images, ...newImages]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const serviceData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      duration_minutes: parseInt(formData.duration_minutes),
      active: formData.active,
      image_url: images[0] || null,
      category: formData.category,
    };

    let serviceId = editingService?.id;

    if (editingService) {
      await supabase
        .from('services')
        .update({ ...serviceData, updated_at: new Date().toISOString() })
        .eq('id', editingService.id);

      // Delete old additional images
      await supabase.from('service_images').delete().eq('service_id', editingService.id);
    } else {
      const { data } = await supabase
        .from('services')
        .insert({ user_id: user.id, ...serviceData })
        .select()
        .single();
      serviceId = data?.id;
    }

    // Insert additional images (skip the first one as it's the main image)
    if (serviceId && images.length > 1) {
      const additionalImages = images.slice(1).map((url, index) => ({
        service_id: serviceId,
        image_url: url,
        display_order: index,
      }));
      await supabase.from('service_images').insert(additionalImages);
    }

    await addNotification(
      editingService ? 'Serviço atualizado' : 'Serviço cadastrado',
      `${formData.name} foi ${editingService ? 'atualizado' : 'adicionado'}.`,
      'success'
    );

    setSaving(false);
    setShowModal(false);
    loadServices();
  };

  const toggleActive = async (service: Service) => {
    await supabase.from('services').update({ active: !service.active }).eq('id', service.id);
    setServices(services.map(s => s.id === service.id ? { ...s, active: !s.active } : s));
  };

  const deleteService = async (id: string) => {
    if (!confirm('Excluir este serviço?')) return;
    await supabase.from('services').delete().eq('id', id);
    setServices(services.filter(s => s.id !== id));
    await addNotification('Serviço removido', 'O serviço foi excluído.', 'info');
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="page">
      <style jsx>{`
        .page { display: flex; flex-direction: column; gap: 24px; }
        .header { display: flex; justify-content: space-between; align-items: center; }
        .count { color: #64748b; font-size: 14px; }
        .btn { padding: 12px 20px; font-size: 14px; font-weight: 600; border-radius: 12px; border: none; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
        .btn-primary { background: linear-gradient(135deg, #00d1b2, #00a99d); color: white; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 209, 178, 0.35); }
        .btn-secondary { background: white; color: #0f172a; border: 1px solid #e2e8f0; }
        .btn-ghost { background: none; color: #64748b; padding: 8px; }
        .btn-sm { padding: 8px 14px; font-size: 13px; }
        
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
        .card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; transition: all 0.2s; }
        .card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .card.inactive { opacity: 0.5; }
        
        .card-gallery { display: flex; gap: 4px; height: 200px; overflow: hidden; }
        .card-gallery-main { flex: 2; background: #f0f0f0; }
        .card-gallery-main img { width: 100%; height: 100%; object-fit: cover; }
        .card-gallery-thumbs { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .card-gallery-thumb { flex: 1; background: #f0f0f0; position: relative; }
        .card-gallery-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .card-gallery-more { position: absolute; inset: 0; background: rgba(0,0,0,0.6); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; }
        .card-placeholder { height: 200px; background: linear-gradient(135deg, #f0fdfa, #e0f2fe); display: flex; align-items: center; justify-content: center; font-size: 48px; }
        
        .card-body { padding: 20px; }
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .service-name { font-size: 17px; font-weight: 600; color: #0f172a; }
        .category-badge { font-size: 11px; background: #f0fdfa; color: #00a99d; padding: 4px 10px; border-radius: 50px; }
        .service-desc { font-size: 14px; color: #64748b; margin-bottom: 12px; }
        .service-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .price { font-size: 24px; font-weight: 700; color: #00d1b2; }
        .duration { font-size: 13px; color: #64748b; background: #f8fafc; padding: 6px 12px; border-radius: 50px; }
        .card-actions { display: flex; gap: 8px; align-items: center; }
        
        .toggle { width: 48px; height: 26px; background: #e2e8f0; border-radius: 50px; position: relative; cursor: pointer; transition: background 0.2s; }
        .toggle.active { background: #00d1b2; }
        .toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .toggle.active::after { transform: translateX(22px); }
        
        .empty { background: white; border: 2px dashed #e2e8f0; border-radius: 24px; padding: 60px; text-align: center; }
        .empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.4; }
        .empty h3 { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
        .empty p { color: #64748b; font-size: 15px; margin-bottom: 24px; }
        
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .modal { background: white; border-radius: 24px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; }
        .modal-title { font-size: 18px; font-weight: 600; }
        .modal-close { width: 36px; height: 36px; border-radius: 12px; background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 18px; }
        .modal-body { padding: 24px; }
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; color: #0f172a; }
        .form-input, .form-textarea, .form-select { width: 100%; padding: 12px 16px; font-size: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; }
        .form-input:focus, .form-textarea:focus, .form-select:focus { outline: none; border-color: #00d1b2; box-shadow: 0 0 0 3px rgba(0,209,178,0.1); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        
        .images-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; margin-bottom: 12px; }
        .image-item { position: relative; aspect-ratio: 1; border-radius: 12px; overflow: hidden; }
        .image-item img { width: 100%; height: 100%; object-fit: cover; }
        .image-item.main::before { content: 'Principal'; position: absolute; top: 8px; left: 8px; padding: 4px 8px; background: #00d1b2; color: white; font-size: 10px; font-weight: 600; border-radius: 4px; }
        .image-remove { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 14px; }
        
        .upload-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 24px; border: 2px dashed #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: #fafafa; }
        .upload-btn:hover { border-color: #00d1b2; background: #f0fdfa; }
        .upload-icon { font-size: 32px; }
        .upload-text { font-size: 14px; color: #64748b; }
        .upload-text strong { color: #00d1b2; }
        
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid #e2e8f0; background: #f8fafc; }
      `}</style>

      <div className="header">
        <span className="count">{services.length} serviço(s) cadastrado(s)</span>
        <button className="btn btn-primary" onClick={() => openModal()}>➕ Novo Serviço</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Carregando...</div>
      ) : services.length > 0 ? (
        <div className="grid">
          {services.map(service => (
            <div key={service.id} className={`card ${!service.active ? 'inactive' : ''}`}>
              {service.images && service.images.length > 0 ? (
                <div className="card-gallery">
                  <div className="card-gallery-main">
                    <img src={service.images[0]} alt={service.name} />
                  </div>
                  {service.images.length > 1 && (
                    <div className="card-gallery-thumbs">
                      {service.images.slice(1, 4).map((img, i) => (
                        <div key={i} className="card-gallery-thumb">
                          <img src={img} alt="" />
                          {i === 2 && service.images!.length > 4 && (
                            <div className="card-gallery-more">+{service.images!.length - 4}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="card-placeholder">💅</div>
              )}
              <div className="card-body">
                <div className="card-header">
                  <span className="service-name">{service.name}</span>
                  <span className="category-badge">{categories.find(c => c.id === service.category)?.name || 'Outros'}</span>
                </div>
                {service.description && <p className="service-desc">{service.description}</p>}
                <div className="service-info">
                  <span className="price">{formatCurrency(service.price)}</span>
                  <span className="duration">🕐 {service.duration_minutes}min</span>
                </div>
                <div className="card-actions">
                  <div className={`toggle ${service.active ? 'active' : ''}`} onClick={() => toggleActive(service)} />
                  <button className="btn btn-secondary btn-sm" onClick={() => openModal(service)}>✏️ Editar</button>
                  <button className="btn btn-ghost" onClick={() => deleteService(service.id)}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">
          <div className="empty-icon">💅</div>
          <h3>Nenhum serviço cadastrado</h3>
          <p>Cadastre seus serviços com fotos do procedimento para aparecer no marketplace</p>
          <button className="btn btn-primary" onClick={() => openModal()}>➕ Cadastrar Primeiro Serviço</button>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Multiple Images Upload */}
                <div className="form-group">
                  <label className="form-label">Fotos do Procedimento (primeira será a principal)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />

                  {images.length > 0 && (
                    <div className="images-grid">
                      {images.map((img, index) => (
                        <div key={index} className={`image-item ${index === 0 ? 'main' : ''}`}>
                          <img src={img} alt={`Foto ${index + 1}`} />
                          <button type="button" className="image-remove" onClick={() => removeImage(index)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="upload-btn" onClick={() => fileInputRef.current?.click()}>
                    <div className="upload-icon">{uploading ? '⏳' : '📷'}</div>
                    <div className="upload-text">
                      {uploading ? 'Enviando...' : <><strong>Clique para adicionar fotos</strong><br />Você pode selecionar múltiplas imagens</>}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nome do Serviço *</label>
                  <input type="text" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Ex: Manicure Completa" />
                </div>

                <div className="form-group">
                  <label className="form-label">Categoria *</label>
                  <select className="form-select" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <textarea className="form-textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Descreva o serviço para suas clientes..." />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Preço (R$) *</label>
                    <input type="number" step="0.01" className="form-input" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required placeholder="50.00" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duração (min) *</label>
                    <input type="number" className="form-input" value={formData.duration_minutes} onChange={e => setFormData({ ...formData, duration_minutes: e.target.value })} required placeholder="30" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : (editingService ? 'Salvar Alterações' : 'Criar Serviço')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
