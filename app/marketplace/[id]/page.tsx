'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import './profile.css';

interface Provider {
    id: string;
    name: string;
    business_name: string;
    bio: string;
    city: string;
    state: string;
    address: string;
    phone: string;
    avatar_url: string;
}

interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    duration_minutes: number;
    image_url: string;
    category: string;
}

interface ServiceImage {
    id: string;
    image_url: string;
}

const categoryNames: Record<string, string> = {
    manicure: 'Manicure & Pedicure',
    maquiagem: 'Maquiagem',
    depilacao: 'Depilação',
    cilios: 'Design de Cílios',
    pele: 'Limpeza de Pele',
    harmonizacao: 'Harmonização Facial',
    massagem: 'Massagem',
    cabelo: 'Cabelo & Penteados',
    outros: 'Outros Serviços',
};

export default function ProviderProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [provider, setProvider] = useState<Provider | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const supabase = createClient();

    useEffect(() => {
        loadProvider();
        checkUser();
    }, [params.id]);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
    };

    const loadProvider = async () => {
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', params.id)
            .eq('is_public', true)
            .single();

        if (!profileData) {
            router.push('/marketplace');
            return;
        }

        setProvider(profileData);

        const { data: servicesData } = await supabase
            .from('services')
            .select('*')
            .eq('user_id', params.id)
            .eq('active', true)
            .order('category', { ascending: true })
            .order('name', { ascending: true });

        setServices(servicesData || []);

        // Collect all images from services
        const images: string[] = [];
        if (profileData.avatar_url) images.push(profileData.avatar_url);
        (servicesData || []).forEach((s: Service) => {
            if (s.image_url) images.push(s.image_url);
        });

        // Load additional images from service_images table
        const { data: additionalImages } = await supabase
            .from('service_images')
            .select('image_url')
            .in('service_id', (servicesData || []).map((s: Service) => s.id));

        (additionalImages || []).forEach((img: ServiceImage) => {
            if (img.image_url) images.push(img.image_url);
        });

        setGalleryImages(images);
        setLoading(false);
    };

    const openMessageModal = (service?: Service) => {
        if (!currentUser) {
            setSelectedService(service || null);
            setShowLoginModal(true);
            return;
        }
        setSelectedService(service || null);
        setMessage(service ? `Olá! Tenho interesse no serviço "${service.name}".` : '');
        setShowMessageModal(true);
    };

    const sendMessage = async () => {
        if (!currentUser || !message.trim()) return;
        setSending(true);

        const user1 = currentUser.id < provider!.id ? currentUser.id : provider!.id;
        const user2 = currentUser.id < provider!.id ? provider!.id : currentUser.id;

        let { data: conversation } = await supabase
            .from('conversations')
            .select('id')
            .eq('user1_id', user1)
            .eq('user2_id', user2)
            .single();

        if (!conversation) {
            const { data } = await supabase
                .from('conversations')
                .insert({ user1_id: user1, user2_id: user2 })
                .select('id')
                .single();
            conversation = data;
        }

        if (conversation) {
            await supabase.from('messages').insert({
                conversation_id: conversation.id,
                sender_id: currentUser.id,
                content: message,
            });
            await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversation.id);
        }

        setSending(false);
        setShowMessageModal(false);
        alert('Mensagem enviada! Você pode acompanhar pelo seu painel.');
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const formatDuration = (minutes: number) => minutes < 60 ? `${minutes}min` : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}min` : ''}`;
    const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

    // Group services by category
    const servicesByCategory = services.reduce((acc: Record<string, Service[]>, service) => {
        const cat = service.category || 'outros';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(service);
        return acc;
    }, {});

    if (loading) {
        return <div className="profile-loading">Carregando...</div>;
    }

    if (!provider) return null;

    const mapUrl = provider.address && provider.city
        ? `https://maps.google.com/maps?q=${encodeURIComponent(`${provider.address}, ${provider.city}, ${provider.state}`)}&output=embed`
        : null;

    return (
        <div className="profile-page">
            {/* Header */}
            <header className="profile-header">
                <div className="header-container">
                    <Link href="/" className="logo">
                        <span>💅</span>
                        <span className="logo-text">BeautyPro</span>
                    </Link>
                    <div className="header-search">
                        <input type="text" placeholder="🔍 Pesquise serviços ou empresas" />
                    </div>
                    <div className="header-actions">
                        {currentUser ? (
                            <Link href="/dashboard" className="btn-outline">Meu Painel</Link>
                        ) : (
                            <>
                                <Link href="/login" className="btn-text">Entrar</Link>
                                <Link href="/signup" className="btn-outline">Cadastrar</Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="profile-content">
                {/* Left Column - Main */}
                <main className="profile-main">
                    {/* Gallery */}
                    {galleryImages.length > 0 && (
                        <div className="gallery-section">
                            <div className="gallery-main" onClick={() => { setGalleryIndex(0); setShowGalleryModal(true); }}>
                                <img src={galleryImages[0]} alt="Principal" />
                                {galleryImages.length > 1 && (
                                    <button className="gallery-btn" onClick={(e) => { e.stopPropagation(); setShowGalleryModal(true); }}>
                                        Mostrar todas as fotos
                                    </button>
                                )}
                            </div>
                            {galleryImages.length > 1 && (
                                <div className="gallery-thumbs">
                                    {galleryImages.slice(1, 5).map((img, i) => (
                                        <div
                                            key={i}
                                            className="gallery-thumb"
                                            onClick={() => { setGalleryIndex(i + 1); setShowGalleryModal(true); }}
                                        >
                                            <img src={img} alt={`Foto ${i + 2}`} />
                                            {i === 3 && galleryImages.length > 5 && (
                                                <div className="thumb-more">+{galleryImages.length - 5}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Business Info */}
                    <div className="business-info">
                        <div className="business-header">
                            <div className="business-avatar">
                                {provider.avatar_url ? <img src={provider.avatar_url} alt="" /> : getInitials(provider.name || provider.business_name)}
                            </div>
                            <div className="business-details">
                                <h1>{provider.business_name || provider.name}</h1>
                                <p className="address">{provider.address && `${provider.address}, `}{provider.city}{provider.state && `, ${provider.state}`}</p>
                                <div className="rating">
                                    <span className="stars">⭐ 4.94</span>
                                    <span className="count">(197 avaliações)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    {provider.bio && (
                        <div className="section">
                            <h2>Sobre nós</h2>
                            <p>{provider.bio}</p>
                        </div>
                    )}

                    {/* Services */}
                    <div className="section services-section">
                        <h2>Serviços</h2>
                        <div className="services-search">
                            <input type="text" placeholder="🔍 Buscar serviços" />
                        </div>

                        {Object.entries(servicesByCategory).map(([category, catServices]) => (
                            <div key={category} className="service-category">
                                <div className="category-header">
                                    <h3>{categoryNames[category] || category}</h3>
                                    <span className="service-count">{catServices.length} serviço(s)</span>
                                </div>
                                <div className="services-list">
                                    {catServices.map(service => (
                                        <div key={service.id} className="service-item">
                                            <div className="service-info">
                                                <span className="service-name">{service.name}</span>
                                                {service.description && <span className="service-desc">{service.description}</span>}
                                            </div>
                                            <div className="service-meta">
                                                <div className="service-price-time">
                                                    <span className="price">{formatCurrency(service.price)}</span>
                                                    <span className="duration">{formatDuration(service.duration_minutes)}</span>
                                                </div>
                                                <button className="btn-reserve" onClick={() => openMessageModal(service)}>
                                                    Reservar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </main>

                {/* Right Sidebar */}
                <aside className="profile-sidebar">
                    {/* CTA Button */}
                    <button className="btn-primary-lg" onClick={() => openMessageModal()}>
                        Reservar agora
                    </button>

                    {/* Map */}
                    {mapUrl && (
                        <div className="sidebar-card">
                            <div className="map-container">
                                <iframe src={mapUrl} width="100%" height="200" style={{ border: 0, borderRadius: '12px' }} loading="lazy" />
                            </div>
                            <div className="location-info">
                                <div className="location-icon">📍</div>
                                <div className="location-text">
                                    <strong>{provider.business_name || provider.name}</strong>
                                    <span>{provider.address && `${provider.address}, `}{provider.city}{provider.state && `, ${provider.state}`}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contact */}
                    <div className="sidebar-card">
                        <h3>Contato & Horário</h3>
                        {provider.phone && (
                            <div className="contact-row">
                                <span className="contact-icon">📞</span>
                                <span>{provider.phone}</span>
                                <a href={`tel:${provider.phone}`} className="btn-outline-sm">Ligar</a>
                            </div>
                        )}
                        <div className="hours-row">
                            <span>Hoje</span>
                            <span className="hours">09:00 - 19:00</span>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Gallery Modal */}
            {showGalleryModal && (
                <div className="modal-backdrop" onClick={() => setShowGalleryModal(false)}>
                    <div className="gallery-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowGalleryModal(false)}>✕</button>
                        <img src={galleryImages[galleryIndex]} alt="" />
                        <div className="gallery-nav">
                            <button onClick={() => setGalleryIndex((galleryIndex - 1 + galleryImages.length) % galleryImages.length)}>‹</button>
                            <span>{galleryIndex + 1} / {galleryImages.length}</span>
                            <button onClick={() => setGalleryIndex((galleryIndex + 1) % galleryImages.length)}>›</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Login Required Modal */}
            {showLoginModal && (
                <div className="modal-backdrop" onClick={() => setShowLoginModal(false)}>
                    <div className="login-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowLoginModal(false)}>✕</button>
                        <div className="login-modal-content">
                            <div className="login-icon">🔐</div>
                            <h2>Entre para continuar</h2>
                            <p>Você precisa estar logado para enviar mensagens e reservar serviços.</p>

                            {selectedService && (
                                <div className="selected-service-preview">
                                    <strong>{selectedService.name}</strong>
                                    <span>{formatCurrency(selectedService.price)}</span>
                                </div>
                            )}

                            <div className="login-actions">
                                <Link href={`/login?next=/marketplace/${provider.id}`} className="btn-primary-full">
                                    Entrar na minha conta
                                </Link>
                                <Link href={`/signup?next=/marketplace/${provider.id}`} className="btn-secondary-full">
                                    Criar conta grátis
                                </Link>
                            </div>

                            <p className="login-hint">O cadastro é rápido e gratuito!</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Message Modal */}
            {showMessageModal && (
                <div className="modal-backdrop" onClick={() => setShowMessageModal(false)}>
                    <div className="message-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Enviar mensagem</h2>
                            <button className="modal-close" onClick={() => setShowMessageModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {selectedService && (
                                <div className="selected-service">
                                    <strong>{selectedService.name}</strong> - {formatCurrency(selectedService.price)}
                                </div>
                            )}
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                rows={4}
                                placeholder="Escreva sua mensagem..."
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="btn-outline" onClick={() => setShowMessageModal(false)}>Cancelar</button>
                            <button className="btn-primary" onClick={sendMessage} disabled={sending || !message.trim()}>
                                {sending ? 'Enviando...' : 'Enviar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
