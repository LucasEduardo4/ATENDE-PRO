import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'AtendePro - Gestão de Agendamentos',
    description: 'Organize sua agenda, gerencie clientes e aumente sua receita com o AtendePro.',
    keywords: ['agendamento', 'gestão', 'clientes', 'serviços', 'profissional autônomo'],
    authors: [{ name: 'AtendePro' }],
    openGraph: {
        title: 'AtendePro - Gestão de Agendamentos',
        description: 'Organize sua agenda, gerencie clientes e aumente sua receita.',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>{children}</body>
        </html>
    );
}
