import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import './marketplace.css';

const categories = [
    { id: 'manicure', name: 'Manicure', icon: '💅' },
    { id: 'maquiagem', name: 'Maquiagem', icon: '💄' },
    { id: 'depilacao', name: 'Depilação', icon: '✨' },
    { id: 'cilios', name: 'Cílios', icon: '👁️' },
    { id: 'pele', name: 'Skincare', icon: '🧴' },
    { id: 'harmonizacao', name: 'Harmonização', icon: '💎' },
    { id: 'massagem', name: 'Massagem', icon: '💆‍♀️' },
    { id: 'cabelo', name: 'Cabelo', icon: '💇‍♀️' },
];

export default async function MarketplacePage({
    searchParams,
}: {
    searchParams: { q?: string; city?: string; category?: string };
}) {
    const supabase = await createClient();

    let query = supabase
        .from('profiles')
        .select('id, name, business_name, bio, city, state, avatar_url')
        .eq('is_public', true);

    if (searchParams.city) {
        query = query.ilike('city', `%${searchParams.city}%`);
    }

    const { data: providers } = await query;
    const providerIds = providers?.map((p: any) => p.id) || [];

    let servicesQuery = supabase
        .from('services')
        .select('*')
        .in('user_id', providerIds.length > 0 ? providerIds : ['none'])
        .eq('active', true);

    if (searchParams.category) {
        servicesQuery = servicesQuery.eq('category', searchParams.category);
    }

    const { data: servicesData } = await servicesQuery;

    const providersWithServices = (providers || []).map((provider: any) => ({
        ...provider,
        services: (servicesData || []).filter((s: any) => s.user_id === provider.id),
    })).filter((p: any) => p.services.length > 0);

    let filteredProviders = providersWithServices;
    if (searchParams.q) {
        const searchLower = searchParams.q.toLowerCase();
        filteredProviders = providersWithServices.filter((p: any) =>
            p.business_name?.toLowerCase().includes(searchLower) ||
            p.name?.toLowerCase().includes(searchLower) ||
            p.services.some((s: any) => s.name.toLowerCase().includes(searchLower))
        );
    }

    const cities = Array.from(new Set(providersWithServices.map((p: any) => p.city).filter(Boolean)));
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

    return (
        <div className="marketplace">
            {/* Header */}
            <header className="mp-header">
                <div className="mp-container mp-header-inner">
                    <Link href="/" className="mp-logo">
                        <span>💅</span>
                        <span className="mp-logo-text">BeautyPro</span>
                    </Link>
                    <div className="mp-header-actions">
                        <Link href="/login" className="mp-link">Entrar</Link>
                        <Link href="/signup" className="mp-btn">Cadastrar</Link>
                    </div>
                </div>
            </header>

            {/* Hero Search */}
            <section className="mp-hero">
                <div className="mp-container">
                    <div className="mp-hero-content">
                        <h1>Encontre serviços de beleza</h1>
                        <p>Profissionais qualificadas esperando por você</p>
                    </div>
                    <form className="mp-search-bar" action="/marketplace" method="GET">
                        <div className="mp-search-input">
                            <span>🔍</span>
                            <input type="text" name="q" placeholder="Buscar serviço ou profissional..." defaultValue={searchParams.q} />
                        </div>
                        <select name="city" defaultValue={searchParams.city || ''}>
                            <option value="">Todas as cidades</option>
                            {cities.map((city: any) => <option key={city} value={city}>{city}</option>)}
                        </select>
                        <select name="category" defaultValue={searchParams.category || ''}>
                            <option value="">Todas categorias</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                        </select>
                        <button type="submit" className="mp-btn">Buscar</button>
                    </form>
                </div>
            </section>

            {/* Categories */}
            <section className="mp-categories">
                <div className="mp-container">
                    <div className="mp-cat-scroll">
                        <Link href="/marketplace" className={`mp-cat-chip ${!searchParams.category ? 'active' : ''}`}>
                            Todos
                        </Link>
                        {categories.map(cat => (
                            <Link
                                key={cat.id}
                                href={`/marketplace?category=${cat.id}`}
                                className={`mp-cat-chip ${searchParams.category === cat.id ? 'active' : ''}`}
                            >
                                {cat.icon} {cat.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Results */}
            <section className="mp-results">
                <div className="mp-container">
                    <div className="mp-results-header">
                        <h2>{filteredProviders.length} profissional(is) encontrado(s)</h2>
                        {(searchParams.category || searchParams.q) && (
                            <Link href="/marketplace" className="mp-clear">Limpar filtros ✕</Link>
                        )}
                    </div>

                    {filteredProviders.length > 0 ? (
                        <div className="mp-grid">
                            {filteredProviders.map((provider: any) => (
                                <Link key={provider.id} href={`/marketplace/${provider.id}`} className="mp-card">
                                    <div className="mp-card-header">
                                        <div className="mp-avatar">
                                            {provider.avatar_url ? (
                                                <img src={provider.avatar_url} alt="" />
                                            ) : (
                                                getInitials(provider.name || provider.business_name)
                                            )}
                                        </div>
                                        <div>
                                            <h3>{provider.business_name || provider.name}</h3>
                                            <p>📍 {provider.city}{provider.state && `, ${provider.state}`}</p>
                                        </div>
                                    </div>
                                    {provider.bio && <p className="mp-bio">{provider.bio}</p>}
                                    <div className="mp-services">
                                        {provider.services.slice(0, 3).map((service: any) => (
                                            <div key={service.id} className="mp-service-row">
                                                <span>{service.name}</span>
                                                <span className="mp-price">{formatCurrency(service.price)}</span>
                                            </div>
                                        ))}
                                        {provider.services.length > 3 && (
                                            <div className="mp-more">+{provider.services.length - 3} mais serviços</div>
                                        )}
                                    </div>
                                    <span className="mp-cta">Ver perfil →</span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="mp-empty">
                            <span>🔍</span>
                            <h3>Nenhum profissional encontrado</h3>
                            <p>Tente ajustar sua busca</p>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section className="mp-cta-section">
                <div className="mp-container">
                    <h2>É profissional de beleza?</h2>
                    <p>Cadastre-se e mostre seus serviços</p>
                    <Link href="/signup" className="mp-btn mp-btn-lg">Começar Grátis</Link>
                </div>
            </section>
        </div>
    );
}
